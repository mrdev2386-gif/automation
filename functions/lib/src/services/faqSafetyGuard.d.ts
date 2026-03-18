/**
 * Get client-specific thresholds
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<Object>} - Threshold configuration
 */
export function getClientThresholds(clientUserId: string): Promise<Object>;
/**
 * Categorize a match based on similarity score and thresholds
 * @param {number} similarity - Similarity score (0-1)
 * @param {Object} thresholds - Client thresholds
 * @returns {Object} - Match categorization
 */
export function categorizeMatch(similarity: number, thresholds: Object): Object;
/**
 * Get confirmation prompt with FAQ answer
 * @param {string} faqAnswer - The matched FAQ answer
 * @returns {string} - Confirmation prompt
 */
export function getConfirmationPrompt(faqAnswer: string): string;
/**
 * Get a fallback response
 * @returns {string} - Random fallback message
 */
export function getFallbackResponse(): string;
/**
 * Safe FAQ matching with all safety guards
 * This should be used instead of direct semantic matching
 *
 * @param {string} clientUserId - Client user ID
 * @param {string} message - User message
 * @param {Object} faqs - Array of FAQ objects with embeddings
 * @returns {Promise<Object>} - Match result with safety checks
 */
export function safeFaqMatch(clientUserId: string, message: string, faqs: Object): Promise<Object>;
/**
 * Evaluate a semantic match with safety guards
 * @param {number} similarity - The similarity score
 * @param {Object} faq - The matched FAQ
 * @param {Object} thresholds - Client thresholds
 * @returns {Object} - Evaluation result
 */
export function evaluateSemanticMatch(similarity: number, faq: Object, thresholds: Object): Object;
/**
 * Create a confirmation buttons payload for borderline matches
 * @param {string} faqAnswer - The matched FAQ answer
 * @returns {Object} - Interactive buttons payload
 */
export function createConfirmationButtons(faqAnswer: string): Object;
export namespace DEFAULT_THRESHOLDS {
    let minimumMatch: number;
    let confirmationZone: number;
    let highConfidence: number;
}
export const FALLBACK_RESPONSES: string[];
export const CONFIRMATION_PROMPTS: string[];
//# sourceMappingURL=faqSafetyGuard.d.ts.map