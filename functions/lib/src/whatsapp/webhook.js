"use strict";
/**
 * WhatsApp Webhook Handler
 * Receives and processes incoming WhatsApp messages
 *
 * SECURITY ENHANCEMENTS:
 * - Webhook signature verification
 * - Rate limiting
 * - Duplicate message protection
 * - Feature flag override logic
 */
const crypto = require('crypto');
const { getFirestore, admin } = require('../config/firebase');
const { getRestaurantByPhoneNumberId, getRestaurantByWhatsAppNumber } = require('../services/restaurantService');
const { getOrCreateUser, setBookingState, clearBookingState } = require('../services/userService');
const { createBooking } = require('../services/bookingService');
const { sendTextMessage } = require('./sender');
const { detectIntent, generateResponseByIntent } = require('../ai/intent');
const { normalizePhoneNumber, extractDate, extractTime, extractGuestCount, sanitizeInput } = require('../utils/helpers');
const { getCategoryConfig, getBookingLabel, isBookingEnabled, isMenuEnabled, getDefaultReplyTone } = require('../config/categoryConfig');
// ============================================================================
// SECURITY: Webhook Signature Verification
// ============================================================================
/**
 * Verify Meta webhook signature
 * @param {string} signature - X-Hub-Signature-256 header
 * @param {Object} body - Request body
 * @returns {boolean} - True if signature is valid
 */
