/**
 * Production Hardening - Welcome Message Spam Guard
 * Prevents welcome message spam with proper time-based controls
 * 
 * Features:
 * - 24-hour cooldown between welcome messages per phone
 * - Tracks last welcome sent time
 * - Per-client configuration
 * - Safe fallback behavior
 */

const { getFirestore, admin } = require('../config/firebase');

const WELCOME_GUARD_COLLECTION = 'welcome_guard';
const DEFAULT_COOLDOWN_HOURS = 24; // 24 hours between welcome messages

/**
 * Check if welcome message can be sent to a phone number
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<{allowed: boolean, reason?: string, nextAllowedAt?: Date}>}
 */
const canSendWelcome = async (clientUserId, phoneNumber) => {
    try {
        const db = getFirestore();
        const key = `${clientUserId}:${phoneNumber}`;
        const docRef = db.collection(WELCOME_GUARD_COLLECTION).doc(key);

        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            const lastSent = data.lastWelcomeSentAt?.toDate?.();

            if (lastSent) {
                const now = Date.now();
                const lastSentTime = lastSent.getTime();
                const cooldownMs = (data.cooldownHours || DEFAULT_COOLDOWN_HOURS) * 60 * 60 * 1000;
                const nextAllowedTime = lastSentTime + cooldownMs;

                if (now < nextAllowedTime) {
                    // Still in cooldown
                    return {
                        allowed: false,
                        reason: 'cooldown',
                        nextAllowedAt: new Date(nextAllowedTime),
                        hoursRemaining: Math.ceil((nextAllowedTime - now) / (60 * 60 * 1000))
                    };
                }
            }
        }

        return { allowed: true };
    } catch (error) {
        console.error('Error checking welcome guard:', error);
        // Fail open - allow if check fails
        return { allowed: true };
    }
};

/**
 * Record that a welcome message was sent
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User's phone number
 * @param {number} cooldownHours - Optional custom cooldown
 */
