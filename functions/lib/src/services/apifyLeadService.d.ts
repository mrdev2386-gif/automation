/**
 * Get user's Apify API keys from Firestore (supports multiple keys)
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} - Array of Apify API keys
 */
export function getUserApifyKeys(userId: string): Promise<Array<string>>;
/**
 * Check if Apify is enabled for user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export function isApifyEnabled(userId: string): Promise<boolean>;
/**
 * Scrape LinkedIn companies
 * @param {string} searchQuery - LinkedIn search query
 * @param {string} userId - User ID
 * @param {number} maxResults - Maximum results
 * @returns {Promise<Array>} - Array of company data
 */
export function scrapeLinkedInCompanies(searchQuery: string, userId: string, maxResults?: number): Promise<any[]>;
/**
 * Scrape Google Maps businesses
 * @param {string} searchQuery - Google Maps search query
 * @param {string} location - Location (city, country)
 * @param {string} userId - User ID
 * @param {number} maxResults - Maximum results
 * @returns {Promise<Array>} - Array of business data
 */
export function scrapeGoogleMapsBusiness(searchQuery: string, location: string, userId: string, maxResults?: number): Promise<any[]>;
/**
 * Discover leads using Apify (LinkedIn + Google Maps)
 * @param {string} niche - Target niche
 * @param {string} country - Target country
 * @param {string} userId - User ID
 * @param {Object} options - Options
 * @returns {Promise<Array>} - Combined leads
 */
export function discoverLeadsWithApify(niche: string, country: string, userId: string, options?: Object): Promise<any[]>;
//# sourceMappingURL=apifyLeadService.d.ts.map