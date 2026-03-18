"use strict";
/**
 * Lead Finder Web Search Service
 * Automatically discovers websites for a given niche + country
 * Uses SerpAPI or built-in search strategies
 * UPGRADED: Per-user API key support
 */
const axios = require('axios');
const admin = require('firebase-admin');
// ============================================================================
// SEARCH STRATEGIES
// ============================================================================
/**
 * Build search queries for a niche and country
 * UPGRADED: More comprehensive query generation
 */
const buildSearchQueries = (niche, country) => {
    const queries = [];
    // Base queries (expanded)
    queries.push(`${niche} companies in ${country}`);
    queries.push(`${niche} startups in ${country}`);
    queries.push(`top ${niche} companies`);
    queries.push(`${niche} agencies`);
    queries.push(`${niche} services companies`);
    queries.push(`best ${niche} in ${country}`);
    queries.push(`${niche} businesses ${country}`);
    queries.push(`${niche} firms ${country}`);
    queries.push(`${niche} providers ${country}`);
    queries.push(`leading ${niche} companies ${country}`);
    // Industry-specific variations
    if (niche.toLowerCase().includes('real estate')) {
        queries.push(`property agents ${country}`);
        queries.push(`real estate brokers ${country}`);
        queries.push(`property management ${country}`);
    }
    if (niche.toLowerCase().includes('software') || niche.toLowerCase().includes('tech')) {
        queries.push(`software companies ${country}`);
        queries.push(`tech startups ${country}`);
        queries.push(`consulting firms ${country}`);
    }
    if (niche.toLowerCase().includes('service')) {
        queries.push(`service providers ${country}`);
        queries.push(`${niche} directory ${country}`);
    }
    return queries;
};
/**
 * Search websites using SerpAPI
 * Free tier available, requires API key for high volume
 * UPGRADED: Supports per-user API keys
 * @param {Array} queries - Search queries
 * @param {number} limit - Result limit
 * @param {string} userSerpApiKey - User's personal SERP API key (optional, overrides global)
 */
const searchWithSerpAPI = async (queries, limit = 100, userSerpApiKey = null) => {
    try {
        // Use user's API key if provided, otherwise fall back to global
        const apiKey = userSerpApiKey || process.env.SERPAPI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ SERP API key not configured. Please add your API key in settings.');
            return [];
        }
        console.log(`Using SERP API key for website discovery (user key: ${userSerpApiKey ? 'yes' : 'no'})`);
        const websites = new Set();
        for (const query of queries) {
            try {
                const response = await axios.get('https://serpapi.com/search', {
                    params: {
                        q: query,
                        api_key: apiKey,
                        engine: 'google',
                        num: 50,
                        start: 0
                    },
                    timeout: 10000
                });
                if (response.data.organic_results) {
                    for (const result of response.data.organic_results) {
                        if (result.link && !result.link.includes('facebook') && !result.link.includes('twitter')) {
                            websites.add(result.link);
                        }
                    }
                }
                // Respect rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
                if (websites.size >= limit) {
                    break;
                }
            }
            catch (error) {
                console.warn(`Warning searching query "${query}":`, error.message);
                continue;
            }
        }
        console.log(`Websites discovered: ${websites.size}`);
        return Array.from(websites).slice(0, limit);
    }
    catch (error) {
        console.error('Error in SerpAPI search:', error);
        return [];
    }
};
/**
 * Build fallback websites from common patterns
 * Used when no API is available
 */
const getFallbackWebsites = (niche, country, limit = 100) => {
    const websites = [
        // Generic business directories
        'www.linkedin.com',
        'www.google.com',
        'www.businessdirectory.com',
        'www.yelp.com',
        'www.yellowpages.com',
        'www.facebook.com',
        'www.chambers.com.uk'
    ];
    // Industry-specific suggestions
    if (niche.toLowerCase().includes('real estate')) {
        websites.push('www.zillow.com', 'www.redfin.com', 'www.trulia.com', 'www.realtor.com');
    }
    if (niche.toLowerCase().includes('software') || niche.toLowerCase().includes('tech')) {
        websites.push('www.crunchbase.com', 'www.producthunt.com', 'www.github.com');
    }
    if (niche.toLowerCase().includes('restaurant')) {
        websites.push('www.opentable.com', 'www.tripadvisor.com', 'www.michelin-guide.com');
    }
    return websites.slice(0, limit);
};
/**
 * Fetch user's SERP API keys from Firestore (supports multiple keys)
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} - Array of user's API keys
 */
