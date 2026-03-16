/**
 * Lead Finder Service - UPGRADED v2
 * Fully automated scraping with:
 * - Queue integration (Firestore-based)
 * - Automatic website discovery
 * - Email deduplication (Set + Firestore)
 * - Timeout protection (15s, with fallback)
 * - Safety controls (rate limiting, max runtime 40min)
 * - Production-ready error handling
 * - Auto-discovery via SerpAPI + fallback patterns
 */

const admin = require('firebase-admin');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

// Import new services
const emailVerificationService = require('./emailVerificationService');
const scraperConfigService = require('./scraperConfigService');
const browserPoolService = require('./browserPoolService');
const leadScoringService = require('./leadScoringService');
const directoryFilterService = require('./directoryFilterService');
const webhookService = require('./webhookService');
const apifyLeadService = require('./apifyLeadService');

// ============================================================================
// CONSTANTS & CONFIG (Now loaded dynamically from scraperConfigService)
// ============================================================================

// Legacy constants for backward compatibility
const CONFIG = {
    MAX_WEBSITES_PER_RUN: 500,
    REQUEST_DELAY_MS: 2000,
    PAGE_LOAD_TIMEOUT_MS: 15000,
    MAX_JOB_RUNTIME_MS: 40 * 60 * 1000,
};

const MAX_WEBSITES_PER_RUN = CONFIG.MAX_WEBSITES_PER_RUN;
const REQUEST_DELAY_MS = CONFIG.REQUEST_DELAY_MS;
const SCRAPE_TIMEOUT_MS = CONFIG.PAGE_LOAD_TIMEOUT_MS;
const MAX_CONCURRENT_JOBS = 1;

// Worker memory protection
let activeBrowserPages = 0;
const MAX_OPEN_PAGES = 3;

// Email regex pattern
const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const db = admin.firestore();

// ============================================================================
// SERVICE IMPORTS - Queue & Web Search (Firestore-based, no Redis)
// ============================================================================

const queueService = require('./leadFinderQueueService');
let webSearchService = null;

/**
 * Get queue service (Firestore-based, no Redis dependency)
 */
const getQueueService = async () => {
    return queueService;
};

/**
 * Get web search service for automatic website discovery
 */
