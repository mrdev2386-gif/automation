"use strict";
/**
 * Lead Scoring Service
 * Calculates quality score for extracted emails
 */
/**
 * Calculate lead score based on email and website
 */
const calculateLeadScore = (email, websiteDomain) => {
    let score = 0;
    if (!email)
        return score;
    const emailLower = email.toLowerCase();
    const localPart = emailLower.split('@')[0];
    const emailDomain = emailLower.split('@')[1];
    // High-value contact emails (+5)
    const highValuePrefixes = ['sales', 'contact', 'info', 'marketing'];
    if (highValuePrefixes.some(prefix => localPart.includes(prefix))) {
        score += 5;
    }
    // Role-based emails (+3)
    const rolePrefixes = ['admin', 'support', 'help', 'service'];
    if (rolePrefixes.some(prefix => localPart.includes(prefix))) {
        score += 3;
    }
    // Domain match (+10)
    if (websiteDomain && emailDomain) {
        const cleanWebsiteDomain = websiteDomain.replace('www.', '').toLowerCase();
        const cleanEmailDomain = emailDomain.replace('www.', '').toLowerCase();
        if (cleanWebsiteDomain === cleanEmailDomain) {
            score += 10;
        }
    }
    return score;
};
module.exports = {
    calculateLeadScore
};
//# sourceMappingURL=leadScoringService.js.map