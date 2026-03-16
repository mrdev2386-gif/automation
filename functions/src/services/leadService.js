/**
 * Lead Service Module
 * Handles lead capture, management, and automation triggering
 * 
 * Features:
 * - Lead ingestion from webhooks and manual uploads
 * - Per-client isolation
 * - Automation triggering
 * - Follow-up scheduling
 * - Event logging
 */

const admin = require('firebase-admin');
const { sendTextMessage, sendTemplateMessage } = require('../whatsapp/sender');

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_BULK_UPLOAD = 500;
const LEAD_SOURCES = ['website', 'manual', 'whatsapp', 'ads'];
const LEAD_STATUSES = ['new', 'contacted', 'qualified'];

const FOLLOW_UP_SCHEDULE = [
    { day: 0, type: 'welcome', messageKey: 'welcome' },
    { day: 1, type: 'followup_1', messageKey: 'followup_day1' },
    { day: 3, type: 'followup_3', messageKey: 'followup_day3' },
    { day: 7, type: 'followup_7', messageKey: 'followup_day7' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate phone number format
 */
const isValidPhone = (phone) => {
    if (!phone) return false;
    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    // Check for valid length (7-15 digits)
    return /^\d{7,15}$/.test(cleaned);
};

/**
 * Normalize phone number to E.164 format
 */
const normalizePhone = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    // Add country code if missing (assuming India +91)
    if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    return cleaned;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate lead source
 */
const isValidSource = (source) => {
    return LEAD_SOURCES.includes(source);
};

/**
 * Sanitize input string
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, 500); // Limit length
};

/**
 * Check if user is active
 */
const isUserActive = async (userId) => {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    return userDoc.data().isActive === true;
};

/**
 * Get user document
 */
const getUserDocument = async (userId) => {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return null;
    return userDoc.data();
};

/**
 * Get user's WhatsApp credentials
 */
const getUserCredentials = async (userId) => {
    const userData = await getUserDocument(userId);
    if (!userData) return null;

    return {
        whatsappToken: userData.whatsappToken || process.env.WHATSAPP_TOKEN,
        whatsappNumberId: userData.whatsappNumberId || process.env.PHONE_NUMBER_ID
    };
};

// ============================================================================
// LEAD EVENT LOGGING
// ============================================================================

/**
 * Log lead event
 */
const logLeadEvent = async (leadId, clientUserId, type, metadata = {}) => {
    const db = admin.firestore();
    await db.collection('lead_events').add({
        leadId,
        clientUserId,
        type,
        metadata,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
};

// ============================================================================
// LEAD CREATION
// ============================================================================

/**
 * Create a new lead
 */
const createLead = async (leadData) => {
    const db = admin.firestore();

    const leadRef = db.collection('leads').doc();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const lead = {
        id: leadRef.id,
        clientUserId: leadData.clientUserId,
        name: sanitizeString(leadData.name),
        email: leadData.email ? leadData.email.toLowerCase().trim() : null,
        phone: normalizePhone(leadData.phone),
        source: isValidSource(leadData.source) ? leadData.source : 'website',
        status: 'new',
        score: 0,
        automationId: leadData.automationId || null,
        createdAt: now,
        updatedAt: now,
        // Additional metadata
        metadata: leadData.metadata || {}
    };

    await leadRef.set(lead);

    // Log lead creation event
    await logLeadEvent(leadRef.id, leadData.clientUserId, 'lead_created', {
        source: lead.source,
        hasEmail: !!lead.email,
        hasPhone: !!lead.phone
    });

    return lead;
};

/**
 * Check for duplicate lead (by email or phone for same client)
 */
const checkDuplicate = async (clientUserId, email, phone) => {
    const db = admin.firestore();

    let query = db.collection('leads').where('clientUserId', '==', clientUserId);

    if (email) {
        const emailQuery = await query.where('email', '==', email.toLowerCase().trim()).get();
        if (!emailQuery.empty) {
            return { isDuplicate: true, existingLead: emailQuery.docs[0].data() };
        }
    }

    if (phone) {
        const normalizedPhone = normalizePhone(phone);
        const phoneQuery = await query.where('phone', '==', normalizedPhone).get();
        if (!phoneQuery.empty) {
            return { isDuplicate: true, existingLead: phoneQuery.docs[0].data() };
        }
    }

    return { isDuplicate: false };
};

// ============================================================================
// AUTOMATION TRIGGERING
// ============================================================================

/**
 * Get user's assigned automation
 */
const getUserAutomation = async (userId) => {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) return null;

    const userData = userDoc.data();
    const automationIds = userData.assignedAutomations || [];

    if (automationIds.length === 0) return null;

    // Get the first (primary) automation
    const automationDoc = await db.collection('automations').doc(automationIds[0]).get();

    if (!automationDoc.exists) return null;

    return {
        id: automationDoc.id,
        ...automationDoc.data()
    };
};

/**
 * Trigger lead automation (WhatsApp messages)
 */
const triggerLeadAutomation = async (lead, userId) => {
    const db = admin.firestore();

    // Get automation
    const automation = await getUserAutomation(userId);

    if (!automation || !automation.isActive) {
        console.log(`No active automation for user ${userId}`);
        return { triggered: false, reason: 'no_automation' };
    }

    if (!lead.phone) {
        console.log(`Lead ${lead.id} has no phone number`);
        await logLeadEvent(lead.id, userId, 'automation_skipped', { reason: 'no_phone' });
        return { triggered: false, reason: 'no_phone' };
    }

    // Get user credentials
    const credentials = await getUserCredentials(userId);

    if (!credentials.whatsappToken || !credentials.whatsappNumberId) {
        console.log(`User ${userId} has no WhatsApp credentials`);
        await logLeadEvent(lead.id, userId, 'automation_skipped', { reason: 'no_whatsapp_config' });
        return { triggered: false, reason: 'no_whatsapp_config' };
    }

    try {
        // Send welcome message
        const welcomeMessage = automation.welcomeMessage ||
            `Hi ${lead.name}! Thank you for your interest. We'll be in touch shortly!`;

        const sentMessage = await sendTextMessage(
            lead.phone,
            welcomeMessage,
            credentials
        );

        if (sentMessage) {
            await logLeadEvent(lead.id, userId, 'whatsapp_sent', {
                messageType: 'welcome',
                to: lead.phone,
                messageId: sentMessage.messages?.[0]?.id
            });

            // Schedule follow-ups
            await scheduleFollowUps(lead, automation, userId, credentials);

            // Update lead status
            await db.collection('leads').doc(lead.id).update({
                status: 'contacted',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { triggered: true, messageId: sentMessage.messages?.[0]?.id };
        } else {
            await logLeadEvent(lead.id, userId, 'whatsapp_failed', {
                messageType: 'welcome',
                reason: 'send_failed'
            });
            return { triggered: false, reason: 'send_failed' };
        }
    } catch (error) {
        console.error('Error triggering automation:', error);
        await logLeadEvent(lead.id, userId, 'automation_error', {
            error: error.message
        });
        return { triggered: false, reason: 'error' };
    }
};

/**
 * Schedule follow-up messages
 */
const scheduleFollowUps = async (lead, automation, userId, credentials) => {
    const db = admin.firestore();

    for (const followUp of FOLLOW_UP_SCHEDULE) {
        if (followUp.day === 0) continue; // Already sent welcome

        const scheduledTime = new Date();
        scheduledTime.setDate(scheduledTime.getDate() + followUp.day);

        const scheduleRef = db.collection('scheduled_messages').doc();
        await scheduleRef.set({
            leadId: lead.id,
            clientUserId: userId,
            phone: lead.phone,
            type: followUp.type,
            messageKey: followUp.messageKey,
            scheduledFor: scheduledTime,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            // Store credentials for later use
            credentials: {
                whatsappToken: credentials.whatsappToken,
                whatsappNumberId: credentials.whatsappNumberId
            },
            // Custom message or default
            message: automation[`${followUp.messageKey}Message`] || getDefaultMessage(followUp.type, lead.name)
        });
    }
};

/**
 * Get default follow-up message
 */
const getDefaultMessage = (type, name) => {
    const messages = {
        'followup_1': `Hi ${name}! Just following up on your inquiry. Let us know if you have any questions!`,
        'followup_3': `Hi ${name}! We wanted to check if you needed any more information. We're here to help!`,
        'followup_7': `Hi ${name}! Last check-in. Would love to hear from you!`
    };
    return messages[type] || `Hi ${name}! Just checking in!`;
};

// ============================================================================
// RATE LIMITING
// ============================================================================

const LEAD_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_LEAD_RATE_LIMIT = 10; // Max leads per minute per client

/**
 * Check rate limiting for lead capture
 */
const checkLeadRateLimit = async (clientUserId, ip = null) => {
    const db = admin.firestore();
    const now = Date.now();

    // Check by user
    const userRateRef = db.collection('lead_rate_limits').doc(clientUserId);

    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRateRef);

            if (!doc.exists) {
                transaction.set(userRateRef, {
                    count: 1,
                    firstAttempt: now,
                    expiresAt: new Date(now + LEAD_RATE_LIMIT_WINDOW)
                });
                return { allowed: true };
            }

            const data = doc.data();

            // Reset if window has passed
            if (now - data.firstAttempt > LEAD_RATE_LIMIT_WINDOW) {
                transaction.update(userRateRef, {
                    count: 1,
                    firstAttempt: now,
                    expiresAt: new Date(now + LEAD_RATE_LIMIT_WINDOW)
                });
                return { allowed: true };
            }

            // Check limit
            if (data.count >= MAX_LEAD_RATE_LIMIT) {
                return { allowed: false, reason: 'rate_limit_exceeded' };
            }

            transaction.update(userRateRef, { count: data.count + 1 });
            return { allowed: true };
        });
    } catch (error) {
        console.error('Rate limit check error:', error);
        return { allowed: true }; // Fail open
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Lead management
    createLead,
    checkDuplicate,
    triggerLeadAutomation,

    // Utilities
    isValidPhone,
    isValidEmail,
    isValidSource,
    normalizePhone,
    sanitizeString,

    // Rate limiting
    checkLeadRateLimit,

    // Event logging
    logLeadEvent,

    // Constants
    MAX_BULK_UPLOAD,
    LEAD_SOURCES,
    LEAD_STATUSES
};
