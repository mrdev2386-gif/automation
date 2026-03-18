/**
 * Queue a text message for sending
 * @param {string} to - Recipient phone number
 * @param {string} text - Message text
 * @param {Object} credentials - WhatsApp credentials
 * @param {string} idempotencyKey - Unique key to prevent duplicate sends
 * @returns {Promise<string|null>} - Queue ID or null if failed
 */
export function queueTextMessage(to: string, text: string, credentials: Object, idempotencyKey?: string): Promise<string | null>;
/**
 * Queue a template message for sending
 * @param {string} to - Recipient phone number
 * @param {string} templateName - Template name
 * @param {string} languageCode - Language code
 * @param {Array} components - Template components
 * @param {Object} credentials - WhatsApp credentials
 * @param {string} idempotencyKey - Unique key
 * @returns {Promise<string|null>} - Queue ID
 */
export function queueTemplateMessage(to: string, templateName: string, languageCode: string, components: any[], credentials: Object, idempotencyKey?: string): Promise<string | null>;
/**
 * Process a single queue item
 * @param {string} queueId - Queue item ID
 * @returns {Promise<boolean>} - Success status
 */
export function processQueueItem(queueId: string): Promise<boolean>;
/**
 * Process pending queue items (batch worker)
 * @param {number} batchSize - Number of items to process
 * @returns {Promise<{processed: number, sent: number, failed: number}>}
 */
export function processPendingQueue(batchSize?: number): Promise<{
    processed: number;
    sent: number;
    failed: number;
}>;
/**
 * Get queue statistics
 * @param {string} clientUserId - Optional filter by client
 * @returns {Promise<Object>} - Queue stats
 */
export function getQueueStats(clientUserId?: string): Promise<Object>;
/**
 * Clean up old processed queue items
 * @returns {Promise<number>} - Number of items cleaned up
 */
export function cleanupOldQueueItems(): Promise<number>;
/**
 * Retry dead-lettered messages
 * @param {string} queueId - Queue item ID
 * @returns {Promise<boolean>} - Success
 */
export function retryDeadLetter(queueId: string): Promise<boolean>;
export function sendTextMessage(to: any, text: any, credentials: any): Promise<{
    queued: boolean;
    queueId: string;
} | null>;
export function sendTemplateMessage(to: any, templateName: any, languageCode: any, components: any, credentials: any): Promise<{
    queued: boolean;
    queueId: string;
} | null>;
export const OUTBOUND_QUEUE_COLLECTION: "outbound_queue";
export const MAX_RETRIES: 5;
//# sourceMappingURL=queueSender.d.ts.map