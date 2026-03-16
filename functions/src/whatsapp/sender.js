/**
 * WhatsApp Sender Module
 * Handles sending messages via WhatsApp Cloud API
 * 
 * PHASE 1: Added retry logic for transient failures
 * FIX 6: Added try/catch, handle non-200 responses, clear Meta error logging
 * Never throws uncaught errors
 */

const axios = require('axios');

// Get environment variables
const getWhatsAppToken = () => process.env.WHATSAPP_TOKEN;
const getPhoneNumberId = () => process.env.PHONE_NUMBER_ID;
const getWhatsAppBusinessAccountId = () => process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

// ============================================================================
// PHASE 1: Retry configuration for transient failures
// ============================================================================
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;

/**
 * PHASE 1: Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * PHASE 1: Check if error is transient and worth retrying
 * @param {Error} error - Error to check
 * @returns {boolean} - True if should retry
 */
const isTransientError = (error) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return true; // Timeout
    }
    if (error.response) {
        const status = error.response.status;
        // Retry on 429 (too many requests), 500, 502, 503, 504
        return status === 429 || status >= 500;
    }
    if (error.request && !error.response) {
        return true; // Network error
    }
    return false;
};

/**
 * Helper function to safely send messages with error handling
 * UPDATED: Support dynamic per-tenant credentials
 * @param {string} url - API URL
 * @param {Object} payload - API payload
 * @param {string} operationName - Name for logging
 * @param {Object} credentials - optional { whatsappToken, whatsappNumberId }
 */
const safeSendMessage = async (url, payload, operationName = 'message', credentials = null) => {
    // 1. Prioritize dynamic credentials from client document
    // 2. Fallback to process.env (Legacy/Global)
    const token = credentials?.whatsappToken || getWhatsAppToken();
    const phoneNumberId = credentials?.whatsappNumberId || getPhoneNumberId();

    if (!token) {
        const error = new Error(`WHATSAPP_TOKEN is not configured for ${operationName}`);
        console.error(`Error sending ${operationName}:`, error.message);
        return null;
    }

    if (!phoneNumberId) {
        const error = new Error(`PHONE_NUMBER_ID is not configured for ${operationName}`);
        console.error(`Error sending ${operationName}:`, error.message);
        return null;
    }

    // Ensure the URL uses the correct phoneNumberId if it was constructed with a placeholder
    // Note: Most functions now construct the URL using the correct ID, but we should be safe.
    let finalUrl = url;
    if (credentials?.whatsappNumberId && !url.includes(credentials.whatsappNumberId)) {
        // If the URL was built with process.env.PHONE_NUMBER_ID but we have a custom one, swap it
        const envId = getPhoneNumberId();
        if (envId) finalUrl = url.replace(envId, credentials.whatsappNumberId);
    }

    let lastError = null;

    // Retry loop for transient failures
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`Retry attempt ${attempt} for ${operationName}...`);
                await sleep(RETRY_DELAY_MS * attempt);
            }

            const response = await axios.post(finalUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });

            if (response.status !== 200 && response.status !== 201) {
                console.error(`Meta API returned non-200 status: ${response.status}`, response.data);
                return null;
            }

            console.log(`${operationName} sent successfully:`, response.data);
            return response.data;
        } catch (error) {
            lastError = error;
            if (!isTransientError(error)) {
                if (error.response) {
                    console.error(`Meta API error (${error.response.status}):`, JSON.stringify(error.response.data, null, 2));
                } else {
                    console.error('Error sending message:', error.message);
                }
                break;
            }
            console.warn(`Transient error on attempt ${attempt + 1}, will retry:`, error.message);
        }
    }

    console.error(`Failed to send ${operationName} after ${MAX_RETRIES + 1} attempts:`, lastError?.message);
    return null;
};

/**
 * Send a text message via WhatsApp Cloud API
 * @param {string} to - Recipient phone number
 * @param {string} text - Message text
 * @param {Object} credentials - { whatsappToken, whatsappNumberId }
 */
const sendTextMessage = async (to, text, credentials = null) => {
    if (!to || !text) return null;

    const phoneNumberId = credentials?.whatsappNumberId || getPhoneNumberId();
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text },
    };

    return safeSendMessage(url, payload, 'text message', credentials);
};

