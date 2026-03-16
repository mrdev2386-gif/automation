/**
 * Production-Ready WhatsApp Webhook Handler
 * Integrates all production hardening features:
 * - Non-blocking webhook (returns 200 immediately)
 * - Idempotent message processing
 * - Queue-based sending
 * - Rate limiting
 * - Multi-tenant isolation
 * 
 * PRODUCTION HARDENED VERSION
 */

const crypto = require('crypto');
const { getFirestore, admin } = require('../config/firebase');

// Production hardening modules
const { checkAndMarkProcessed, isMessageProcessed } = require('../services/idempotencyService');
const { queueTextMessage, processPendingQueue } = require('../whatsapp/queueSender');
const { checkInboundRateLimit, recordInboundMessage, checkOutboundRateLimit, recordOutboundSend } = require('../services/rateLimitService');
const { checkOpenAICapacity, getFallbackMessage: getOpenAIFallback } = require('../services/openaiProtection');

// Legacy imports
const { getRestaurantByPhoneNumberId, getRestaurantByWhatsAppNumber } = require('../services/restaurantService');
const { getOrCreateUser, setBookingState, clearBookingState } = require('../services/userService');
const { createBooking } = require('../services/bookingService');
const { sendTextMessage: legacySendTextMessage } = require('./sender');
const { detectIntent, generateResponseByIntent } = require('../ai/intent');
const {
    normalizePhoneNumber,
    extractDate,
    extractTime,
    extractGuestCount,
    sanitizeInput
} = require('../utils/helpers');
const {
    getCategoryConfig,
    getBookingLabel,
    isBookingEnabled,
    isMenuEnabled,
    getDefaultReplyTone
} = require('../config/categoryConfig');

// Lead capture flow
const { handleLeadCaptureFlow } = require('../leadCapture/leadCaptureFlow');
const { getClientByPhoneNumberId } = require('../services/clientService');

// ============================================================================
// PRODUCTION: Webhook Signature Verification
// ============================================================================

const verifyWebhookSignature = (signature, body) => {
    try {
        const appSecret = process.env.META_APP_SECRET;
        if (!appSecret) {
            console.warn('META_APP_SECRET not configured - skipping signature verification');
            return true;
        }

        if (!signature) {
            console.warn('No webhook signature provided');
            return false;
        }

        const payload = JSON.stringify(body);
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', appSecret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
};

// ============================================================================
// PRODUCTION: Get verify token
// ============================================================================

const getVerifyToken = () => process.env.VERIFY_TOKEN;

// ============================================================================
// PRODUCTION: Webhook Verification (GET)
// ============================================================================

const handleVerification = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = getVerifyToken();

    if (mode === 'subscribe') {
        if (token === verifyToken) {
            console.log('✅ Production Webhook verified successfully');
            return res.status(200).send(challenge);
        } else {
            console.warn('❌ Production Webhook verification failed: Token mismatch');
            return res.status(403).send('Forbidden');
        }
    }

    res.status(400).send('Bad Request');
};

// ============================================================================
// PRODUCTION: Main webhook handler (non-blocking)
// ============================================================================

const handleIncomingMessage = async (req, res) => {
    // CRITICAL: Return 200 immediately to acknowledge receipt
    // This prevents Meta retries due to slow webhook response
    res.sendStatus(200);

    // Extract signature for verification
    const signature = req.headers['x-hub-signature-256'];

    // Verify signature (non-blocking, doesn't affect response)
    if (!verifyWebhookSignature(signature, req.body)) {
        console.warn('Invalid webhook signature - but already acknowledged');
    }

    // Process message asynchronously AFTER response sent
    processMessageAsync(req.body).catch(error => {
        console.error('Error processing message asynchronously:', error);
    });
};

// ============================================================================
// PRODUCTION: Async Message Processor with Idempotency
// ============================================================================