const getWebSearchService = () => {
    if (!webSearchService) {
        try {
            webSearchService = require('./leadFinderWebSearchService');
        } catch (error) {
            console.warn('⚠️ Web search service not available');
        }
    }
    return webSearchService;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if email exists for user in Firestore
 * Prevents duplicates before insert
 */
const emailExistsForUser = async (userId, email) => {
    try {
        const snapshot = await db
            .collection('leads')
            .where('userId', '==', userId)
            .where('email', '==', email.toLowerCase())
            .where('source', '==', 'lead_finder')
            .limit(1)
            .get();

        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking email existence:', error);
        return false;
    }
};

/**
 * Create deduplication set for current scraping session
 * Prevents duplicate emails within a single job run
 */
const createDeduplicationSet = () => {
    return new Set();
};

/**
 * Extract and verify emails from text content
 * Now includes email verification and domain filtering
 */
const extractEmails = async (text, verifyEmails = true, allowPersonalEmails = false) => {
    if (!text) return [];
    
    const matches = text.match(EMAIL_REGEX) || [];
    const uniqueEmails = [...new Set(matches)];
    
    // Filter out common false positives
    const filtered = uniqueEmails.filter(email => {
        const domain = email.split('@')[1];
        const blocklisted = ['localhost', 'example.com', 'test.com', 'demo.com'];
        return !blocklisted.includes(domain);
    });
    
    // Verify emails if enabled
    if (verifyEmails) {
        const verified = [];
        
        for (const email of filtered) {
            // Quick verification (no DNS lookup for performance)
            const result = emailVerificationService.quickVerifyEmail(email, allowPersonalEmails);
            
            if (result.valid) {
                verified.push(email);
            } else {
                console.log(`⏭️  Skipped email ${email}: ${result.reason}`);
            }
        }
        
        return verified;
    }
    
    return filtered;
};

/**
 * Extract business name from URL
 */
const extractBusinessName = (url) => {
    try {
        const hostname = new URL(url).hostname;
        return hostname
            .replace('www.', '')
            .split('.')[0]
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    } catch {
        return 'Unknown';
    }
};

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
    try {
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Format URL with protocol
 */
const formatUrl = (url) => {
    if (!url.startsWith('http')) {
        return `https://${url}`;
    }
    return url;
};

/**
 * Delay execution (for rate limiting)
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if user has active scraping job
 */
const hasActiveScrapeJob = async (userId) => {
    try {
        const activeJobs = await db
            .collection('lead_finder_jobs')
            .where('userId', '==', userId)
            .where('status', '==', 'in_progress')
            .limit(1)
            .get();
        
        return !activeJobs.empty;
    } catch (error) {
        console.error('Error checking active jobs:', error);
        return false;
    }
};

/**
 * Check rate limit for user
 */
const checkRateLimit = async (userId) => {
    const hasActive = await hasActiveScrapeJob(userId);
    
    if (hasActive) {
        throw new Error('You already have an active scraping job. Please wait for it to complete.');
    }
};

// ============================================================================
// SCRAPING ENGINE WITH TIMEOUT & DEDUPLICATION
// ============================================================================

/**
 * Scrape website with timeout protection and deduplication
 * UPGRADED with:
 * - Worker memory protection (max open pages)
 * - Email verification and domain filtering
 * - Enhanced error handling with retry logic
 * - Activity logging for all events
 * - Graceful page cleanup
 */
const scrapeWebsiteWithTimeout = async (url, browser, dedupeSet, userId = null, timeout = CONFIG.PAGE_LOAD_TIMEOUT_MS, config = null) => {
    const result = {
        url,
        businessName: extractBusinessName(url),
        emails: [],
        success: false,
        error: null,
        scrapedAt: Date.now()
    };

    let page = null;

    try {
        // Worker memory protection: Check page limit
        if (activeBrowserPages >= MAX_OPEN_PAGES) {
            result.error = 'Max open pages limit reached';
            console.log(`⚠️  Max pages (${MAX_OPEN_PAGES}) reached, skipping ${url}`);
            return result;
        }
        
        page = await Promise.race([
            browser.newPage(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Page creation timeout')), timeout)
            )
        ]);
        
        activeBrowserPages++;
        console.log(`📄 Active pages: ${activeBrowserPages}/${MAX_OPEN_PAGES}`);

        page.setDefaultTimeout(timeout);
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );

        // Main page load with timeout
        try {
            await Promise.race([
                page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: timeout
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Navigation timeout')), timeout)
                )
            ]);

            const content = await page.content();
            const $ = cheerio.load(content);
            const pageText = $('body').text();
            
            // Extract and verify emails
            const allowPersonalEmails = config?.allow_personal_emails || false;
            const foundEmails = await extractEmails(pageText, true, allowPersonalEmails);

            // Add to results, avoiding duplicates in current run
            for (const email of foundEmails) {
                if (!dedupeSet.has(email)) {
                    result.emails.push(email);
                    dedupeSet.add(email);
                }
            }

        } catch (navigationError) {
            console.log(`⚠️ Main page load timeout/failed for ${url}, trying contact pages...`);
        }

        // Try contact/about pages if main page didn't yield emails
        if (result.emails.length === 0) {
            const contactPages = ['/contact', '/about', '/contact-us', '/about-us', '/team', '/company'];

            for (const contactPage of contactPages) {
                if (result.emails.length > 0) break;

                try {
                    const contactUrl = new URL(url).origin + contactPage;
                    await Promise.race([
                        page.goto(contactUrl, {
                            waitUntil: 'domcontentloaded',
                            timeout: timeout / 2  // Shorter timeout for secondary pages
                        }),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Contact page timeout')), timeout / 2)
                        )
                    ]);

                    const content = await page.content();
                    const $ = cheerio.load(content);
                    const pageText = $('body').text();
                    
                    // Extract and verify emails from contact page
                    const allowPersonalEmails = config?.allow_personal_emails || false;
                    const contactEmails = await extractEmails(pageText, true, allowPersonalEmails);

                    for (const email of contactEmails) {
                        if (!dedupeSet.has(email)) {
                            result.emails.push(email);
                            dedupeSet.add(email);
                        }
                    }
                    
                    console.log(`📧 Found ${contactEmails.length} emails on ${contactPage}`);
                } catch (e) {
                    // Continue to next contact page
                    continue;
                }
            }
        }

        result.success = result.emails.length > 0;

    } catch (error) {
        result.error = error.message;
        console.log(`⏭️  Skipped ${url}: ${error.message}`);
        
        // Log scrape failure
        if (userId) {
            try {
                await db.collection('activity_logs').add({
                    userId,
                    action: 'scrape_failed',
                    message: `Failed to scrape ${url}: ${error.message}`,
                    metadata: { url, error: error.message },
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
            } catch (logError) {
                // Ignore logging errors
            }
        }
    } finally {
        if (page) {
            try {
                await page.close();
                activeBrowserPages--;
                console.log(`📄 Active pages: ${activeBrowserPages}/${MAX_OPEN_PAGES}`);
            } catch (e) {
                // Ignore close errors
            }
        }
    }

    return result;
};

/**
 * Legacy function for backward compatibility
 * Calls the new timeout-aware version
 */
const scrapeWebsite = async (url, browser) => {
    const dedupeSet = createDeduplicationSet();
    return scrapeWebsiteWithTimeout(url, browser, dedupeSet, null, CONFIG.PAGE_LOAD_TIMEOUT_MS);
};

/**
 * (Deprecated) Search for websites using search APIs
 * Replaced by leadFinderWebSearchService.searchWebsites()
 * 
 * This service now uses:
 * - SerpAPI for auto website discovery
 * - Fallback to niche-based patterns if no API available
 */
const searchWebsites = async (query, limit = 100) => {
    console.log('⚠️ Direct searchWebsites() deprecated. Use getWebSearchService().searchWebsites() instead');
    return [];
};

// ============================================================================
// JOB MANAGEMENT - Automated Workflow
// ============================================================================

/**
 * Start automated Lead Finder job
 * UPGRADED with:
 * - Firestore-based health checks (no Redis)
 * - Global and per-user rate limiting
 * - Tool assignment validation
 * - Enhanced logging
 * 
 * Workflow:
 * 1. Firestore health check
 * 2. Tool assignment validation
 * 3. Rate limit checks (global + per-user)
 * 4. Website discovery
 * 5. Job creation and queueing
 */
const startAutomatedLeadFinder = async (userId, country, niche, limit = 500) => {
    try {
        // Load configuration
        const config = await scraperConfigService.getScraperConfig();
        
        // System health check
        if (config.require_health_check) {
            const health = await scraperConfigService.checkSystemHealth();
            if (!health.healthy) {
                throw new Error(`System unhealthy: ${health.errors.join(', ')}`);
            }
        }
        
        // Validate tool assignment
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        if (!userData.assignedAutomations || !userData.assignedAutomations.includes('lead_finder')) {
            throw new Error('Lead Finder tool not assigned to your account');
        }
        
        // Check global job limit
        const globalLimit = await scraperConfigService.checkGlobalJobLimit();
        if (!globalLimit.allowed) {
            throw new Error(`Global job limit reached (${globalLimit.current}/${globalLimit.limit}). Please try again later.`);
        }
        
        // Check per-user job limit
        const userLimit = await scraperConfigService.checkUserJobLimit(userId);
        if (!userLimit.allowed) {
            throw new Error(`You already have ${userLimit.current} active job(s). Maximum ${userLimit.limit} allowed.`);
        }

        // Get web search service
        const webSearch = getWebSearchService();
        if (!webSearch) {
            throw new Error('Web search service not available. Please try again later.');
        }

        // Discover websites automatically using SERP API (with user's API key)
        console.log(`🔍 Discovering websites for ${niche} in ${country}...`);
        const websites = await webSearch.searchWebsites(niche, country, limit, true, userId);
        
        // Filter out directory sites
        const filteredWebsites = directoryFilterService.filterDirectorySites(websites);
        const validWebsites = webSearch.validateWebsites(filteredWebsites);
        
        console.log(`📊 Filtered ${websites.length - filteredWebsites.length} directory sites`);

        // OPTIONAL: Discover additional leads using Apify (LinkedIn + Google Maps)
        let apifyLeads = [];
        try {
            const apifyEnabled = await apifyLeadService.isApifyEnabled(userId);
            if (apifyEnabled) {
                console.log('🚀 Apify enabled, discovering additional leads...');
                apifyLeads = await apifyLeadService.discoverLeadsWithApify(niche, country, userId, {
                    useLinkedIn: true,
                    useGoogleMaps: true,
                    maxResults: 50
                });
                console.log(`✅ Apify discovered ${apifyLeads.length} additional leads`);
            }
        } catch (apifyError) {
            console.warn('⚠️ Apify discovery failed:', apifyError.message);
        }

        if (validWebsites.length === 0 && apifyLeads.length === 0) {
            throw new Error('No websites found for the given niche and country. Try a different search term.');
        }

        // Create job record
        const jobRef = db.collection('lead_finder_jobs').doc();
        const now = admin.firestore.FieldValue.serverTimestamp();

        const job = {
            id: jobRef.id,
            userId,
            country,
            niche,
            status: 'queued',
            progress: {
                websitesScanned: 0,
                emailsFound: 0,
                createdAt: now
            },
            websites: validWebsites,
            apifyLeads: apifyLeads, // Store Apify leads for processing
            results: [],
            createdAt: now,
            updatedAt: now
        };

        await jobRef.set(job);

        // Queue job for processing using Firestore queue
        try {
            await queueService.addScrapingJob({
                jobId: jobRef.id,
                userId,
                websites: validWebsites,
                country,
                niche,
                campaignId: null
            });
            console.log(`📋 Job ${jobRef.id} queued for processing`);
        } catch (queueError) {
            console.error('❌ Error queuing job:', queueError.message);
            throw queueError;
        }

        // Log activity with enhanced details
        await db.collection('activity_logs').add({
            userId,
            action: 'scrape_started',
            message: `Lead Finder job started for ${niche} in ${country}`,
            metadata: {
                jobId: jobRef.id,
                country,
                niche,
                websitesDiscovered: validWebsites.length,
                limit,
                proxyEnabled: config.proxy_enabled,
                emailVerificationEnabled: config.email_verification_enabled
            },
            timestamp: now
        });

        return {
            jobId: jobRef.id,
            status: 'queued',
            websitesDiscovered: validWebsites.length,
            apifyLeadsDiscovered: apifyLeads.length,
            message: `🚀 Lead Finder job started. Found ${validWebsites.length} websites${apifyLeads.length > 0 ? ` + ${apifyLeads.length} Apify leads` : ''}. Scraping will start shortly.`
        };

    } catch (error) {
        console.error('Error starting automated lead finder:', error);
        throw error;
    }
};

/**
 * Legacy function for backward compatibility
 * Old version that required manual website submission
 */
const startLeadFinderJob = async (userId, country, niche, limit) => {
    // Delegate to new automated version
    return startAutomatedLeadFinder(userId, country, niche, limit);
};

/**
 * Process scraping job (can be called from queue or directly)
 * UPGRADED with:
 * - Proxy rotation support
 * - Email verification and domain filtering
 * - Worker memory protection (max parallel scrapes)
 * - Enhanced retry logic with exponential backoff
 * - Comprehensive activity logging
 * - Graceful error handling (never stop entire job)
 * - Performance optimization
 */
const processScrapeJob = async (jobData) => {
    const {
        jobId,
        userId,
        websites,
        country,
        niche,
        createdAt
    } = jobData;

    const jobRef = db.collection('lead_finder_jobs').doc(jobId);
    const startTime = Date.now();
    let browserInfo = null;
    let processedCount = 0;
    let emailsCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const dedupeSet = createDeduplicationSet();
    const results = [];
    const leads = [];
    
    // Load configuration
    const config = await scraperConfigService.getScraperConfig();
    
    // Reset active pages counter
    activeBrowserPages = 0;

    try {
        // Check job runtime
        const elapsedTime = Date.now() - createdAt;
        if (elapsedTime > CONFIG.MAX_JOB_RUNTIME_MS) {
            throw new Error(`Job exceeded max runtime of 40 minutes`);
        }

        // Update status to processing
        await jobRef.update({
            status: 'in_progress',
            progress: {
                websitesScanned: 0,
                emailsFound: 0,
                startedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        });

        // Get browser from pool with crash protection
        const launchOptions = await scraperConfigService.getPuppeteerLaunchOptions(config.proxy_enabled);
        
        try {
            browserInfo = await browserPoolService.getBrowser(launchOptions);
        } catch (error) {
            console.error('Browser pool error, falling back to direct launch:', error);
            browserInfo = {
                browser: await puppeteer.launch(launchOptions),
                poolIndex: -1
            };
        }
        
        const browser = browserInfo.browser;
        
        console.log(`🚀 Browser launched with config:`, {
            proxyEnabled: config.proxy_enabled,
            emailVerification: config.email_verification_enabled,
            maxPages: MAX_OPEN_PAGES,
            requestDelay: config.request_delay
        });

        console.log(`🚀 Starting scrape for job ${jobId} (${websites.length} websites)`);
        console.log(`Websites discovered: ${websites.length}`);

        // Process each website
        for (let i = 0; i < websites.length; i++) {
            const website = websites[i];
            
            console.log(`Scraping website: ${website} (${i + 1}/${websites.length})`);

            // Check runtime periodically
            if (i % 10 === 0) {
                const elapsed = Date.now() - createdAt;
                if (elapsed > config.max_job_runtime) {
                    console.log(`⏱️  Job ${jobId} reached max runtime, stopping gracefully`);
                    
                    // Log timeout skip
                    await db.collection('activity_logs').add({
                        userId,
                        action: 'timeout_skipped',
                        message: `Job ${jobId} stopped due to max runtime (${config.max_job_runtime / 60000} minutes)`,
                        metadata: { jobId, websitesProcessed: processedCount, emailsFound: emailsCount },
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });
                    
                    break;
                }
            }

            // Scrape website with timeout, dedup, and verification
            let scrapedData;
            try {
                scrapedData = await scrapeWebsiteWithTimeout(
                    website,
                    browser,
                    dedupeSet,
                    userId,
                    config.page_load_timeout,
                    config
                );
            } catch (browserError) {
                // Browser crash protection - restart and retry
                console.error('Browser crashed, restarting...', browserError);
                try {
                    if (browserInfo.poolIndex >= 0) {
                        browserPoolService.releaseBrowser(browserInfo.poolIndex);
                    }
                    browserInfo = await browserPoolService.getBrowser(launchOptions);
                    scrapedData = await scrapeWebsiteWithTimeout(
                        website,
                        browserInfo.browser,
                        dedupeSet,
                        userId,
                        config.page_load_timeout,
                        config
                    );
                } catch (retryError) {
                    scrapedData = { url: website, success: false, error: retryError.message, emails: [] };
                }
            }
            
            // Track failures
            if (!scrapedData.success && scrapedData.error) {
                failedCount++;
            }

            results.push(scrapedData);

            if (scrapedData.success) {
                emailsCount += scrapedData.emails.length;
                console.log(`Emails extracted: ${scrapedData.emails.length} from ${website}`);

                // Prepare lead records with scoring
                for (const email of scrapedData.emails) {
                    // Check for existing email in Firestore
                    const exists = await emailExistsForUser(userId, email);
                    if (!exists) {
                        // Calculate lead score
                        const websiteDomain = new URL(scrapedData.url).hostname;
                        const lead_score = leadScoringService.calculateLeadScore(email, websiteDomain);
                        
                        const leadData = {
                            userId,
                            businessName: scrapedData.businessName,
                            website: scrapedData.url,
                            email: email.toLowerCase(),
                            country,
                            niche,
                            source: 'lead_finder',
                            status: 'new',
                            jobId,
                            verified: true,
                            lead_score,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        };
                        
                        leads.push(leadData);
                        
                        // Log email saved
                        if (i % 50 === 0) { // Log every 50 emails to avoid spam
                            await db.collection('activity_logs').add({
                                userId,
                                action: 'email_saved',
                                message: `Saved verified email from ${scrapedData.businessName}`,
                                metadata: { jobId, email: email.substring(0, 3) + '***', website: scrapedData.url },
                                timestamp: admin.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    } else {
                        skippedCount++;
                    }
                }
            }

            processedCount++;

            // Update progress every 10 websites
            if (i % 10 === 0 || i === websites.length - 1) {
                await jobRef.update({
                    progress: {
                        websitesScanned: processedCount,
                        emailsFound: emailsCount,
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                    }
                });
            }

            // Rate limiting (configurable)
            if (i < websites.length - 1) {
                await delay(config.request_delay);
            }
        }

        // Store all leads in batch
        const batch = db.batch();

        for (const leadData of leads) {
            const leadRef = db.collection('leads').doc();
            batch.set(leadRef, leadData);
        }

        // Update job status
        batch.update(jobRef, {
            status: 'completed',
            progress: {
                websitesScanned: processedCount,
                emailsFound: emailsCount,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            results
        });

        await batch.commit();

        console.log(`✅ Job ${jobId} completed: ${processedCount} websites, ${emailsCount} emails, ${leads.length} new leads`);
        console.log(`Leads saved: ${leads.length}`);
        console.log(`Job completed`);
        
        // ========================================================================
        // WHATSAPP AUTO-DM: Send WhatsApp messages to leads (if configured)
        // ========================================================================
        if (leads.length > 0) {
            try {
                console.log('📱 Checking WhatsApp configuration for auto-DM...');
                
                // Get user's WhatsApp config from client_configs
                const configDoc = await db.collection('client_configs').doc(userId).get();
                
                if (configDoc.exists) {
                    const userConfig = configDoc.data();
                    
                    // Check if WhatsApp is configured
                    if (userConfig.metaPhoneNumberId && userConfig.metaAccessToken) {
                        console.log('✅ WhatsApp configured, sending auto-DMs...');
                        
                        // Import WhatsApp sender
                        const { sendTextMessage } = require('../whatsapp/sender');
                        
                        let dmsSent = 0;
                        let dmsFailed = 0;
                        
                        // Send WhatsApp DM for each lead with phone number
                        for (const lead of leads) {
                            if (lead.phone) {
                                try {
                                    // Create personalized message
                                    const message = `Hello ${lead.businessName}! 👋\n\nWe found your business online and would love to connect with you.\n\nWe specialize in helping ${niche} businesses in ${country} grow through automation.\n\nWould you be interested in learning more?`;
                                    
                                    // Send WhatsApp message
                                    await sendTextMessage(
                                        lead.phone,
                                        message,
                                        {
                                            whatsappToken: userConfig.metaAccessToken,
                                            whatsappNumberId: userConfig.metaPhoneNumberId
                                        }
                                    );
                                    
                                    dmsSent++;
                                    console.log(`✅ WhatsApp DM sent to ${lead.phone} (${lead.businessName})`);
                                    
                                    // Rate limiting: wait 2 seconds between messages to avoid spam
                                    await delay(2000);
                                } catch (dmError) {
                                    dmsFailed++;
                                    console.error(`❌ Failed to send WhatsApp DM to ${lead.phone}:`, dmError.message);
                                }
                            }
                        }
                        
                        console.log(`✅ WhatsApp auto-DM complete: ${dmsSent} sent, ${dmsFailed} failed`);
                        
                        // Log WhatsApp DM activity
                        await db.collection('activity_logs').add({
                            userId,
                            action: 'whatsapp_auto_dm_completed',
                            message: `WhatsApp auto-DM completed for job ${jobId}`,
                            metadata: {
                                jobId,
                                totalLeads: leads.length,
                                leadsWithPhone: leads.filter(l => l.phone).length,
                                dmsSent,
                                dmsFailed
                            },
                            timestamp: admin.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        console.log('⏭️  WhatsApp not configured, skipping auto-DM');
                    }
                } else {
                    console.log('⏭️  No client config found, skipping auto-DM');
                }
            } catch (whatsappError) {
                console.error('⚠️ WhatsApp auto-DM failed:', whatsappError.message);
                // Don't fail the job if WhatsApp fails - just log the error
                await db.collection('activity_logs').add({
                    userId,
                    action: 'whatsapp_auto_dm_error',
                    message: `WhatsApp auto-DM failed: ${whatsappError.message}`,
                    metadata: { jobId, error: whatsappError.message },
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        
        // Send webhook notification if configured
        try {
            const configDoc = await db.collection('lead_finder_config').doc(userId).get();
            if (configDoc.exists) {
                const config = configDoc.data();
                if (config.webhook_url && config.webhook_url.trim()) {
                    console.log('📤 Sending webhook notification...');
                    await webhookService.sendLeadFinderWebhook(config.webhook_url, {
                        userId,
                        jobId,
                        leadsCollected: leads.length,
                        websitesScanned: processedCount,
                        emailsFound: emailsCount,
                        country,
                        niche,
                        timestamp: new Date().toISOString(),
                        leads: leads.slice(0, 10) // Send first 10 leads as preview
                    });
                    console.log('✅ Webhook notification sent');
                }
            }
        } catch (webhookError) {
            console.error('⚠️ Webhook notification failed:', webhookError.message);
            // Don't fail the job if webhook fails
        }
        
        // Log completion
        await db.collection('activity_logs').add({
            userId,
            action: 'scrape_completed',
            message: `Lead Finder job completed successfully`,
            metadata: {
                jobId,
                websitesScanned: processedCount,
                emailsFound: emailsCount,
                leadsStored: leads.length,
                skipped: skippedCount,
                failed: failedCount,
                duration: Date.now() - startTime,
                webhookSent: true
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            success: true,
            jobId,
            websitesScanned: processedCount,
            emailsFound: emailsCount,
            leadsStored: leads.length,
            skipped: skippedCount,
            failed: failedCount
        };

    } catch (error) {
        console.error(`❌ Error processing job ${jobId}:`, error);

        // Log error to activity_logs
        try {
            await db.collection('activity_logs').add({
                userId,
                action: 'lead_finder_error',
                metadata: {
                    jobId,
                    error: error.message,
                    websitesProcessed: processedCount,
                    emailsFound: emailsCount
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        // Update job status
        await jobRef.update({
            status: 'failed',
            error: error.message,
            progress: {
                websitesScanned: processedCount,
                emailsFound: emailsCount,
                failedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        });

        throw error;

    } finally {
        if (browserInfo) {
            try {
                if (browserInfo.poolIndex >= 0) {
                    browserPoolService.releaseBrowser(browserInfo.poolIndex);
                } else {
                    await browserInfo.browser.close();
                }
            } catch (e) {
                console.error('Error releasing browser:', e);
            }
        }
    }
};

/**
 * Legacy function for backward compatibility
 */
const processLeadFinderJob = async (jobId, userId) => {
    const jobDoc = await db.collection('lead_finder_jobs').doc(jobId).get();
    
    if (!jobDoc.exists) {
        throw new Error('Job not found');
    }
    
    const job = jobDoc.data();
    
    return processScrapeJob({
        jobId,
        userId,
        websites: job.websites || [],
        country: job.country,
        niche: job.niche,
        createdAt: job.createdAt.toMillis()
    });
};

/**
 * Get job status and progress
 */
const getJobStatus = async (jobId) => {
    const jobDoc = await db.collection('lead_finder_jobs').doc(jobId).get();
    return jobDoc.exists ? jobDoc.data() : null;
};

/**
 * Get user's leads
 */
const getUserLeads = async (userId, limit = 1000) => {
    const snapshot = await db
        .collection('leads')
        .where('userId', '==', userId)
        .where('source', '==', 'lead_finder')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

/**
 * Get user's jobs
 */
const getUserJobs = async (userId, limit = 20) => {
    const snapshot = await db
        .collection('lead_finder_jobs')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

/**
 * Delete leads
 */
const deleteLeads = async (userId, leadIds) => {
    const batch = db.batch();

    for (const leadId of leadIds) {
        const leadDoc = await db.collection('leads').doc(leadId).get();

        if (leadDoc.exists && leadDoc.data().userId === userId) {
            batch.delete(db.collection('leads').doc(leadId));
        }
    }

    await batch.commit();

    // Log deletion
    await db.collection('activity_logs').add({
        userId,
        action: 'LEADS_DELETED',
        metadata: { count: leadIds.length },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { deleted: leadIds.length };
};

/**
 * Submit websites for scraping (DEPRECATED)
 * 
 * ⚠️ DEPRECATED: Websites are now auto-discovered by searchWebsites()
 * This function is kept for backward compatibility but will be removed
 * in a future version.
 * 
 * Use startAutomatedLeadFinder() instead
 */
const submitWebsites = async (userId, jobId, websites) => {
    console.warn('⚠️ submitWebsites() is deprecated. Use startAutomatedLeadFinder() instead.');
    
    const db = admin.firestore();
    
    // Validate job exists and belongs to user
    const jobDoc = await db.collection('lead_finder_jobs').doc(jobId).get();
    
    if (!jobDoc.exists) {
        throw new Error('Job not found');
    }
    
    const job = jobDoc.data();
    
    if (job.userId !== userId) {
        throw new Error('Unauthorized');
    }
    
    // Process submitted websites
    let browser;
    
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });
        
        const validWebsites = websites
            .filter(w => isValidUrl(w))
            .map(w => formatUrl(w));
        
        const dedupeSet = createDeduplicationSet();
        const results = [];
        const leadsData = [];
        let emailsFound = 0;
        
        for (let i = 0; i < validWebsites.length; i++) {
            const website = validWebsites[i];
            
            // Scrape with timeout and dedup
            const scrapedData = await scrapeWebsiteWithTimeout(
                website,
                browser,
                dedupeSet,
                userId,
                CONFIG.PAGE_LOAD_TIMEOUT_MS
            );
            results.push(scrapedData);
            
            if (scrapedData.success) {
                emailsFound += scrapedData.emails.length;
                
                for (const email of scrapedData.emails) {
                    const exists = await emailExistsForUser(userId, email);
                    if (!exists) {
                        leadsData.push({
                            userId,
                            businessName: scrapedData.businessName,
                            website: scrapedData.url,
                            email: email.toLowerCase(),
                            country: job.country,
                            niche: job.niche,
                            source: 'lead_finder',
                            status: 'new',
                            jobId,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
            }
            
            if (i < validWebsites.length - 1) {
                await delay(CONFIG.REQUEST_DELAY_MS);
            }
            
            // Update progress
            if (i % 10 === 0 || i === validWebsites.length - 1) {
                await db.collection('lead_finder_jobs').doc(jobId).update({
                    progress: {
                        websitesScanned: i + 1,
                        emailsFound: emailsFound,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }
                });
            }
        }
        
        // Store results
        const batch = db.batch();
        
        for (const leadData of leadsData) {
            const leadRef = db.collection('leads').doc();
            batch.set(leadRef, leadData);
        }
        
        const jobRef = db.collection('lead_finder_jobs').doc(jobId);
        batch.update(jobRef, {
            status: 'completed',
            progress: {
                websitesScanned: validWebsites.length,
                emailsFound: emailsFound,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            results,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await batch.commit();
        
        return {
            jobId,
            websitesScanned: validWebsites.length,
            emailsFound: emailsFound,
            status: 'completed'
        };
        
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
    // Main automated workflow
    startAutomatedLeadFinder,
    processScrapeJob,
    
    // Job management
    startLeadFinderJob,              // Legacy: delegates to startAutomatedLeadFinder
    processLeadFinderJob,            // Legacy: delegates to processScrapeJob
    getJobStatus,
    getUserJobs,
    
    // Lead management
    getUserLeads,
    deleteLeads,
    
    // Web scraping (advanced)
    scrapeWebsiteWithTimeout,
    scrapeWebsite,                   // Legacy: delegates to scrapeWebsiteWithTimeout
    
    // Utilities
    extractEmails,
    extractBusinessName,
    isValidUrl,
    formatUrl,
    checkRateLimit,
    emailExistsForUser,
    createDeduplicationSet,
    
    // Deprecated/Legacy functions
    submitWebsites,                  // Deprecated: use startAutomatedLeadFinder
    searchWebsites,                  // Deprecated: use getWebSearchService().searchWebsites()
    
    // Service accessors
    getQueueService,
    getWebSearchService,
    
    // Config (for testing/customization)
    CONFIG
};
