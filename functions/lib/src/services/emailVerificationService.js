"use strict";
/**
 * Email Verification Service
 * Validates emails before storing leads
 *
 * Features:
 * - Regex validation
 * - DNS MX record validation
 * - Disposable email detection
 * - Business domain filtering
 */
const dns = require('dns').promises;
// ============================================================================
// CONFIGURATION
// ============================================================================
// Disposable email domains (common temporary email services)
const DISPOSABLE_DOMAINS = new Set([
    'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
    'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
    'yopmail.com', 'maildrop.cc', 'getnada.com', 'sharklasers.com'
]);
// Personal email domains (not business emails)
const PERSONAL_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'live.com', 'msn.com', 'aol.com', 'mail.com', 'protonmail.com',
    'zoho.com', 'yandex.com', 'gmx.com'
]);
// Email regex pattern (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================
/**
 * Step 1: Regex validation
 */
const isValidEmailFormat = (email) => {
    if (!email || typeof email !== 'string')
        return false;
    return EMAIL_REGEX.test(email.toLowerCase());
};
/**
 * Step 2: Extract domain from email
 */
const extractDomain = (email) => {
    if (!email || typeof email !== 'string')
        return null;
    const parts = email.toLowerCase().split('@');
    return parts.length === 2 ? parts[1] : null;
};
/**
 * Step 3: Check if domain is disposable
 */
const isDisposableDomain = (domain) => {
    if (!domain)
        return false;
    return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
};
/**
 * Step 4: Check if domain is personal (not business)
 */
const isPersonalDomain = (domain) => {
    if (!domain)
        return false;
    return PERSONAL_DOMAINS.has(domain.toLowerCase());
};
/**
 * Step 5: DNS MX record validation
 * Checks if domain has valid mail exchange records
 */
const hasMXRecord = async (domain) => {
    if (!domain)
        return false;
    try {
        const records = await dns.resolveMx(domain);
        return records && records.length > 0;
    }
    catch (error) {
        // DNS lookup failed - domain doesn't exist or has no MX records
        return false;
    }
};
/**
 * Step 6: Optional SMTP verification (basic check)
 * Note: Full SMTP verification requires connecting to mail server
 * This is a lightweight check that can be expanded
 */
const canReceiveEmail = async (domain) => {
    // For now, just check MX records
    // Can be expanded to actual SMTP connection if needed
    return hasMXRecord(domain);
};
// ============================================================================
// MAIN VERIFICATION FUNCTION
// ============================================================================
/**
 * Verify email address
 *
 * @param {string} email - Email address to verify
 * @param {object} options - Verification options
 * @param {boolean} options.allowPersonalEmails - Allow personal domains (default: false)
 * @param {boolean} options.checkMX - Check MX records (default: true)
 * @param {boolean} options.checkDisposable - Check disposable domains (default: true)
 *
 * @returns {object} Verification result
 */
const verifyEmail = async (email, options = {}) => {
    const { allowPersonalEmails = false, checkMX = true, checkDisposable = true } = options;
    const result = {
        valid: false,
        email: email ? email.toLowerCase() : '',
        reason: null,
        checks: {
            format: false,
            disposable: false,
            personal: false,
            mxRecord: false
        }
    };
    // Step 1: Format validation
    if (!isValidEmailFormat(email)) {
        result.reason = 'Invalid email format';
        return result;
    }
    result.checks.format = true;
    // Extract domain
    const domain = extractDomain(email);
    if (!domain) {
        result.reason = 'Invalid domain';
        return result;
    }
    // Step 2: Check disposable domains
    if (checkDisposable && isDisposableDomain(domain)) {
        result.checks.disposable = true;
        result.reason = 'Disposable email domain not allowed';
        return result;
    }
    // Step 3: Check personal domains
    if (!allowPersonalEmails && isPersonalDomain(domain)) {
        result.checks.personal = true;
        result.reason = 'Personal email domain not allowed (business emails only)';
        return result;
    }
    // Step 4: Check MX records
    if (checkMX) {
        try {
            const hasMX = await hasMXRecord(domain);
            result.checks.mxRecord = hasMX;
            if (!hasMX) {
                result.reason = 'Domain has no mail exchange records';
                return result;
            }
        }
        catch (error) {
            result.reason = 'DNS lookup failed';
            return result;
        }
    }
    // All checks passed
    result.valid = true;
    result.reason = 'Email verified successfully';
    return result;
};
/**
 * Batch verify multiple emails
 */
const verifyEmailBatch = async (emails, options = {}) => {
    const results = [];
    for (const email of emails) {
        const result = await verifyEmail(email, options);
        results.push(result);
    }
    return results;
};
/**
 * Quick validation (format + disposable only, no DNS)
 * Useful for fast validation without network calls
 */
const quickVerifyEmail = (email, allowPersonalEmails = false) => {
    const result = {
        valid: false,
        email: email ? email.toLowerCase() : '',
        reason: null
    };
    // Format check
    if (!isValidEmailFormat(email)) {
        result.reason = 'Invalid email format';
        return result;
    }
    const domain = extractDomain(email);
    if (!domain) {
        result.reason = 'Invalid domain';
        return result;
    }
    // Disposable check
    if (isDisposableDomain(domain)) {
        result.reason = 'Disposable email domain not allowed';
        return result;
    }
    // Personal domain check
    if (!allowPersonalEmails && isPersonalDomain(domain)) {
        result.reason = 'Personal email domain not allowed';
        return result;
    }
    result.valid = true;
    result.reason = 'Email passed quick validation';
    return result;
};
// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
    verifyEmail,
    verifyEmailBatch,
    quickVerifyEmail,
    isValidEmailFormat,
    extractDomain,
    isDisposableDomain,
    isPersonalDomain,
    hasMXRecord,
    DISPOSABLE_DOMAINS,
    PERSONAL_DOMAINS
};
//# sourceMappingURL=emailVerificationService.js.map