"use strict";
/**
 * Directory Filtering Service
 * Detects and filters directory/listing websites
 */
const DIRECTORY_DOMAINS = new Set([
    'yelp.com',
    'yellowpages.com',
    'clutch.co',
    'trustpilot.com',
    'linkedin.com',
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'crunchbase.com',
    'bbb.org',
    'manta.com',
    'superpages.com',
    'whitepages.com',
    'foursquare.com',
    'tripadvisor.com'
]);
/**
 * Check if URL is a directory/listing site
 */
const isDirectorySite = (url) => {
    if (!url)
        return false;
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        const hostname = urlObj.hostname.toLowerCase().replace('www.', '');
        return DIRECTORY_DOMAINS.has(hostname);
    }
    catch (error) {
        return false;
    }
};
/**
 * Filter out directory sites from website list
 */
const filterDirectorySites = (websites) => {
    return websites.filter(url => !isDirectorySite(url));
};
module.exports = {
    isDirectorySite,
    filterDirectorySites,
    DIRECTORY_DOMAINS
};
//# sourceMappingURL=directoryFilterService.js.map