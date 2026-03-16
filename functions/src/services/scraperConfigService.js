/**
 * Scraper Configuration Service
 * Manages proxy rotation, rate limiting, and scraper settings
 * 
 * Features:
 * - Proxy rotation (per_request | per_job)
 * - Dynamic configuration loading
 * - Health checks
 */

const admin = require('firebase-admin');
const db = admin.firestore();

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
    // Proxy settings
    proxy_enabled: false,
    proxy_list: [],
    rotation_mode: 'per_request', // 'per_request' | 'per_job'
    
    // Email verification
    email_verification_enabled: true,
    allow_personal_emails: false,
    check_mx_records: true,
    
    // Worker limits
    max_open_pages: 3,
    max_parallel_scrapes: 2,
    
    // Rate limiting
    global_concurrent_jobs: 3,
    per_user_jobs: 1,
    request_delay: 2000, // ms
    
    // Timeouts
    page_load_timeout: 15000, // ms
    max_job_runtime: 40 * 60 * 1000, // 40 minutes
    job_timeout_threshold: 45 * 60 * 1000, // 45 minutes
    
    // Performance
    max_websites_per_job: 500,
    max_retries: 3,
    retry_delay: 2000, // ms
    
    // System health
    require_health_check: true
};

// ============================================================================
// PROXY MANAGEMENT
// ============================================================================

let currentProxyIndex = 0;

/**
 * Get next proxy from rotation
 */
const getNextProxy = (proxyList, rotationMode) => {
    if (!proxyList || proxyList.length === 0) {
        return null;
    }
    
    if (rotationMode === 'per_request') {
        // Round-robin rotation
        const proxy = proxyList[currentProxyIndex];
        currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
        return proxy;
    }
    
    if (rotationMode === 'per_job') {
        // Random selection per job
        return proxyList[Math.floor(Math.random() * proxyList.length)];
    }
    
    return proxyList[0];
};

/**
 * Format proxy for Puppeteer args
 */
const formatProxyArg = (proxy) => {
    if (!proxy) return null;
    
    // Support formats: "ip:port" or "http://ip:port"
    if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
        return `--proxy-server=${proxy}`;
    }
    
    return `--proxy-server=http://${proxy}`;
};

/**
 * Reset proxy rotation index
 */
const resetProxyRotation = () => {
    currentProxyIndex = 0;
};

// ============================================================================
// CONFIGURATION MANAGEMENT
// ============================================================================

/**
 * Load scraper configuration from Firestore
 */
const loadScraperConfig = async () => {
    try {
        const configDoc = await db.collection('system_config').doc('scraper_config').get();
        
        if (!configDoc.exists) {
            console.log('⚙️  Using default scraper configuration');
            return DEFAULT_CONFIG;
        }
        
        const config = configDoc.data();
        
        // Merge with defaults
        return {
            ...DEFAULT_CONFIG,
            ...config
        };
    } catch (error) {
        console.error('Error loading scraper config:', error);
        return DEFAULT_CONFIG;
    }
};

/**
 * Save scraper configuration to Firestore
 */
