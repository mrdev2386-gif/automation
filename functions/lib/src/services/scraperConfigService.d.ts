export namespace DEFAULT_CONFIG {
    let proxy_enabled: boolean;
    let proxy_list: never[];
    let rotation_mode: string;
    let email_verification_enabled: boolean;
    let allow_personal_emails: boolean;
    let check_mx_records: boolean;
    let max_open_pages: number;
    let max_parallel_scrapes: number;
    let global_concurrent_jobs: number;
    let per_user_jobs: number;
    let request_delay: number;
    let page_load_timeout: number;
    let max_job_runtime: number;
    let job_timeout_threshold: number;
    let max_websites_per_job: number;
    let max_retries: number;
    let retry_delay: number;
    let require_health_check: boolean;
}
/**
 * Load scraper configuration from Firestore
 */
export function loadScraperConfig(): Promise<{
    proxy_enabled: boolean;
    proxy_list: never[];
    rotation_mode: string;
    email_verification_enabled: boolean;
    allow_personal_emails: boolean;
    check_mx_records: boolean;
    max_open_pages: number;
    max_parallel_scrapes: number;
    global_concurrent_jobs: number;
    per_user_jobs: number;
    request_delay: number;
    page_load_timeout: number;
    max_job_runtime: number;
    job_timeout_threshold: number;
    max_websites_per_job: number;
    max_retries: number;
    retry_delay: number;
    require_health_check: boolean;
}>;
/**
 * Save scraper configuration to Firestore
 */
export function saveScraperConfig(config: any): Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export function getScraperConfig(forceRefresh?: boolean): Promise<any>;
/**
 * Get next proxy from rotation
 */
export function getNextProxy(proxyList: any, rotationMode: any): any;
/**
 * Format proxy for Puppeteer args
 */
export function formatProxyArg(proxy: any): string | null;
/**
 * Reset proxy rotation index
 */
export function resetProxyRotation(): void;
/**
 * Get Puppeteer launch options with proxy support
 */
export function getPuppeteerLaunchOptions(useProxy?: boolean): Promise<{
    headless: boolean;
    args: string[];
    timeout: any;
}>;
/**
 * Check system health before starting job
 * Firestore-based health check (no Redis dependency)
 */
export function checkSystemHealth(): Promise<{
    healthy: boolean;
    checks: {
        firestore: boolean;
        queue: boolean;
    };
    errors: never[];
}>;
/**
 * Check if global job limit reached
 */
export function checkGlobalJobLimit(): Promise<{
    allowed: boolean;
    current: number;
    limit: any;
}>;
/**
 * Check if user job limit reached
 */
export function checkUserJobLimit(userId: any): Promise<{
    allowed: boolean;
    current: number;
    limit: any;
}>;
/**
 * Find and mark timed-out jobs
 */
export function detectTimedOutJobs(): Promise<string[]>;
//# sourceMappingURL=scraperConfigService.d.ts.map