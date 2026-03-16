/**
 * Production Hardening - Idempotency Module
 * Ensures every inbound message is processed exactly once
 * 
 * Features:
 * - Firestore-based message deduplication
 * - Prevents duplicate processing on retries
 * - Atomic check-and-set operations
 */

const { getFirestore, admin } = require('../config/firebase');

const PROCESSED_MESSAGES_COLLECTION = 'processed_messages';
const MESSAGE_TTL_DAYS = 7; // Keep processed message records for 7 days

/**
 * Check if a message has already been processed
 * @param {string} messageId - Meta message ID
 * @returns {Promise<boolean>} - True if already processed
 */
const isMessageProcessed = async (messageId) => {
    if (!messageId) return false;

    try {
        const db = getFirestore();
        const docRef = db.collection(PROCESSED_MESSAGES_COLLECTION).doc(messageId);
        const doc = await docRef.get();
        return doc.exists;
    } catch (error) {
        console.error('Error checking processed message:', error);
        // Fail open - allow processing if check fails
        return false;
    }
};

/**
 * Mark a message as processed (idempotent)
 * Uses Firestore transaction to ensure atomicity
 * @param {string} messageId - Meta message ID
 * @param {Object} metadata - Additional metadata to store
 * @returns {Promise<boolean>} - True if successfully marked
 */
const markMessageProcessed = async (messageId, metadata = {}) => {
    if (!messageId) return false;

    try {
        const db = getFirestore();
        const docRef = db.collection(PROCESSED_MESSAGES_COLLECTION).doc(messageId);

        // Use set with merge to handle race conditions
        // If document already exists, this is idempotent
        await docRef.set({
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAtLocal: Date.now(),
            messageId: messageId,
            ...metadata,
            // TTL: Auto-delete after 7 days
            expiresAt: new Date(Date.now() + MESSAGE_TTL_DAYS * 24 * 60 * 60 * 1000)
        }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error marking message processed:', error);
        return false;
    }
};

/**
 * Atomic check-and-process operation
 * Checks if processed, if not, marks as processed and returns false
 * This prevents race conditions in concurrent processing
 * 
 * @param {string} messageId - Meta message ID
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{alreadyProcessed: boolean, success: boolean}>}
 */
const checkAndMarkProcessed = async (messageId, metadata = {}) => {
    if (!messageId) {
        return { alreadyProcessed: false, success: false };
    }

    try {
        const db = getFirestore();

        // Use runTransaction for atomic check-and-set
        const result = await db.runTransaction(async (transaction) => {
            const docRef = db.collection(PROCESSED_MESSAGES_COLLECTION).doc(messageId);
            const doc = await transaction.get(docRef);

            if (doc.exists) {
                // Already processed
                return { alreadyProcessed: true, success: true };
            }

            // Not processed yet - mark it
            transaction.set(docRef, {
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                processedAtLocal: Date.now(),
                messageId: messageId,
                ...metadata,
                expiresAt: new Date(Date.now() + MESSAGE_TTL_DAYS * 24 * 60 * 60 * 1000)
            });

            return { alreadyProcessed: false, success: true };
        });

        return result;
    } catch (error) {
        console.error('Error in checkAndMarkProcessed:', error);
        // Fail open - allow processing if transaction fails
        return { alreadyProcessed: false, success: true };
    }
};

/**
 * Clean up old processed message records
 * Should be called periodically (e.g., daily via scheduled function)
 * @returns {Promise<number>} - Number of records cleaned up
 */
const cleanupOldProcessedMessages = async () => {
    try {
        const db = getFirestore();
        const now = new Date();

        // Query for expired records
        const expiredQuery = await db.collection(PROCESSED_MESSAGES_COLLECTION)
            .where('expiresAt', '<', now)
            .limit(500)
            .get();

        if (expiredQuery.empty) {
            return 0;
        }

        // Delete in batch
        const batch = db.batch();
        expiredQuery.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        return expiredQuery.size;
    } catch (error) {
        console.error('Error cleaning up processed messages:', error);
        return 0;
    }
};

/**
 * Get processing statistics
 * @returns {Promise<Object>} - Statistics about processed messages
 */
const getProcessingStats = async () => {
    try {
        const db = getFirestore();
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        // Count messages processed in last 24 hours
        const snapshot = await db.collection(PROCESSED_MESSAGES_COLLECTION)
            .where('processedAtLocal', '>=', oneDayAgo)
            .count()
            .get();

        return {
            processedLast24h: snapshot.data().count,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting processing stats:', error);
        return { processedLast24h: 0, error: error.message };
    }
};

module.exports = {
    isMessageProcessed,
    markMessageProcessed,
    checkAndMarkProcessed,
    cleanupOldProcessedMessages,
    getProcessingStats,
    PROCESSED_MESSAGES_COLLECTION
};
