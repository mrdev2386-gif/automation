/**
 * Unified WhatsApp Webhook Handler
 * Supports both legacy restaurant booking and new Smart Lead Capture
 * 
 * PRODUCTION-READY: Multi-tenant, multi-industry WhatsApp automation
 */

const { getFirestore, admin } = require('../config/firebase');
const { sendTextMessage } = require('./sender');
const { sanitizeInput } = require('../utils/helpers');

// Legacy restaurant system
const { getRestaurantByPhoneNumberId } = require('../services/restaurantService');
const { handleBookingFlow } = require('./webhook');

// New Smart Lead Capture system
const { handleLeadCaptureFlow } = require('../leadCapture/leadCaptureFlow');
const { getClientByPhoneNumberId } = require('../services/clientService');

// ============================================================================
// Duplicate Message Protection
// ============================================================================
const processedMessages = new Map();
const DUPLICATE_CACHE_TTL_MS = 300000; // 5 minutes

const isDuplicateMessage = (messageId) => {
    if (!messageId) return false;
    if (processedMessages.has(messageId)) {
        console.log(`Duplicate message detected: ${messageId}`);
        return true;
    }
    processedMessages.set(messageId, Date.now());
    return false;
};

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of processedMessages.entries()) {
        if (now - value > DUPLICATE_CACHE_TTL_MS) {
            processedMessages.delete(key);
        }
    }
}, DUPLICATE_CACHE_TTL_MS);

// ============================================================================
// Rate Limit Protection
// ============================================================================
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_MESSAGES = 10; // Max 10 messages per minute

const checkRateLimit = (phoneNumber) => {
    const now = Date.now();
    const key = `ratelimit:${phoneNumber}`;

    if (!rateLimitMap.has(key)) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    const record = rateLimitMap.get(key);

    if (now > record.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX_MESSAGES) {
        console.warn(`Rate limit exceeded for ${phoneNumber}`);
        return false;
    }

    record.count++;
    return true;
};

// Cleanup old rate limit entries
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW_MS);

// ============================================================================
// Webhook Verification (GET)
// ============================================================================
const handleVerification = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = 'wa_automation_verify_2026';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WhatsApp webhook verified');
        return res.status(200).send(challenge);
    } else {
        console.error('Webhook verification failed');
        return res.sendStatus(403);
    }
};

// ============================================================================
// Incoming Message Handler (POST)
// ============================================================================
const handleIncomingMessage = async (req, res) => {
    console.log('Incoming webhook:', JSON.stringify(req.body));
    // Return 200 immediately to acknowledge receipt
    res.sendStatus(200);

    // Process message asynchronously
    processMessageAsync(req.body).catch(error => {
        console.error('Error processing message asynchronously:', error);
    });
};

// ============================================================================
// Async Message Processor
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

        // Ignore non-message events (like status updates or other WhatsApp notifications)
        if (!messageData) {
            if (value?.statuses) {
                console.log('Ignoring message status update (delivered/read)');
            } else {
                console.log('Ignoring non-message event');
            }
            return;
        }

        if (!metadata) {
            console.log('Missing metadata in WhatsApp payload');
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

        // Duplicate message protection
        if (isDuplicateMessage(messageId)) {
            console.log(`Skipping duplicate message: ${messageId}`);
            return;
        }

        // Rate limit protection
        if (!checkRateLimit(from)) {
            console.warn(`Ignoring message from ${from} - rate limit exceeded`);
            return;
        }

        // Ignore unsupported message types
        const supportedTypes = ['text', 'interactive', 'button'];
        if (!supportedTypes.includes(messageType)) {
            console.log(`Ignoring unsupported message type: ${messageType}`);
            return;
        }

        // Validate required fields
        if (!phoneNumberId || !from || !messageText || messageText.trim() === '') {
            console.log('Missing required fields or empty message');
            return;
        }

        // ============================================================================
        // ROUTING: Determine if this is a new client (Smart Lead Capture) or legacy restaurant
        // ============================================================================

        // Try to find client first (new system)
        let client = await getClientByPhoneNumberId(phoneNumberId);

        if (client) {
            console.log(`✅ Tenant Resolved: ${client.id} (${client.industryType})`);

            // Check if client is active
            if (client.status === 'suspended') {
                console.warn(`Tenant ${client.id} is suspended, dropping message`);
                return;
            }

            // Save incoming message (Always use serverTimestamp)
            const db = getFirestore();
            const messagePayload = {
                from: from,
                text: messageText,
                direction: 'incoming',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                messageId: messageId,
                type: messageType
            };

            // True Multi-Tenant Path implementation
            console.log(`Storing incoming message for tenant: ${client.id}`);
            await db.collection('users').doc(client.ownerId)
                .collection('clients').doc(client.id)
                .collection('messages').add(messagePayload);

            // Handle with Smart Lead Capture
            const responseText = await handleLeadCaptureFlow(from, client.id, messageText);

            // Send response
            if (responseText) {
                console.log(`Sending response to ${from} via tenant ${client.id}`);
                await sendTextMessage(from, responseText);

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

        // ============================================================================
        // FALLBACK: Try legacy restaurant system
        // ============================================================================
        let restaurant = await getRestaurantByPhoneNumberId(phoneNumberId);

        if (restaurant) {
            console.log(`⚠️  Legacy restaurant identified: ${restaurant.name} (${restaurant.id})`);
            console.log(`   Consider migrating to new client system`);

            // Use legacy booking flow (existing webhook.js logic)
            // This maintains backward compatibility
            const { processMessageAsync: legacyProcessor } = require('./webhook');
            await legacyProcessor(payload);

            console.log(`=== Message Processed (Legacy Restaurant) ===\n`);
            return;
        }

        // ============================================================================
        // NO MATCH: Unknown phone number ID
        // ============================================================================
        console.error(`❌ No client or restaurant found for phoneNumberId: ${phoneNumberId}`);
        console.log(`   This WhatsApp number is not registered in the system`);

        // Don't crash - just log and exit safely
        return;

    } catch (error) {
        console.error('Error processing message:', error);
        // Don't crash - log error and exit gracefully
    }
};

// ============================================================================
// Main Webhook Handler
// ============================================================================
const handleWebhookUnified = (req, res) => {
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
    handleWebhookUnified,
    handleVerification,
    handleIncomingMessage,
    processMessageAsync
};
