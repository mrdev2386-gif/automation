/**
 * Mask a secret value, showing only first and last few characters
 * @param {string} value - The value to mask
 * @param {number} showChars - Number of chars to show at start/end
 * @returns {string} - Masked value
 */
export function maskSecret(value: string, showChars?: number): string;
/**
 * Check if a field name is forbidden (should never be sent to client)
 * @param {string} fieldName - Field name to check
 * @returns {boolean}
 */
export function isForbiddenField(fieldName: string): boolean;
/**
 * Check if a field should be masked
 * @param {string} fieldName - Field name to check
 * @returns {boolean}
 */
export function isMaskedField(fieldName: string): boolean;
/**
 * Remove or mask sensitive fields from an object before sending to client
 * @param {Object} data - Data to sanitize
 * @param {boolean} maskInsteadOfRemove - If true, mask instead of remove
 * @returns {Object} - Sanitized data
 */
export function sanitizeForClient(data: Object, maskInsteadOfRemove?: boolean): Object;
/**
 * Log safely without exposing secrets
 * @param {string} message - Message to log
 * @param {Object} data - Data to log (will be sanitized)
 */
export function safeLog(message: string, data?: Object): void;
/**
 * Log error safely
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object
 */
export function safeErrorLog(message: string, error: Error | Object): void;
/**
 * Encrypt a sensitive value (simple AES encryption for basic protection)
 * Note: For production, use Cloud KMS
 * @param {string} value - Value to encrypt
 * @returns {string} - Encrypted value
 */
export function encryptValue(value: string): string;
/**
 * Decrypt a sensitive value
 * @param {string} encryptedValue - Encrypted value
 * @returns {string} - Decrypted value
 */
export function decryptValue(encryptedValue: string): string;
/**
 * Store a secret securely (encrypt before storing)
 * @param {Object} docRef - Firestore document reference
 * @param {string} fieldName - Field name
 * @param {string} value - Value to store securely
 */
export function storeSecretSecurely(docRef: Object, fieldName: string, value: string): Promise<void>;
/**
 * Retrieve and decrypt a secret
 * @param {Object} docSnap - Firestore document snapshot
 * @param {string} fieldName - Field name
 * @returns {string|null} - Decrypted value or null
 */
export function retrieveSecret(docSnap: Object, fieldName: string): string | null;
export const FORBIDDEN_FIELDS: string[];
export const MASKED_FIELDS: string[];
//# sourceMappingURL=secretMasking.d.ts.map