const verifyWebhookSignature = (signature, body) => {
    try {
        const appSecret = process.env.META_APP_SECRET;
        if (!appSecret) {
            console.warn('META_APP_SECRET not configured - skipping signature verification');
            return true; // Fail open for development
        }
        if (!signature) {
            console.warn('No webhook signature provided');
            return false;
        }
        // Compute signature
        const payload = JSON.stringify(body);
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', appSecret)
            .update(payload)
            .digest('hex');
        // Timing-safe comparison
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
};
// ============================================================================
// PHASE 5: Dynamic Booking Prompt Builder
// ============================================================================
/**
 * Build booking prompt based on category and step
 * @param {string} category - Business category
 * @param {string} step - Current booking step
 * @param {Object} state - Current booking state
 * @returns {string} - Localized prompt text
 */
const buildBookingPrompt = (category, step, state = {}) => {
    const bookingLabel = getBookingLabel(category);
    const tone = getDefaultReplyTone(category);
    // Professional tone responses
    const professionalPrompts = {
        start: `I'd be happy to help you schedule a ${bookingLabel}. Please provide the date (e.g., 2024-12-25)`,
        awaiting_date: `Please provide the date for your ${bookingLabel} (e.g., 2024-12-25 or December 25, 2024)`,
        awaiting_time: `Date confirmed for ${state.date}. What time would you prefer for the ${bookingLabel}? (e.g., 7:00 PM)`,
        awaiting_guests: `Time set for ${state.time}. How many ${bookingLabel === 'table' ? 'guests' : 'people'} will be joining?`,
        confirming: `Perfect! Confirming your ${bookingLabel}:\n📅 ${state.date}\n🕐 ${state.time}\n👥 ${state.guests}\n\nIs this correct?`
    };
    // Friendly tone responses
    const friendlyPrompts = {
        start: `Great! I'd love to help you book a ${bookingLabel}. What date works for you?`,
        awaiting_date: `Sure! Just need the date - you can say things like "next Friday" or "December 25th"`,
        awaiting_time: `Awesome! ${state.date} works perfectly. What time would be good for you?`,
        awaiting_guests: `Nice! And how many people will be joining?`,
        confirming: `🎉 Here's your ${bookingLabel}!\n📅 ${state.date}\n🕐 ${state.time}\n👥 ${state.guests}\n\nLooks good?`
    };
    // Relaxed tone (for spa, wellness)
    const relaxedPrompts = {
        start: `Take your time! What date would be perfect for your ${bookingLabel}?`,
        awaiting_date: `No rush - just let me know what date works best for you`,
        awaiting_time: `${state.date} sounds lovely. What time of day works best?`,
        awaiting_guests: `Perfect! And how many guests will be joining you?`,
        confirming: `✨ Your ${bookingLabel} is almost booked!\n📅 ${state.date}\n🕐 ${state.time}\n👥 ${state.guests}\n\nShall I confirm this for you?`
    };
    // Select prompts based on tone
    let prompts = professionalPrompts;
    if (tone === 'friendly')
        prompts = friendlyPrompts;
    if (tone === 'relaxed')
        prompts = relaxedPrompts;
    if (tone === 'motivational')
        prompts = {
            start: `Let's get you scheduled for a ${bookingLabel}! What's the best date for you?`,
            awaiting_date: `Pick your date - let's make it happen!`,
            awaiting_time: `${state.date} is perfect! What time works for your ${bookingLabel}?`,
            awaiting_guests: `Awesome! How many people will be joining this ${bookingLabel}?`,
            confirming: `🔥 You're almost there!\n📅 ${state.date}\n🕐 ${state.time}\n👥 ${state.guests}\n\nReady to confirm?`
        };
    return prompts[step] || professionalPrompts.start;
};
// ============================================================================
// Rate Limit Protection - In-memory rate limiting
// ============================================================================
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_MESSAGES = 10; // Max 10 messages per minute per number
const checkRateLimit = (phoneNumber) => {
    const now = Date.now();
    const key = `ratelimit:${phoneNumber}`;
    if (!rateLimitMap.has(key)) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    const record = rateLimitMap.get(key);
    // Reset if window expired
    if (now > record.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    // Check limit
    if (record.count >= RATE_LIMIT_MAX_MESSAGES) {
        console.warn(`Rate limit exceeded for ${phoneNumber}`);
        return false;
    }
    record.count++;
    return true;
};
// Cleanup old rate limit entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW_MS);
// Get verify token from environment
const getVerifyToken = () => process.env.VERIFY_TOKEN;
/**
 * Handle WhatsApp webhook verification (GET)
 * Meta uses this to verify the webhook URL
 */
const handleVerification = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = getVerifyToken();
    console.log(`Legacy Webhook Verification Attempt - Mode: ${mode}`);
    if (mode === 'subscribe') {
        if (token === verifyToken) {
            console.log('✅ Legacy Webhook verified successfully');
            return res.status(200).send(challenge);
        }
        else {
            console.warn('❌ Legacy Webhook verification failed: Token mismatch');
            return res.status(403).send('Forbidden');
        }
    }
    console.warn(`Legacy Webhook verification failed: Unknown mode ${mode}`);
    res.status(400).send('Bad Request');
};
/**
 * Handle incoming WhatsApp messages (POST)
 *
 * FIX 2: Returns 200 IMMEDIATELY then processes asynchronously
 * This prevents Meta retries due to slow webhook response
 */
const handleIncomingMessage = async (req, res) => {
    // ============================================================================
    // CRITICAL: Return 200 immediately to acknowledge receipt
    // ============================================================================
    res.sendStatus(200);
    // Process message asynchronously AFTER response sent
    processMessageAsync(req.body).catch(error => {
        console.error('Error processing message asynchronously:', error);
    });
};
/**
 * Process WhatsApp message asynchronously
 * This is called AFTER the 200 response has been sent
 * @param {Object} payload - Raw request body
 */
const processMessageAsync = async (payload) => {
    try {
        // Robust payload parsing
        if (!payload || typeof payload !== 'object') {
            console.log('Ignoring invalid or empty legacy payload');
            return;
        }
        const entry = payload.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messageData = value?.messages?.[0];
        const metadata = value?.metadata;
        // Ignore non-message events
        if (!messageData) {
            if (value?.statuses) {
                console.log('Ignoring legacy status update');
            }
            else {
                console.log('Ignoring legacy non-message event');
            }
            return;
        }
        if (!metadata) {
            console.log('Missing metadata in legacy payload');
            return;
        }
        // Extract message details
        const phoneNumberId = metadata?.phone_number_id;
        const from = messageData?.from;
        const messageText = messageData?.text?.body || '';
        const messageId = messageData?.id;
        const messageType = messageData?.type;
        console.log(`\n=== New Message ===`);
        console.log(`Phone Number ID: ${phoneNumberId}`);
        console.log(`From: ${from}`);
        console.log(`Message: ${messageText}`);
        console.log(`Message ID: ${messageId}`);
        console.log(`Type: ${messageType}`);
        // ============================================================================
        // PHASE 4: Duplicate message protection
        // ============================================================================
        if (isDuplicateMessage(messageId)) {
            console.log(`Skipping duplicate message: ${messageId}`);
            return;
        }
        // ============================================================================
        // FIX 8: Rate Limit Protection - Check before processing
        // ============================================================================
        if (!checkRateLimit(from)) {
            console.warn(`Ignoring message from ${from} - rate limit exceeded`);
            return;
        }
        // ============================================================================
        // FIX 8: Ignore unsupported message types
        // ============================================================================
        const supportedTypes = ['text', 'interactive', 'button'];
        if (!supportedTypes.includes(messageType)) {
            console.log(`Ignoring unsupported message type: ${messageType}`);
            return;
        }
        // Validate required fields
        if (!phoneNumberId || !from) {
            console.error('Missing required fields: phoneNumberId or from');
            return;
        }
        // ============================================================================
        // FIX 8: Ignore empty messages
        // ============================================================================
        if (!messageText || messageText.trim() === '') {
            console.log('Ignoring empty message');
            return;
        }
        // Step 1: Identify the restaurant (multi-tenant)
        let restaurant = await getRestaurantByPhoneNumberId(phoneNumberId);
        if (!restaurant) {
            console.warn(`No restaurant found for phoneNumberId: ${phoneNumberId}, trying fallback by whatsappNumber`);
            // Fallback: Try to find by whatsappNumber if available in metadata
            const whatsappNumber = metadata?.display_phone_number;
            if (whatsappNumber) {
                restaurant = await getRestaurantByWhatsAppNumber(whatsappNumber);
            }
        }
        if (!restaurant) {
            console.error(`No restaurant found for phoneNumberId: ${phoneNumberId} - safely exiting`);
            // Don't crash - just log and exit safely
            return;
        }
        // ============================================================================
        // PHASE 10: Check if business is active/suspended
        // ============================================================================
        if (restaurant.status === 'suspended') {
            console.log(`Restaurant ${restaurant.name} is suspended, ignoring message`);
            return;
        }
        console.log(`Restaurant identified: ${restaurant.name} (${restaurant.id})`);
        // Step 2: Save incoming message to Firestore
        const db = getFirestore();
        const ownerId = restaurant.ownerId;
        // Dynamic path based on tenant
        if (ownerId && restaurant.id) {
            console.log(`Saving message to multi-tenant path for owner: ${ownerId}`);
            await db.collection('users').doc(ownerId)
                .collection('clients').doc(restaurant.id)
                .collection('messages').add({
                from: from,
                text: messageText,
                direction: 'incoming',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                messageId: messageId,
            });
        }
        else {
            // Legacy global collection
            await db.collection('messages').add({
                restaurantId: restaurant.id,
                from: from,
                text: messageText,
                direction: 'incoming',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                messageId: messageId,
            });
        }
        // Step 3: Get or create user
        const user = await getOrCreateUser(from, restaurant.id);
        // Step 4: Process message and determine response
        let responseText = '';
        // Check if user has an active booking flow
        if (user.bookingState) {
            responseText = await handleBookingFlow(user, restaurant, messageText);
        }
        else {
            // Detect intent using AI
            const intentResult = await detectIntent(messageText);
            console.log(`Detected intent: ${intentResult.intent}`);
            // Get category config
            const category = restaurant.category || 'restaurant';
            // ============================================================================
            // PHASE 3: Feature Flag Override - Use effective features, not just category config
            // ============================================================================
            const features = getEffectiveFeatures(restaurant);
            // Check menu request with feature override
            if (intentResult.intent === 'menu_request' && !features.menuEnabled) {
                responseText = `I'm sorry, that service is not currently available. How else can I help you?`;
            }
            // Check booking request with feature override
            else if (intentResult.intent === 'table_booking') {
                if (!features.bookingEnabled) {
                    responseText = `I'm sorry, online booking is not available at the moment. Please contact us directly.`;
                }
                else {
                    responseText = await handleBookingFlow(user, restaurant, messageText);
                }
            }
            else {
                // Generate response based on intent
                responseText = generateResponseByIntent(intentResult.intent, restaurant);
            }
        }
        // Step 5: Send response via WhatsApp with dynamic credentials
        if (responseText) {
            const credentials = {
                whatsappToken: restaurant.whatsappToken,
                whatsappNumberId: restaurant.whatsappNumberId
            };
            await sendTextMessage(from, responseText, credentials);
        }
        // Step 6: Save outgoing message to Firestore
        if (ownerId && restaurant.id) {
            await db.collection('users').doc(ownerId)
                .collection('clients').doc(restaurant.id)
                .collection('messages').add({
                from: from,
                text: responseText,
                direction: 'outgoing',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        else {
            await db.collection('messages').add({
                restaurantId: restaurant.id,
                from: from,
                text: responseText,
                direction: 'outgoing',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        console.log(`=== Message Processed ===\n`);
    }
    catch (error) {
        console.error('Error processing message:', error);
        // Don't crash - log error and exit gracefully
    }
};
/**
 * Handle booking flow state machine
 * PHASE 5: Uses dynamic booking prompts based on category
 * UPDATED: Uses client credentials and ownerId for multi-tenant isolation
 */
const handleBookingFlow = async (user, restaurant, messageText) => {
    const sanitizedText = sanitizeInput(messageText);
    const currentState = user.bookingState || { step: 'start' };
    let newState = { ...currentState };
    let responseText = '';
    // Credentials for sender calls (if any in flow)
    const credentials = {
        whatsappToken: restaurant.whatsappToken,
        whatsappNumberId: restaurant.whatsappNumberId
    };
    console.log(`Current booking state:`, currentState);
    const category = restaurant.category || 'restaurant';
    switch (currentState.step) {
        case 'start':
        case 'awaiting_date':
            // Try to extract date from message
            const date = extractDate(sanitizedText);
            if (date) {
                newState.date = date;
                newState.step = 'awaiting_time';
                // PHASE 5: Dynamic booking prompt
                responseText = buildBookingPrompt(category, 'awaiting_time', newState);
            }
            else {
                // PHASE 5: Dynamic booking prompt
                responseText = buildBookingPrompt(category, 'awaiting_date', newState);
                newState.step = 'awaiting_date';
            }
            break;
        case 'awaiting_time':
            const time = extractTime(sanitizedText);
            if (time) {
                newState.time = time;
                newState.step = 'awaiting_guests';
                // PHASE 5: Dynamic booking prompt
                responseText = buildBookingPrompt(category, 'awaiting_guests', newState);
            }
            else {
                responseText = `Please provide a valid time (e.g., 7:00 PM, 19:00)`;
            }
            break;
        case 'awaiting_guests':
            const guests = extractGuestCount(sanitizedText);
            if (guests) {
                newState.guests = guests;
                newState.step = 'confirming';
                // ============================================================================
                // PHASE 1: Create booking with category included
                // UPDATED: Added ownerId for multi-tenant isolation
                // ============================================================================
                const booking = await createBooking({
                    ownerId: restaurant.ownerId, // NEW: Root user tenant
                    restaurantId: restaurant.id,
                    customerPhone: user.phone,
                    date: newState.date,
                    time: newState.time,
                    guests: newState.guests,
                    category: category, // PHASE 1: Include category
                    status: 'confirmed',
                });
                const bookingLabel = getBookingLabel(category);
                // PHASE 5: Dynamic confirmation message
                responseText = `🎉 Your ${bookingLabel} is booked!\n\n` +
                    `📅 Date: ${newState.date}\n` +
                    `🕐 Time: ${newState.time}\n` +
                    `👥 People: ${newState.guests}\n\n` +
                    `Booking ID: ${booking.slice(0, 8).toUpperCase()}\n\n` +
                    `We look forward to seeing you!`;
                // Clear the booking state
                await clearBookingState(user.id);
            }
            else {
                responseText = `Please provide the number of people (e.g., 2, 4, 6)`;
            }
            break;
        case 'confirming':
            // Should not reach here normally, but handle gracefully
            await clearBookingState(user.id);
            responseText = "Let's start fresh. How can I help you?";
            break;
        default:
            await clearBookingState(user.id);
            responseText = "Something went wrong. Let's start over. How can I help you?";
    }
    // Update user state
    await setBookingState(user.id, newState);
    return responseText;
};
/**
 * Main webhook handler
 */
const handleWebhook = (req, res) => {
    // Handle verification (GET)
    if (req.method === 'GET') {
        return handleVerification(req, res);
    }
    // Handle incoming messages (POST)
    if (req.method === 'POST') {
        return handleIncomingMessage(req, res);
    }
    // Method not allowed
    res.status(405).send('Method Not Allowed');
};
module.exports = {
    handleWebhook,
    handleVerification,
    handleIncomingMessage,
    processMessageAsync,
    handleBookingFlow,
    getEffectiveFeatures,
    buildBookingPrompt,
};
//# sourceMappingURL=webhook.js.map