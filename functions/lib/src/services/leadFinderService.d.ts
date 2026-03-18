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
export function startAutomatedLeadFinder(userId: any, country: any, niche: any, limit?: number): Promise<{
    jobId: string;
    status: string;
    websitesDiscovered: any;
    apifyLeadsDiscovered: number;
    message: string;
}>;
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
export function processScrapeJob(jobData: any): Promise<{
    success: boolean;
    jobId: any;
    websitesScanned: number;
    emailsFound: number;
    leadsStored: number;
    skipped: number;
    failed: number;
}>;
/**
 * Legacy function for backward compatibility
 * Old version that required manual website submission
 */
export function startLeadFinderJob(userId: any, country: any, niche: any, limit: any): Promise<{
    jobId: string;
    status: string;
    websitesDiscovered: any;
    apifyLeadsDiscovered: number;
    message: string;
}>;
/**
 * Legacy function for backward compatibility
 */
export function processLeadFinderJob(jobId: any, userId: any): Promise<{
    success: boolean;
    jobId: any;
    websitesScanned: number;
    emailsFound: number;
    leadsStored: number;
    skipped: number;
    failed: number;
}>;
/**
 * Get job status and progress
 */
export function getJobStatus(jobId: any): Promise<admin.firestore.DocumentData | null | undefined>;
/**
 * Get user's jobs
 */
export function getUserJobs(userId: any, limit?: number): Promise<{
    id: string;
}[]>;
/**
 * Get user's leads
 */
export function getUserLeads(userId: any, limit?: number): Promise<{
    id: string;
}[]>;
/**
 * Delete leads
 */
export function deleteLeads(userId: any, leadIds: any): Promise<{
    deleted: any;
}>;
/**
 * Scrape website with timeout protection and deduplication
 * UPGRADED with:
 * - Worker memory protection (max open pages)
 * - Email verification and domain filtering
 * - Enhanced error handling with retry logic
 * - Activity logging for all events
 * - Graceful page cleanup
 */
export function scrapeWebsiteWithTimeout(url: any, browser: any, dedupeSet: any, userId?: null, timeout?: number, config?: null): Promise<{
    url: any;
    businessName: string;
    emails: never[];
    success: boolean;
    error: null;
    scrapedAt: number;
}>;
/**
 * Legacy function for backward compatibility
 * Calls the new timeout-aware version
 */
export function scrapeWebsite(url: any, browser: any): Promise<{
    url: any;
    businessName: string;
    emails: never[];
    success: boolean;
    error: null;
    scrapedAt: number;
}>;
/**
 * Extract and verify emails from text content
 * Now includes email verification and domain filtering
 */
export function extractEmails(text: any, verifyEmails?: boolean, allowPersonalEmails?: boolean): Promise<any[]>;
/**
 * Extract business name from URL
 */
export function extractBusinessName(url: any): string;
/**
 * Validate URL format
 */
export function isValidUrl(url: any): boolean;
/**
 * Format URL with protocol
 */
export function formatUrl(url: any): any;
/**
 * Check rate limit for user
 */
export function checkRateLimit(userId: any): Promise<void>;
/**
 * Check if email exists for user in Firestore
 * Prevents duplicates before insert
 */
export function emailExistsForUser(userId: any, email: any): Promise<boolean>;
/**
 * Create deduplication set for current scraping session
 * Prevents duplicate emails within a single job run
 */
export function createDeduplicationSet(): Set<any>;
/**
 * Submit websites for scraping (DEPRECATED)
 *
 * ⚠️ DEPRECATED: Websites are now auto-discovered by searchWebsites()
 * This function is kept for backward compatibility but will be removed
 * in a future version.
 *
 * Use startAutomatedLeadFinder() instead
 */
export function submitWebsites(userId: any, jobId: any, websites: any): Promise<{
    jobId: any;
    websitesScanned: any;
    emailsFound: number;
    status: string;
}>;
/**
 * (Deprecated) Search for websites using search APIs
 * Replaced by leadFinderWebSearchService.searchWebsites()
 *
 * This service now uses:
 * - SerpAPI for auto website discovery
 * - Fallback to niche-based patterns if no API available
 */
export function searchWebsites(query: any, limit?: number): Promise<never[]>;
/**
 * Get queue service (Firestore-based, no Redis dependency)
 */
export function getQueueService(): Promise<typeof queueService>;
/**
 * Get web search service for automatic website discovery
 */
export function getWebSearchService(): any;
export namespace CONFIG {
    let MAX_WEBSITES_PER_RUN: number;
    let REQUEST_DELAY_MS: number;
    let PAGE_LOAD_TIMEOUT_MS: number;
    let MAX_JOB_RUNTIME_MS: number;
}
import admin = require("firebase-admin");
import queueService = require("./leadFinderQueueService");
//# sourceMappingURL=leadFinderService.d.ts.map