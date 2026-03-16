/**
 * Apify Lead Service
 * Optional integration for LinkedIn and Google Maps lead discovery
 * Requires Apify API key
 */

const axios = require('axios');
const admin = require('firebase-admin');

const db = admin.firestore();

// ============================================================================
// APIFY CONFIGURATION
// ============================================================================

const APIFY_BASE_URL = 'https://api.apify.com/v2';
const LINKEDIN_ACTOR_ID = 'apify/linkedin-company-scraper';
const GOOGLE_MAPS_ACTOR_ID = 'compass/google-maps-scraper';

/**
 * Get user's Apify API keys from Firestore (supports multiple keys)
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} - Array of Apify API keys
 */
const getUserApifyKeys = async (userId) => {
    try {
        const configDoc = await db.collection('lead_finder_config').doc(userId).get();
        
        if (configDoc.exists) {
            const config = configDoc.data();
            // Support both new array format and old single key format
            if (config.apify_api_keys && Array.isArray(config.apify_api_keys)) {
                return config.apify_api_keys;
            } else if (config.apify_api_key) {
                // Backward compatibility: convert old single key to array
                return [config.apify_api_key];
            }
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching Apify API keys:', error);
        return [];
    }
};

// Track current key index for rotation (in-memory, resets on function restart)
const apifyKeyRotationIndex = new Map();

/**
 * Get next Apify API key using round-robin rotation
 * @param {string} userId - User ID
 * @param {Array<string>} keys - Array of API keys
 * @returns {string} - Selected API key
 */
const getNextApifyApiKey = (userId, keys) => {
    if (!keys || keys.length === 0) return null;
    if (keys.length === 1) return keys[0];
    
    const currentIndex = apifyKeyRotationIndex.get(userId) || 0;
    const key = keys[currentIndex % keys.length];
    apifyKeyRotationIndex.set(userId, currentIndex + 1);
    
    console.log(`Using Apify key index: ${currentIndex % keys.length} (total: ${keys.length})`);
    return key;
};

/**
 * Check if Apify is enabled for user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
const isApifyEnabled = async (userId) => {
    const apiKeys = await getUserApifyKeys(userId);
    return apiKeys.length > 0;
};

// ============================================================================
// LINKEDIN COMPANY SCRAPING
// ============================================================================

/**
 * Scrape LinkedIn companies
 * @param {string} searchQuery - LinkedIn search query
 * @param {string} userId - User ID
 * @param {number} maxResults - Maximum results
 * @returns {Promise<Array>} - Array of company data
 */
const scrapeLinkedInCompanies = async (searchQuery, userId, maxResults = 50) => {
    try {
        const apiKeys = await getUserApifyKeys(userId);
        
        if (apiKeys.length === 0) {
            console.warn('⚠️ Apify API keys not configured for user');
            return [];
        }

        const apiKey = getNextApifyApiKey(userId, apiKeys);
        console.log(`🔍 Scraping LinkedIn companies: "${searchQuery}"`);

        // Start Apify actor
        const runResponse = await axios.post(
            `${APIFY_BASE_URL}/acts/${LINKEDIN_ACTOR_ID}/runs?token=${apiKey}`,
            {
                searchQuery,
                maxResults,
                proxyConfiguration: { useApifyProxy: true }
            },
            { timeout: 10000 }
        );

        const runId = runResponse.data.data.id;
        console.log(`📋 LinkedIn scrape started: ${runId}`);

        // Wait for completion (poll every 5 seconds, max 2 minutes)
        let attempts = 0;
        const maxAttempts = 24; // 2 minutes
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const statusResponse = await axios.get(
                `${APIFY_BASE_URL}/actor-runs/${runId}?token=${apiKey}`
            );
            
            const status = statusResponse.data.data.status;
            
            if (status === 'SUCCEEDED') {
                // Get results
                const resultsResponse = await axios.get(
                    `${APIFY_BASE_URL}/actor-runs/${runId}/dataset/items?token=${apiKey}`
                );
                
                const companies = resultsResponse.data.map(item => ({
                    name: item.name || item.companyName,
                    website: item.website || item.companyUrl,
                    linkedinUrl: item.url || item.linkedinUrl,
                    industry: item.industry,
                    location: item.location,
                    employeeCount: item.employeeCount,
                    source: 'linkedin_apify'
                }));
                
                console.log(`✅ LinkedIn scrape completed: ${companies.length} companies`);
                return companies;
            } else if (status === 'FAILED' || status === 'ABORTED') {
                console.error(`❌ LinkedIn scrape failed: ${status}`);
                return [];
            }
            
            attempts++;
        }
        
        console.warn('⏱️ LinkedIn scrape timeout');
        return [];
        
    } catch (error) {
        console.error('Error scraping LinkedIn:', error.message);
        return [];
    }
};

