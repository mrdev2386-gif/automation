/**
 * Check if welcome message can be sent to a phone number
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<{allowed: boolean, reason?: string, nextAllowedAt?: Date}>}
 */
export function canSendWelcome(clientUserId: string, phoneNumber: string): Promise<{
    allowed: boolean;
    reason?: string;
    nextAllowedAt?: Date;
}>;
/**
 * Record that a welcome message was sent
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User's phone number
 * @param {number} cooldownHours - Optional custom cooldown
 */
export function recordWelcomeSent(clientUserId: string, phoneNumber: string, cooldownHours?: number): Promise<void>;
/**
 * Check if this is a new conversation (no recent messages)
 * Used to determine if welcome should be sent
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User's phone number
 * @param {number} lookbackHours - Hours to look back for messages
 * @returns {Promise<boolean>} - True if new conversation
 */
export function isNewConversation(clientUserId: string, phoneNumber: string, lookbackHours?: number): Promise<boolean>;
/**
 * Check if welcome should be sent and record it atomically
 * This is the main entry point for welcome message logic
 *
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<{shouldSend: boolean, reason?: string}>}
 */
export function shouldSendWelcome(clientUserId: string, phoneNumber: string): Promise<{
    shouldSend: boolean;
    reason?: string;
}>;
/**
 * Send welcome message with spam guard
 * Combines all checks and sends the message
 *
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User's phone number
 * @param {Object} config - Client welcome config
 * @param {Object} sender - Message sender function
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
export function sendWelcomeWithGuard(clientUserId: string, phoneNumber: string, config: Object, sender: Object): Promise<{
    sent: boolean;
    reason?: string;
}>;
/**
 * Get welcome statistics for a client
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<Object>} - Welcome statistics
 */
export function getWelcomeStats(clientUserId: string): Promise<Object>;
/**
 * Reset welcome guard for a phone (admin function)
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - Phone to reset
 * @returns {Promise<boolean>} - Success
 */
export function resetWelcomeGuard(clientUserId: string, phoneNumber: string): Promise<boolean>;
export const DEFAULT_COOLDOWN_HOURS: 24;
//# sourceMappingURL=welcomeSpamGuard.d.ts.map