/**
 * Check if a message has already been processed
 * @param {string} messageId - Meta message ID
 * @returns {Promise<boolean>} - True if already processed
 */
export function isMessageProcessed(messageId: string): Promise<boolean>;
/**
 * Mark a message as processed (idempotent)
 * Uses Firestore transaction to ensure atomicity
 * @param {string} messageId - Meta message ID
 * @param {Object} metadata - Additional metadata to store
 * @returns {Promise<boolean>} - True if successfully marked
 */
export function markMessageProcessed(messageId: string, metadata?: Object): Promise<boolean>;
/**
 * Atomic check-and-process operation
 * Checks if processed, if not, marks as processed and returns false
 * This prevents race conditions in concurrent processing
 *
 * @param {string} messageId - Meta message ID
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{alreadyProcessed: boolean, success: boolean}>}
 */
export function checkAndMarkProcessed(messageId: string, metadata?: Object): Promise<{
    alreadyProcessed: boolean;
    success: boolean;
}>;
/**
 * Clean up old processed message records
 * Should be called periodically (e.g., daily via scheduled function)
 * @returns {Promise<number>} - Number of records cleaned up
 */
export function cleanupOldProcessedMessages(): Promise<number>;
/**
 * Get processing statistics
 * @returns {Promise<Object>} - Statistics about processed messages
 */
export function getProcessingStats(): Promise<Object>;
export const PROCESSED_MESSAGES_COLLECTION: "processed_messages";
//# sourceMappingURL=idempotencyService.d.ts.map