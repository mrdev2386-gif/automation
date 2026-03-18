/**
 * Check if inbound message is allowed for a phone
 * @param {string} phoneNumber - User's phone number
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
 */
export function checkInboundRateLimit(phoneNumber: string, clientUserId: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}>;
/**
 * Record an inbound message (increment counters)
 * @param {string} phoneNumber - User's phone number
 * @param {string} clientUserId - Client user ID
 */
export function recordInboundMessage(phoneNumber: string, clientUserId: string): Promise<void>;
/**
 * Check if outbound send is allowed
 * @param {string} to - Recipient phone number
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
export function checkOutboundRateLimit(to: string, clientUserId: string): Promise<{
    allowed: boolean;
    reason?: string;
}>;
/**
 * Record an outbound send
 * @param {string} to - Recipient phone
 * @param {string} clientUserId - Client user ID
 */
export function recordOutboundSend(to: string, clientUserId: string): Promise<void>;
/**
 * Check if OpenAI call is allowed for client
 * @param {string} clientUserId - Client user ID
 * @param {number} estimatedTokens - Estimated tokens for this call
 * @returns {Promise<{allowed: boolean, reason?: string, remainingTokens?: number}>}
 */
export function checkOpenAIRateLimit(clientUserId: string, estimatedTokens?: number): Promise<{
    allowed: boolean;
    reason?: string;
    remainingTokens?: number;
}>;
/**
 * Record OpenAI token usage
 * @param {string} clientUserId - Client user ID
 * @param {number} tokensUsed - Number of tokens used
 */
export function recordOpenAIUsage(clientUserId: string, tokensUsed: number): Promise<void>;
/**
 * Get current usage for a client
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<Object>} - Usage stats
 */
export function getClientUsageStats(clientUserId: string): Promise<Object>;
/**
 * Clean up expired rate limit entries
 * @returns {Promise<number>} - Number cleaned up
 */
export function cleanupExpiredRateLimits(): Promise<number>;
export namespace RATE_LIMITS {
    namespace inbound {
        let perPhonePerMinute: number;
        let perClientPerMinute: number;
    }
    namespace outbound {
        let perClientPerMinute_1: number;
        export { perClientPerMinute_1 as perClientPerMinute };
        let perPhonePerMinute_1: number;
        export { perPhonePerMinute_1 as perPhonePerMinute };
    }
    namespace openai {
        let callsPerClientPerMinute: number;
        let dailyTokenCap: number;
        let maxTokensPerResponse: number;
    }
}
//# sourceMappingURL=rateLimitService.d.ts.map