/**
 * Check if client can make an OpenAI call
 * @param {string} clientUserId - Client user ID
 * @param {number} estimatedTokens - Estimated tokens for this operation
 * @returns {Promise<{allowed: boolean, reason?: string, remaining?: number}>}
 */
export function checkOpenAICapacity(clientUserId: string, estimatedTokens?: number): Promise<{
    allowed: boolean;
    reason?: string;
    remaining?: number;
}>;
/**
 * Record actual OpenAI token usage after API call
 * @param {string} clientUserId - Client user ID
 * @param {number} tokensUsed - Actual tokens used
 */
export function recordOpenAIUsage(clientUserId: string, tokensUsed: number): Promise<void>;
/**
 * Get OpenAI usage for a client
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<Object>} - Usage statistics
 */
export function getOpenAIUsage(clientUserId: string): Promise<Object>;
/**
 * Get the fallback message when limits are hit
 * @param {string} customMessage - Optional custom fallback message
 * @returns {string} - Fallback message
 */
export function getFallbackMessage(customMessage?: string): string;
/**
 * Estimate cost for tokens
 * @param {number} tokens - Number of tokens
 * @returns {number} - Estimated cost in USD
 */
export function estimateCost(tokens: number): number;
/**
 * Get max response tokens for a client
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<number>} - Max tokens allowed
 */
export function getMaxResponseTokens(clientUserId: string): Promise<number>;
/**
 * Check and cap tokens if needed
 * @param {number} requestedTokens - Tokens requested
 * @param {number} maxAllowed - Maximum allowed
 * @returns {number} - Capped token count
 */
export function capTokens(requestedTokens: number, maxAllowed: number): number;
/**
 * Estimate tokens from text (rough approximation)
 * @param {string} text - Text to estimate
 * @returns {number} - Estimated token count
 */
export function estimateTokens(text: string): number;
export namespace COST_PROTECTION {
    let defaultDailyTokenLimit: number;
    let defaultMaxResponseTokens: number;
    let maxTokensPerEmbedding: number;
    let avgTokensPerWord: number;
    let fallbackMessage: string;
    let costPer1kTokens: number;
}
//# sourceMappingURL=openaiProtection.d.ts.map