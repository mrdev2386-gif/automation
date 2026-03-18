/**
 * Send a text message via WhatsApp Cloud API
 * @param {string} to - Recipient phone number
 * @param {string} text - Message text
 * @param {Object} credentials - { whatsappToken, whatsappNumberId }
 */
export function sendTextMessage(to: string, text: string, credentials?: Object): Promise<any>;
/**
 * Send a template message via WhatsApp Cloud API
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} templateName - Template name
 * @param {string} languageCode - Language code (e.g., 'en_US')
 * @param {Array} components - Template components (optional)
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
export function sendTemplateMessage(to: string, templateName: string, languageCode?: string, components?: any[], credentials?: null): Promise<Object | null>;
/**
 * PHASE 7: Send media message (wrapper for image, video, audio)
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} mediaType - Type of media: 'image', 'video', 'audio', 'sticker'
 * @param {string} mediaUrl - URL of the media file
 * @param {string} caption - Optional caption
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
export function sendMediaMessage(to: string, mediaType: string, mediaUrl: string, caption?: string, credentials?: null): Promise<Object | null>;
/**
 * Send a document/file via WhatsApp Cloud API
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} documentUrl - URL of the document
 * @param {string} caption - Document caption
 * @param {string} filename - Filename
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
export function sendDocument(to: string, documentUrl: string, caption?: string, filename?: string, credentials?: null): Promise<Object | null>;
/**
 * Send an interactive list message
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} body - Message body text
 * @param {string} buttonText - Button text
 * @param {Array} sections - List sections
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
export function sendListMessage(to: string, body: string, buttonText: string, sections: any[], credentials?: null): Promise<Object | null>;
/**
 * Mark message as read
 * @param {string} messageId - Message ID to mark as read
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
export function markMessageAsRead(messageId: string, credentials?: null): Promise<Object | null>;
/**
 * PART 5: Send interactive button message (quick replies)
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} body - Message body text
 * @param {Array} buttons - Array of button texts (max 3)
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
export function sendInteractiveButtons(to: string, body: string, buttons: any[], credentials?: null): Promise<Object | null>;
/**
 * Helper function to safely send messages with error handling
 * UPDATED: Support dynamic per-tenant credentials
 * @param {string} url - API URL
 * @param {Object} payload - API payload
 * @param {string} operationName - Name for logging
 * @param {Object} credentials - optional { whatsappToken, whatsappNumberId }
 */
export function safeSendMessage(url: string, payload: Object, operationName?: string, credentials?: Object): Promise<any>;
//# sourceMappingURL=sender.d.ts.map