/**
 * Send a template message via WhatsApp Cloud API
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} templateName - Template name
 * @param {string} languageCode - Language code (e.g., 'en_US')
 * @param {Array} components - Template components (optional)
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
const sendTemplateMessage = async (to, templateName, languageCode = 'en_US', components = [], credentials = null) => {
    if (!to || !templateName) {
        console.error('sendTemplateMessage: Missing required parameters');
        return null;
    }

    const phoneNumberId = credentials?.whatsappNumberId || getPhoneNumberId();
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: languageCode,
            },
            components: components,
        },
    };

    return safeSendMessage(url, payload, 'template message', credentials);
};

/**
 * Send a document/file via WhatsApp Cloud API
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} documentUrl - URL of the document
 * @param {string} caption - Document caption
 * @param {string} filename - Filename
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
const sendDocument = async (to, documentUrl, caption = '', filename = '', credentials = null) => {
    if (!to || !documentUrl) {
        console.error('sendDocument: Missing required parameters');
        return null;
    }

    const phoneNumberId = credentials?.whatsappNumberId || getPhoneNumberId();
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'document',
        document: {
            link: documentUrl,
            caption: caption,
            filename: filename,
        },
    };

    return safeSendMessage(url, payload, 'document', credentials);
};

/**
 * PHASE 7: Send media message (wrapper for image, video, audio)
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} mediaType - Type of media: 'image', 'video', 'audio', 'sticker'
 * @param {string} mediaUrl - URL of the media file
 * @param {string} caption - Optional caption
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
const sendMediaMessage = async (to, mediaType, mediaUrl, caption = '', credentials = null) => {
    if (!to || !mediaType || !mediaUrl) {
        console.error('sendMediaMessage: Missing required parameters');
        return null;
    }

    const validTypes = ['image', 'video', 'audio', 'sticker'];
    if (!validTypes.includes(mediaType)) {
        console.error(`sendMediaMessage: Invalid media type '${mediaType}'. Must be one of: ${validTypes.join(', ')}`);
        return null;
    }

    const phoneNumberId = credentials?.whatsappNumberId || getPhoneNumberId();
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: mediaType,
        [mediaType]: {
            link: mediaUrl,
        },
    };

    // Add caption for image and video
    if (caption && (mediaType === 'image' || mediaType === 'video')) {
        payload[mediaType].caption = caption;
    }

    return safeSendMessage(url, payload, `${mediaType} message`, credentials);
};

/**
 * Send an interactive list message
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} body - Message body text
 * @param {string} buttonText - Button text
 * @param {Array} sections - List sections
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
const sendListMessage = async (to, body, buttonText, sections, credentials = null) => {
    if (!to || !body || !buttonText || !sections) {
        console.error('sendListMessage: Missing required parameters');
        return null;
    }

    const phoneNumberId = credentials?.whatsappNumberId || getPhoneNumberId();
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'list',
            body: {
                text: body,
            },
            action: {
                button: buttonText,
                sections: sections,
            },
        },
    };

    return safeSendMessage(url, payload, 'list message', credentials);
};

/**
 * Mark message as read
 * @param {string} messageId - Message ID to mark as read
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
const markMessageAsRead = async (messageId, credentials = null) => {
    if (!messageId) {
        console.error('markMessageAsRead: Missing messageId');
        return null;
    }

    const phoneNumberId = credentials?.whatsappNumberId || getPhoneNumberId();
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
    };

    return safeSendMessage(url, payload, 'mark as read', credentials);
};

/**
 * PART 5: Send interactive button message (quick replies)
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} body - Message body text
 * @param {Array} buttons - Array of button texts (max 3)
 * @returns {Promise<Object|null>} - WhatsApp API response or null on failure
 */
const sendInteractiveButtons = async (to, body, buttons, credentials = null) => {
    if (!to || !body || !buttons || buttons.length === 0) {
        console.error('sendInteractiveButtons: Missing required parameters');
        return null;
    }

    // Limit to max 3 buttons as per WhatsApp API
    const limitedButtons = buttons.slice(0, 3);

    const phoneNumberId = credentials?.whatsappNumberId || getPhoneNumberId();
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: body,
            },
            action: {
                buttons: limitedButtons.map((buttonText, index) => ({
                    type: 'reply',
                    reply: {
                        id: `suggestion_${index}_${Date.now()}`,
                        title: buttonText.substring(0, 20) // Max 20 chars per button
                    }
                }))
            }
        }
    };

    return safeSendMessage(url, payload, 'interactive buttons', credentials);
};

module.exports = {
    sendTextMessage,
    sendTemplateMessage,
    sendMediaMessage,  // PHASE 7: Added wrapper for media (image, video, audio)
    sendDocument,
    sendListMessage,
    markMessageAsRead,
    sendInteractiveButtons, // PART 5: New interactive buttons
    safeSendMessage,   // Export for testing
};
