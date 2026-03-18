/**
 * submitWebsitesForScraping - Submit websites to scrape
 */
export const submitWebsitesForScraping: functions.HttpsFunction & functions.Runnable<any>;
/**
 * setupLeadFinderForUser - Auto-setup Lead Finder when admin creates user
 */
export const setupLeadFinderForUser: functions.HttpsFunction & functions.Runnable<any>;
/**
 * saveLeadFinderAPIKey - Save user's SerpAPI key
 */
export const saveLeadFinderAPIKey: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getLeadFinderConfig - HTTP version with CORS support
 */
export const getLeadFinderConfig: functions.HttpsFunction;
/**
 * getLeadFinderQueueStats - Get queue statistics (admin only)
 */
export const getLeadFinderQueueStats: functions.HttpsFunction & functions.Runnable<any>;
/**
 * updateScraperConfig - Update scraper configuration (admin only)
 */
export const updateScraperConfig: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getScraperConfig - Get current scraper configuration (admin only)
 */
export const getScraperConfig: functions.HttpsFunction & functions.Runnable<any>;
/**
 * saveWebhookConfig - Save webhook URL for CRM integration
 */
export const saveWebhookConfig: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getMyLeadFinderLeadsHTTP - HTTP version with CORS support
 */
export const getMyLeadFinderLeadsHTTP: functions.HttpsFunction;
/**
 * startLeadFinderCallable - Callable version for Firebase SDK
 */
export const startLeadFinderCallable: functions.HttpsFunction & functions.Runnable<any>;
/**
 * startLeadFinderHTTP - HTTP version with CORS support (for direct HTTP calls)
 */
export const startLeadFinderHTTP: functions.HttpsFunction;
/**
 * getLeadFinderStatusHTTP - HTTP version with CORS support
 */
export const getLeadFinderStatusHTTP: functions.HttpsFunction;
/**
 * deleteLeadFinderLeadsHTTP - HTTP version with CORS support
 */
export const deleteLeadFinderLeadsHTTP: functions.HttpsFunction;
import functions = require("firebase-functions");
export { getMyLeadFinderLeadsHTTP as getMyLeadFinderLeads, startLeadFinderCallable as startLeadFinder, getLeadFinderStatusHTTP as getLeadFinderStatus, deleteLeadFinderLeadsHTTP as deleteLeadFinderLeads };
//# sourceMappingURL=leadFinder.d.ts.map