const processMessageAsync = async (payload) => {
    try {
        // Robust payload parsing
        if (!payload || typeof payload !== 'object') {
            console.log('Ignoring invalid or empty payload');
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
                console.log('Ignoring status update');
            } else {
                console.log('Ignoring non-message event');
            }
            return;
        }

        if (!metadata) {
            console.log('Missing metadata in payload');
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

        // ========================================================================
        // PRODUCTION: Idempotency Check - Process exactly once
        // ========================================================================
        const idempotencyResult = await checkAndMarkProcessed(messageId, {
            phoneNumberId,
            from
        });

        if (idempotencyResult.alreadyProcessed) {
            console.log(`Skipping already processed message: ${messageId}`);
            return;
        }

        if (!idempotencyResult.success) {
            console.error('Failed to mark message as processed, but continuing to avoid loss');
        }

        // ========================================================================
        // PRODUCTION: Rate Limit Check (Firestore-backed)
        // ========================================================================
        // First resolve client to get clientUserId
        let client = await getClientByPhoneNumberId(phoneNumberId);
        let restaurant = null;
        let clientUserId = null;

        if (client) {
            clientUserId = client.ownerId;
        } else {
            // Try legacy restaurant
            restaurant = await getRestaurantByPhoneNumberId(phoneNumberId);
            if (!restaurant) {
                const whatsappNumber = metadata?.display_phone_number;
                if (whatsappNumber) {
                    restaurant = await getRestaurantByWhatsAppNumber(whatsappNumber);
                }
            }
            if (restaurant) {
                clientUserId = restaurant.ownerId;
            }
        }

        // Check rate limit
        const rateLimitCheck = await checkInboundRateLimit(from, clientUserId);
        if (!rateLimitCheck.allowed) {
            console.warn(`Rate limit exceeded for ${from}: ${rateLimitCheck.reason}`);
            // Send rate limit message
            await queueTextMessage(
                from,
                "You're sending messages too quickly. Please wait a moment and try again.",
                clientUserId ? { clientUserId } : null
            );
            return;
        }

        // Record the inbound message
        await recordInboundMessage(from, clientUserId);

        // ========================================================================
        // PRODUCTION: Ignore unsupported message types
        // ========================================================================
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

        // Ignore empty messages
        if (!messageText || messageText.trim() === '') {
            console.log('Ignoring empty message');
            return;
        }

        // ========================================================================
        // PRODUCTION: Tenant Resolution
        // ========================================================================
        if (client) {
            console.log(`✅ Tenant Resolved: ${client.id} (Smart Lead Capture)`);

            // Check if client is suspended
            if (client.status === 'suspended') {
                console.warn(`Tenant ${client.id} is suspended, dropping message`);
                return;
            }

            // Save incoming message
            const db = getFirestore();
            await db.collection('users').doc(client.ownerId)
                .collection('clients').doc(client.id)
                .collection('messages').add({
                    from: from,
                    text: messageText,
                    direction: 'incoming',
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    messageId: messageId,
                    type: messageType
                });

            // Handle with Smart Lead Capture
            const responseText = await handleLeadCaptureFlow(from, client.id, messageText);

            // Queue response for delivery
            if (responseText) {
                const credentials = {
                    whatsappToken: client.whatsappToken,
                    whatsappNumberId: client.whatsappNumberId,
                    clientUserId: client.ownerId,
                    clientId: client.id
                };

                await queueTextMessage(from, responseText, credentials, `response_${messageId}`);

                // Save outgoing message
                await db.collection('users').doc(client.ownerId)
                    .collection('clients').doc(client.id)
                    .collection('messages').add({
                        from: from,
                        text: responseText,
                        direction: 'outgoing',
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    });
            }

            console.log(`🏁 Message Processed (Smart Lead Capture) - ID: ${messageId}`);
            return;
        }

        // ========================================================================
        // PRODUCTION: Legacy Restaurant System (Backward Compatibility)
        // ========================================================================
        if (restaurant) {
            console.log(`⚠️  Legacy restaurant: ${restaurant.name} (${restaurant.id})`);

            // Check if suspended
            if (restaurant.status === 'suspended') {
                console.log(`Restaurant ${restaurant.name} is suspended, ignoring message`);
                return;
            }

            const db = getFirestore();
            const ownerId = restaurant.ownerId;

            // Save incoming message
            if (ownerId && restaurant.id) {
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

            // Get or create user
            const user = await getOrCreateUser(from, restaurant.id);

            // Process message
            let responseText = '';

            if (user.bookingState) {
                // Handle booking flow
                const { handleBookingFlow: legacyHandler } = require('./webhook');
                responseText = await legacyHandler(user, restaurant, messageText);
            } else {
                // Detect intent
                const intentResult = await detectIntent(messageText);
                console.log(`Detected intent: ${intentResult.intent}`);

                const category = restaurant.category || 'restaurant';
                const features = {
                    menuEnabled: restaurant.menuEnabled !== false,
                    bookingEnabled: restaurant.bookingEnabled !== false
                };

                if (intentResult.intent === 'menu_request' && !features.menuEnabled) {
                    responseText = `I'm sorry, that service is not currently available. How else can I help you?`;
                } else if (intentResult.intent === 'table_booking') {
                    if (!features.bookingEnabled) {
                        responseText = `I'm sorry, online booking is not available at the moment. Please contact us directly.`;
                    } else {
                        const { handleBookingFlow: legacyHandler } = require('./webhook');
                        responseText = await legacyHandler(user, restaurant, messageText);
                    }
                } else {
                    responseText = generateResponseByIntent(intentResult.intent, restaurant);
                }
            }

            // Queue response for delivery
            if (responseText) {
                const credentials = {
                    whatsappToken: restaurant.whatsappToken,
                    whatsappNumberId: restaurant.whatsappNumberId,
                    clientUserId: ownerId,
                    clientId: restaurant.id
                };

                await queueTextMessage(from, responseText, credentials, `response_${messageId}`);

                // Save outgoing message
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
            }

            console.log(`=== Message Processed (Legacy Restaurant) ===\n`);
            return;
        }

        // ========================================================================
        // PRODUCTION: No matching tenant
        // ========================================================================
        console.error(`No client or restaurant found for phoneNumberId: ${phoneNumberId}`);
        return;

    } catch (error) {
        console.error('Error processing message:', error);
        // Don't crash - log error and exit gracefully
    }
};

// ============================================================================
// PRODUCTION: Main webhook handler
// ============================================================================

const handleWebhookProduction = (req, res) => {
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
    handleWebhookProduction,
    handleVerification,
    handleIncomingMessage,
    processMessageAsync
};
