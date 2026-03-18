/**
 * Detect intent from user message
 *
 * PHASE 6: Added timeout handling and robust error handling
 * If OpenAI fails, returns fallback intent to prevent webhook failure
 *
 * @param {string} message - User's message text
 * @returns {Promise<Object>} - Intent detection result
 */
export function detectIntent(message: string): Promise<Object>;
/**
 * Generate response based on intent (category-aware)
 * PHASE 6: Now uses category for dynamic responses
 *
 * @param {string} intent - Detected intent
 * @param {Object} restaurantData - Restaurant configuration
 * @returns {string} - Generated response text
 */
export function generateResponseByIntent(intent: string, restaurantData: Object): string;
/**
 * Get OpenAI client instance
 * @returns {Object} OpenAI client
 */
export function getOpenAIClient(): Object;
//# sourceMappingURL=intent.d.ts.map