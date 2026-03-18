/**
 * Main webhook handler
 */
export function handleWebhook(req: any, res: any): any;
/**
 * Handle WhatsApp webhook verification (GET)
 * Meta uses this to verify the webhook URL
 */
export function handleVerification(req: any, res: any): any;
/**
 * Handle incoming WhatsApp messages (POST)
 *
 * FIX 2: Returns 200 IMMEDIATELY then processes asynchronously
 * This prevents Meta retries due to slow webhook response
 */
export function handleIncomingMessage(req: any, res: any): Promise<void>;
/**
 * Process WhatsApp message asynchronously
 * This is called AFTER the 200 response has been sent
 * @param {Object} payload - Raw request body
 */
export function processMessageAsync(payload: Object): Promise<void>;
/**
 * Handle booking flow state machine
 * PHASE 5: Uses dynamic booking prompts based on category
 * UPDATED: Uses client credentials and ownerId for multi-tenant isolation
 */
export function handleBookingFlow(user: any, restaurant: any, messageText: any): Promise<string>;
/**
 * Build booking prompt based on category and step
 * @param {string} category - Business category
 * @param {string} step - Current booking step
 * @param {Object} state - Current booking state
 * @returns {string} - Localized prompt text
 */
export function buildBookingPrompt(category: string, step: string, state?: Object): string;
//# sourceMappingURL=webhook.d.ts.map