const saveScraperConfig = async (config) => {
    try {
        await db.collection('system_config').doc('scraper_config').set({
            ...config,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('✅ Scraper configuration saved');
        return { success: true };
    } catch (error) {
        console.error('Error saving scraper config:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get current configuration (cached or fresh)
 */
let cachedConfig = null;
let configLoadTime = null;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getScraperConfig = async (forceRefresh = false) => {
    const now = Date.now();
    
    if (!forceRefresh && cachedConfig && configLoadTime && (now - configLoadTime < CONFIG_CACHE_TTL)) {
        return cachedConfig;
    }
    
    cachedConfig = await loadScraperConfig();
    configLoadTime = now;
    
    return cachedConfig;
};

// ============================================================================
// PUPPETEER LAUNCH OPTIONS
// ============================================================================

/**
 * Get Puppeteer launch options with proxy support
 */
const getPuppeteerLaunchOptions = async (useProxy = true) => {
    const config = await getScraperConfig();
    
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-web-security'
    ];
    
    // Add proxy if enabled
    if (useProxy && config.proxy_enabled && config.proxy_list.length > 0) {
        const proxy = getNextProxy(config.proxy_list, config.rotation_mode);
        if (proxy) {
            const proxyArg = formatProxyArg(proxy);
            if (proxyArg) {
                args.push(proxyArg);
                console.log(`🔄 Using proxy: ${proxy}`);
            }
        }
    }
    
    return {
        headless: true,
        args,
        timeout: config.page_load_timeout
    };
};

// ============================================================================
// SYSTEM HEALTH CHECKS
// ============================================================================

/**
 * Check system health before starting job
 * Firestore-based health check (no Redis dependency)
 */
const checkSystemHealth = async () => {
    const health = {
        healthy: true,
        checks: {
            firestore: false,
            queue: false
        },
        errors: []
    };
    
    // Check Firestore connection
    try {
        await db.collection('lead_finder_queue').limit(1).get();
        health.checks.firestore = true;
        health.checks.queue = true;
    } catch (error) {
        health.healthy = false;
        health.checks.firestore = false;
        health.checks.queue = false;
        health.errors.push('Firestore connection failed');
    }
    
    return health;
};

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

/**
 * Check if global job limit reached
 */
const checkGlobalJobLimit = async () => {
    const config = await getScraperConfig();
    
    try {
        const activeJobs = await db.collection('lead_finder_jobs')
            .where('status', '==', 'in_progress')
            .get();
        
        return {
            allowed: activeJobs.size < config.global_concurrent_jobs,
            current: activeJobs.size,
            limit: config.global_concurrent_jobs
        };
    } catch (error) {
        console.error('Error checking global job limit:', error);
        return { allowed: true, current: 0, limit: config.global_concurrent_jobs };
    }
};

/**
 * Check if user job limit reached
 */
const checkUserJobLimit = async (userId) => {
    const config = await getScraperConfig();
    
    try {
        const userJobs = await db.collection('lead_finder_jobs')
            .where('userId', '==', userId)
            .where('status', '==', 'in_progress')
            .get();
        
        return {
            allowed: userJobs.size < config.per_user_jobs,
            current: userJobs.size,
            limit: config.per_user_jobs
        };
    } catch (error) {
        console.error('Error checking user job limit:', error);
        return { allowed: true, current: 0, limit: config.per_user_jobs };
    }
};

// ============================================================================
// TIMEOUT DETECTION
// ============================================================================

/**
 * Find and mark timed-out jobs
 */
const detectTimedOutJobs = async () => {
    const config = await getScraperConfig();
    const now = Date.now();
    const timeoutThreshold = config.job_timeout_threshold;
    
    try {
        const inProgressJobs = await db.collection('lead_finder_jobs')
            .where('status', '==', 'in_progress')
            .get();
        
        const timedOutJobs = [];
        
        for (const jobDoc of inProgressJobs.docs) {
            const job = jobDoc.data();
            const startTime = job.progress?.startedAt?.toMillis() || job.createdAt?.toMillis();
            
            if (startTime && (now - startTime > timeoutThreshold)) {
                // Mark as failed_timeout
                await jobDoc.ref.update({
                    status: 'failed_timeout',
                    error: 'Job exceeded maximum runtime of 45 minutes',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                timedOutJobs.push(jobDoc.id);
                console.log(`⏱️  Job ${jobDoc.id} marked as timed out`);
            }
        }
        
        return timedOutJobs;
    } catch (error) {
        console.error('Error detecting timed-out jobs:', error);
        return [];
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Configuration
    DEFAULT_CONFIG,
    loadScraperConfig,
    saveScraperConfig,
    getScraperConfig,
    
    // Proxy management
    getNextProxy,
    formatProxyArg,
    resetProxyRotation,
    getPuppeteerLaunchOptions,
    
    // Health checks
    checkSystemHealth,
    
    // Rate limiting
    checkGlobalJobLimit,
    checkUserJobLimit,
    
    // Timeout detection
    detectTimedOutJobs
};
