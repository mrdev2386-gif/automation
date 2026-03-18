/**
 * Process WhatsApp message with AI assistant logic
 * Priority: FAQ match → Lead capture → Intent detection → OpenAI fallback
 *
 * UPDATES:
 * - PART 1: Semantic FAQ matching with config threshold
 * - PART 2: Quick reply suggestions after response
 * - PART 3: Auto welcome message for new conversations
 *
 * @param {string} phoneNumberId - WhatsApp phone number ID
 * @param {string} from - Sender phone number
 * @param {string} messageText - Message text
 * @param {string} messageId - WhatsApp message ID
 * @returns {Object} - Processing result
 */
export function processAIAssistantMessage(phoneNumberId: string, from: string, messageText: string, messageId: string): Object;
/**
 * Find matching FAQ from client's knowledge base using semantic similarity
 * @param {string} clientUserId - Client user ID
 * @param {string} message - User message
 * @param {Object} config - Client configuration
 * @returns {Promise<Object|null>} - Matching FAQ with similarity score or null
 */
export function findMatchingFAQ(clientUserId: string, message: string, config: Object): Promise<Object | null>;
/**
 * Handle lead capture conversation flow
 * @param {Object} stateData - Current capture state
 * @param {string} message - User's message
 * @returns {Object} - Response and updated state
 */
export function handleLeadCaptureFlow(stateData: Object, message: string): Object;
//# sourceMappingURL=aiAssistant.d.ts.map