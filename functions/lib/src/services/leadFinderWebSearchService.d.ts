/**
 * Build search queries for a niche and country
 * UPGRADED: More comprehensive query generation
 */
export function buildSearchQueries(niche: any, country: any): string[];
/**
 * Search websites using SerpAPI
 * Free tier available, requires API key for high volume
 * UPGRADED: Supports per-user API keys
 * @param {Array} queries - Search queries
 * @param {number} limit - Result limit
 * @param {string} userSerpApiKey - User's personal SERP API key (optional, overrides global)
 */
export function searchWithSerpAPI(queries: any[], limit?: number, userSerpApiKey?: string): Promise<any[]>;
/**
 * Search and collect websites for a niche and country
 * UPGRADED: Fetches per-user API key from Firestore
 * @param {string} niche - Target niche
 * @param {string} country - Target country
 * @param {number} limit - Result limit
 * @param {boolean} useAPI - Use API or fallback
 * @param {string} userId - User ID for fetching API key (optional)
 */
export function searchWebsites(niche: string, country: string, limit?: number, useAPI?: boolean, userId?: string): Promise<any[]>;
/**
 * Validate and filter websites
 */
export function validateWebsites(websites: any): any[];
/**
 * Build fallback websites from common patterns
 * Used when no API is available
 */
export function getFallbackWebsites(niche: any, country: any, limit?: number): string[];
/**
 * Fetch user's SERP API keys from Firestore (supports multiple keys)
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} - Array of user's API keys
 */
export function getUserSerpApiKeys(userId: string): Promise<Array<string>>;
/**
 * Get next SERP API key using round-robin rotation
 * @param {string} userId - User ID
 * @param {Array<string>} keys - Array of API keys
 * @returns {string} - Selected API key
 */
export function getNextSerpApiKey(userId: string, keys: Array<string>): string;
//# sourceMappingURL=leadFinderWebSearchService.d.ts.map