const recordWelcomeSent = async (clientUserId, phoneNumber, cooldownHours = DEFAULT_COOLDOWN_HOURS) => {
    try {
        const db = getFirestore();
        const key = `${clientUserId}:${phoneNumber}`;

        await db.collection(WELCOME_GUARD_COLLECTION).doc(key).set({
            lastWelcomeSentAt: admin.firestore.FieldValue.serverTimestamp(),
            cooldownHours: cooldownHours,
            sentCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`Welcome guard: Recorded welcome sent to ${phoneNumber} for client ${clientUserId}`);
    } catch (error) {
        console.error('Error recording welcome sent:', error);
    }
};

/**
 * Check if this is a new conversation (no recent messages)
 * Used to determine if welcome should be sent
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User's phone number
 * @param {number} lookbackHours - Hours to look back for messages
 * @returns {Promise<boolean>} - True if new conversation
 */
const isNewConversation = async (clientUserId, phoneNumber, lookbackHours = 24) => {
    try {
        const db = getFirestore();
        const cutoff = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

        // Check for any messages in the time window
        const snapshot = await db.collection('chat_logs')
            .where('clientUserId', '==', clientUserId)
            .where('phone', '==', phoneNumber)
            .where('timestamp', '>=', cutoff)
            .limit(1)
            .get();

        return snapshot.empty;
    } catch (error) {
        console.error('Error checking new conversation:', error);
        // Fail safe - assume it's not new if we can't check
        return false;
    }
};

/**
 * Check if welcome should be sent and record it atomically
 * This is the main entry point for welcome message logic
 * 
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<{shouldSend: boolean, reason?: string}>}
 */
const shouldSendWelcome = async (clientUserId, phoneNumber) => {
    try {
        const db = getFirestore();

        // Check 1: Is this a new conversation?
        const newConversation = await isNewConversation(clientUserId, phoneNumber);
        if (!newConversation) {
            console.log(`Welcome guard: Not sending - not a new conversation`);
            return { shouldSend: false, reason: 'existing_conversation' };
        }

        // Check 2: Are we in cooldown period?
        const canSend = await canSendWelcome(clientUserId, phoneNumber);
        if (!canSend.allowed) {
            console.log(`Welcome guard: Not sending - in cooldown until ${canSend.nextAllowedAt}`);
            return {
                shouldSend: false,
                reason: canSend.reason,
                nextAllowedAt: canSend.nextAllowedAt
            };
        }

        // Check 3: Get client config to see if welcome is enabled
        const configDoc = await db.collection('client_configs').doc(clientUserId).get();
        if (configDoc.exists) {
            const config = configDoc.data();

            // Check if welcome is disabled
            if (config.welcomeEnabled === false) {
                return { shouldSend: false, reason: 'welcome_disabled' };
            }

            // Check custom cooldown if set
            if (config.welcomeCooldownHours) {
                const canSendCustom = await canSendWelcome(clientUserId, phoneNumber);
                if (!canSendCustom.allowed) {
                    return {
                        shouldSend: false,
                        reason: canSendCustom.reason,
                        nextAllowedAt: canSendCustom.nextAllowedAt
                    };
                }
            }
        }

        // All checks passed - welcome can be sent
        return { shouldSend: true };
    } catch (error) {
        console.error('Error in shouldSendWelcome:', error);
        // Fail safe - don't send if check fails
        return { shouldSend: false, reason: 'check_failed' };
    }
};

/**
 * Send welcome message with spam guard
 * Combines all checks and sends the message
 * 
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User's phone number
 * @param {Object} config - Client welcome config
 * @param {Object} sender - Message sender function
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
const sendWelcomeWithGuard = async (clientUserId, phoneNumber, config, sender) => {
    // First check if we should send
    const check = await shouldSendWelcome(clientUserId, phoneNumber);

    if (!check.shouldSend) {
        return { sent: false, reason: check.reason };
    }

    try {
        // Get welcome message from config
        const welcomeMessage = config?.welcomeMessage || 'Hello! Welcome! How can I help you today?';

        // Send the welcome message
        await sender(phoneNumber, welcomeMessage);

        // Record that we sent it
        await recordWelcomeSent(
            clientUserId,
            phoneNumber,
            config?.welcomeCooldownHours || DEFAULT_COOLDOWN_HOURS
        );

        console.log(`Welcome guard: Successfully sent welcome to ${phoneNumber}`);
        return { sent: true };
    } catch (error) {
        console.error('Error sending welcome with guard:', error);
        return { sent: false, reason: 'send_failed' };
    }
};

/**
 * Get welcome statistics for a client
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<Object>} - Welcome statistics
 */
const getWelcomeStats = async (clientUserId) => {
    try {
        const db = getFirestore();

        // Get all guard records for this client
        const prefix = `${clientUserId}:`;
        const snapshot = await db.collection(WELCOME_GUARD_COLLECTION)
            .startAt(prefix)
            .endAt(prefix + '\uf8ff')
            .get();

        let totalSent = 0;
        let uniquePhones = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            totalSent += data.sentCount || 0;
            uniquePhones++;
        });

        return {
            totalWelcomeSent: totalSent,
            uniqueRecipients: uniquePhones,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting welcome stats:', error);
        return { error: error.message };
    }
};

/**
 * Reset welcome guard for a phone (admin function)
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - Phone to reset
 * @returns {Promise<boolean>} - Success
 */
const resetWelcomeGuard = async (clientUserId, phoneNumber) => {
    try {
        const db = getFirestore();
        const key = `${clientUserId}:${phoneNumber}`;

        await db.collection(WELCOME_GUARD_COLLECTION).doc(key).delete();

        console.log(`Welcome guard: Reset for ${phoneNumber}`);
        return true;
    } catch (error) {
        console.error('Error resetting welcome guard:', error);
        return false;
    }
};

module.exports = {
    canSendWelcome,
    recordWelcomeSent,
    isNewConversation,
    shouldSendWelcome,
    sendWelcomeWithGuard,
    getWelcomeStats,
    resetWelcomeGuard,
    DEFAULT_COOLDOWN_HOURS
};
