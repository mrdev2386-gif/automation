"use strict";
/**
 * Production Hardening - Secret Masking Utility
 * Ensures API keys and secrets are never exposed to clients
 *
 * Features:
 * - Mask sensitive fields before returning to client
 * - Never log secrets
 * - Encrypted storage support
 */
const CRYPTO = require('crypto');
// Fields that should never be sent to client
const FORBIDDEN_FIELDS = [
    'whatsappToken',
    'whatsappAccessToken',
    'openaiApiKey',
    'openaiKey',
    'metaAccessToken',
    'facebookAccessToken',
    'apiSecret',
    'secretKey',
    'privateKey',
    'password',
    'accessToken'
];
// Fields that should be masked (show only partial)
const MASKED_FIELDS = [
    'phoneNumberId',
    'businessAccountId'
];
/**
 * Mask a secret value, showing only first and last few characters
 * @param {string} value - The value to mask
 * @param {number} showChars - Number of chars to show at start/end
 * @returns {string} - Masked value
 */
const maskSecret = (value, showChars = 4) => {
    if (!value || typeof value !== 'string') {
        return value;
    }
    if (value.length <= showChars * 2) {
        return '*'.repeat(value.length);
    }
    return value.substring(0, showChars) + '****' + value.substring(value.length - showChars);
};
/**
 * Check if a field name is forbidden (should never be sent to client)
 * @param {string} fieldName - Field name to check
 * @returns {boolean}
 */
const isForbiddenField = (fieldName) => {
    const lowerName = fieldName.toLowerCase();
    return FORBIDDEN_FIELDS.some(forbidden => lowerName === forbidden.toLowerCase() ||
        lowerName.includes(forbidden.toLowerCase()));
};
/**
 * Check if a field should be masked
 * @param {string} fieldName - Field name to check
 * @returns {boolean}
 */
const isMaskedField = (fieldName) => {
    const lowerName = fieldName.toLowerCase();
    return MASKED_FIELDS.some(field => lowerName === field.toLowerCase());
};
/**
 * Remove or mask sensitive fields from an object before sending to client
 * @param {Object} data - Data to sanitize
 * @param {boolean} maskInsteadOfRemove - If true, mask instead of remove
 * @returns {Object} - Sanitized data
 */
const sanitizeForClient = (data, maskInsteadOfRemove = true) => {
    if (!data || typeof data !== 'object') {
        return data;
    }
    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizeForClient(item, maskInsteadOfRemove));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (isForbiddenField(key)) {
            // Don't include forbidden fields at all
            continue;
        }
        if (isMaskedField(key) && typeof value === 'string') {
            // Mask the value
            sanitized[key] = maskSecret(value);
        }
        else if (typeof value === 'object' && value !== null) {
            // Recursively sanitize nested objects
            sanitized[key] = sanitizeForClient(value, maskInsteadOfRemove);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};
/**
 * Log safely without exposing secrets
 * @param {string} message - Message to log
 * @param {Object} data - Data to log (will be sanitized)
 */
const safeLog = (message, data = {}) => {
    const sanitizedData = sanitizeForClient(data, true);
    console.log(message, sanitizedData);
};
/**
 * Log error safely
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object
 */
const safeErrorLog = (message, error) => {
    const sanitizedError = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
    const sanitized = sanitizeForClient(sanitizedError, true);
    console.error(message, sanitized);
};
// Simple encryption key management (for future Cloud KMS integration)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-prod';
/**
 * Encrypt a sensitive value (simple AES encryption for basic protection)
 * Note: For production, use Cloud KMS
 * @param {string} value - Value to encrypt
 * @returns {string} - Encrypted value
 */
const encryptValue = (value) => {
    if (!value)
        return value;
    try {
        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    catch (error) {
        console.error('Encryption error:', error);
        return value;
    }
};
/**
 * Decrypt a sensitive value
 * @param {string} encryptedValue - Encrypted value
 * @returns {string} - Decrypted value
 */
const decryptValue = (encryptedValue) => {
    if (!encryptedValue || !encryptedValue.includes(':'))
        return encryptedValue;
    try {
        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
        const parts = encryptedValue.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Decryption error:', error);
        return encryptedValue;
    }
};
/**
 * Store a secret securely (encrypt before storing)
 * @param {Object} docRef - Firestore document reference
 * @param {string} fieldName - Field name
 * @param {string} value - Value to store securely
 */
const storeSecretSecurely = async (docRef, fieldName, value) => {
    const encrypted = encryptValue(value);
    await docRef.set({
        [fieldName]: encrypted
    }, { merge: true });
};
/**
 * Retrieve and decrypt a secret
 * @param {Object} docSnap - Firestore document snapshot
 * @param {string} fieldName - Field name
 * @returns {string|null} - Decrypted value or null
 */
const retrieveSecret = (docSnap, fieldName) => {
    const encrypted = docSnap.get(fieldName);
    if (!encrypted)
        return null;
    return decryptValue(encrypted);
};
module.exports = {
    maskSecret,
    isForbiddenField,
    isMaskedField,
    sanitizeForClient,
    safeLog,
    safeErrorLog,
    encryptValue,
    decryptValue,
    storeSecretSecurely,
    retrieveSecret,
    FORBIDDEN_FIELDS,
    MASKED_FIELDS
};
//# sourceMappingURL=secretMasking.js.map