const getUserSerpApiKeys = async (userId) => {
    try {
        const db = admin.firestore();
        const configDoc = await db.collection('lead_finder_config').doc(userId).get();
        if (configDoc.exists) {
            const config = configDoc.data();
            // Support both new array format and old single key format
            if (config.serp_api_keys && Array.isArray(config.serp_api_keys)) {
                return config.serp_api_keys;
            }
            else if (config.api_key) {
                // Backward compatibility: convert old single key to array
                return [config.api_key];
            }
        }
        return [];
    }
    catch (error) {
        console.error('Error fetching user SERP API keys:', error);
        return [];
    }
};
// Track current key index for rotation (in-memory, resets on function restart)
const keyRotationIndex = new Map();
/**
 * Get next SERP API key using round-robin rotation
 * @param {string} userId - User ID
 * @param {Array<string>} keys - Array of API keys
 * @returns {string} - Selected API key
 */
const getNextSerpApiKey = (userId, keys) => {
    if (!keys || keys.length === 0)
        return null;
    if (keys.length === 1)
        return keys[0];
    const currentIndex = keyRotationIndex.get(userId) || 0;
    const key = keys[currentIndex % keys.length];
    keyRotationIndex.set(userId, currentIndex + 1);
    console.log(`Using SERP key index: ${currentIndex % keys.length} (total: ${keys.length})`);
    return key;
};
/**
 * Search and collect websites for a niche and country
 * UPGRADED: Fetches per-user API key from Firestore
 * @param {string} niche - Target niche
 * @param {string} country - Target country
 * @param {number} limit - Result limit
 * @param {boolean} useAPI - Use API or fallback
 * @param {string} userId - User ID for fetching API key (optional)
 */
const searchWebsites = async (niche, country, limit = 100, useAPI = true, userId = null) => {
    try {
        console.log(`🔍 Searching websites for ${niche} in ${country}`);
        // Build search queries
        const queries = buildSearchQueries(niche, country);
        let websites = [];
        // Try API first if enabled
        if (useAPI) {
            // Fetch user's API keys if userId provided
            let userApiKeys = [];
            if (userId) {
                userApiKeys = await getUserSerpApiKeys(userId);
                if (userApiKeys.length > 0) {
                    console.log(`✅ Using user's personal SERP API keys (${userApiKeys.length} keys)`);
                }
            }
            // Get next key using rotation
            const userApiKey = userApiKeys.length > 0 ? getNextSerpApiKey(userId, userApiKeys) : null;
            websites = await searchWithSerpAPI(queries, limit, userApiKey);
        }
        // Use fallback if no results from API
        if (websites.length < limit / 2) {
            const fallback = getFallbackWebsites(niche, country, limit - websites.length);
            websites = [...new Set([...websites, ...fallback])]; // Remove duplicates
        }
        console.log(`✅ Found ${websites.length} websites for ${niche} in ${country}`);
        return websites.slice(0, limit);
    }
    catch (error) {
        console.error('Error searching websites:', error);
        return getFallbackWebsites(niche, country, limit); // Fallback
    }
};
/**
 * Validate and filter websites
 */
const validateWebsites = (websites) => {
    const validated = [];
    const urlRegex = /^(https?:\/\/)?([da-z.-]+)\.([a-z.]{2,6})(\/[w .-]*)*\/?$/i;
    for (const site of websites) {
        let url = site;
        // Add protocol if missing
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }
        // Validate format
        if (urlRegex.test(url)) {
            // Filter out social media and platforms
            const blockedDomains = [
                'facebook.com',
                'twitter.com',
                'instagram.com',
                'linkedin.com',
                'youtube.com',
                'tiktok.com'
            ];
            const isBlocked = blockedDomains.some(domain => url.includes(domain));
            if (!isBlocked) {
                validated.push(url);
            }
        }
    }
    return validated;
};
// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
    buildSearchQueries,
    searchWithSerpAPI,
    searchWebsites,
    validateWebsites,
    getFallbackWebsites,
    getUserSerpApiKeys,
    getNextSerpApiKey
};
//# sourceMappingURL=leadFinderWebSearchService.js.map