// ============================================================================
// GOOGLE MAPS BUSINESS SCRAPING
// ============================================================================

/**
 * Scrape Google Maps businesses
 * @param {string} searchQuery - Google Maps search query
 * @param {string} location - Location (city, country)
 * @param {string} userId - User ID
 * @param {number} maxResults - Maximum results
 * @returns {Promise<Array>} - Array of business data
 */
const scrapeGoogleMapsBusiness = async (searchQuery, location, userId, maxResults = 50) => {
    try {
        const apiKeys = await getUserApifyKeys(userId);
        
        if (apiKeys.length === 0) {
            console.warn('⚠️ Apify API keys not configured for user');
            return [];
        }

        const apiKey = getNextApifyApiKey(userId, apiKeys);
        console.log(`🗺️ Scraping Google Maps: "${searchQuery}" in ${location}`);

        // Start Apify actor
        const runResponse = await axios.post(
            `${APIFY_BASE_URL}/acts/${GOOGLE_MAPS_ACTOR_ID}/runs?token=${apiKey}`,
            {
                searchStringsArray: [`${searchQuery} in ${location}`],
                maxCrawledPlacesPerSearch: maxResults,
                language: 'en',
                proxyConfiguration: { useApifyProxy: true }
            },
            { timeout: 10000 }
        );

        const runId = runResponse.data.data.id;
        console.log(`📋 Google Maps scrape started: ${runId}`);

        // Wait for completion (poll every 5 seconds, max 2 minutes)
        let attempts = 0;
        const maxAttempts = 24; // 2 minutes
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const statusResponse = await axios.get(
                `${APIFY_BASE_URL}/actor-runs/${runId}?token=${apiKey}`
            );
            
            const status = statusResponse.data.data.status;
            
            if (status === 'SUCCEEDED') {
                // Get results
                const resultsResponse = await axios.get(
                    `${APIFY_BASE_URL}/actor-runs/${runId}/dataset/items?token=${apiKey}`
                );
                
                const businesses = resultsResponse.data.map(item => ({
                    name: item.title || item.name,
                    website: item.website,
                    phone: item.phone,
                    address: item.address,
                    location: item.location,
                    rating: item.totalScore,
                    reviewCount: item.reviewsCount,
                    category: item.categoryName,
                    source: 'google_maps_apify'
                }));
                
                console.log(`✅ Google Maps scrape completed: ${businesses.length} businesses`);
                return businesses;
            } else if (status === 'FAILED' || status === 'ABORTED') {
                console.error(`❌ Google Maps scrape failed: ${status}`);
                return [];
            }
            
            attempts++;
        }
        
        console.warn('⏱️ Google Maps scrape timeout');
        return [];
        
    } catch (error) {
        console.error('Error scraping Google Maps:', error.message);
        return [];
    }
};

// ============================================================================
// COMBINED LEAD DISCOVERY
// ============================================================================

/**
 * Discover leads using Apify (LinkedIn + Google Maps)
 * @param {string} niche - Target niche
 * @param {string} country - Target country
 * @param {string} userId - User ID
 * @param {Object} options - Options
 * @returns {Promise<Array>} - Combined leads
 */
const discoverLeadsWithApify = async (niche, country, userId, options = {}) => {
    try {
        const enabled = await isApifyEnabled(userId);
        
        if (!enabled) {
            console.log('ℹ️ Apify not enabled for user, skipping');
            return [];
        }

        const {
            useLinkedIn = true,
            useGoogleMaps = true,
            maxResults = 50
        } = options;

        const leads = [];

        // LinkedIn scraping
        if (useLinkedIn) {
            const linkedInQuery = `${niche} companies in ${country}`;
            const linkedInLeads = await scrapeLinkedInCompanies(linkedInQuery, userId, maxResults);
            leads.push(...linkedInLeads);
        }

        // Google Maps scraping
        if (useGoogleMaps) {
            const googleMapsQuery = `${niche} businesses`;
            const googleMapsLeads = await scrapeGoogleMapsBusiness(googleMapsQuery, country, userId, maxResults);
            leads.push(...googleMapsLeads);
        }

        console.log(`✅ Apify discovery completed: ${leads.length} leads`);
        return leads;

    } catch (error) {
        console.error('Error in Apify lead discovery:', error);
        return [];
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    getUserApifyKeys,
    isApifyEnabled,
    scrapeLinkedInCompanies,
    scrapeGoogleMapsBusiness,
    discoverLeadsWithApify
};
