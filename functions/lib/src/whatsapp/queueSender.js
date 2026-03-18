"use strict";
/**
 * Production Hardening - WhatsApp Send Queue Module
 * Queues outbound messages for reliable delivery
 *
 * Features:
 * - Queue-based sending with retry logic
 * - Exponential backoff
 * - Dead-letter handling
 * - Rate limit compliance
 * - Idempotent sends
 */
const { getFirestore, admin } = require('../config/firebase');
const { sendTextMessage: directSendTextMessage, sendTemplateMessage: directSendTemplateMessage } = require('./sender');
const OUTBOUND_QUEUE_COLLECTION = 'outbound_queue';
const MAX_RETRIES = 5;
const RETRY_DELAYS = [
    5000, // 5 seconds
    15000, // 15 seconds
    60000, // 1 minute
    300000, // 5 minutes
    900000 // 15 minutes
];
/**
 * Queue a text message for sending
 * @param {string} to - Recipient phone number
 * @param {string} text - Message text
 * @param {Object} credentials - WhatsApp credentials
 * @param {string} idempotencyKey - Unique key to prevent duplicate sends
 * @returns {Promise<string|null>} - Queue ID or null if failed
 */
const queueTextMessage = async (to, text, credentials, idempotencyKey = null) => {
    if (!to || !text) {
        console.error('queueTextMessage: Missing required parameters');
        return null;
    }
    try {
        const db = getFirestore();
        // Check for existing queued message with same idempotency key
        if (idempotencyKey) {
            const existing = await db.collection(OUTBOUND_QUEUE_COLLECTION)
                .where('idempotencyKey', '==', idempotencyKey)
                .where('status', 'in', ['pending', 'sent'])
                .limit(1)
                .get();
            if (!existing.empty) {
                console.log(`Message with idempotency key ${idempotencyKey} already queued`);
                return existing.docs[0].id;
            }
        }
        // Create queue entry
        const docRef = await db.collection(OUTBOUND_QUEUE_COLLECTION).add({
            type: 'text',
            to: to,
            payload: {
                text: text
            },
            credentials: {
                whatsappToken: credentials?.whatsappToken || null,
                whatsappNumberId: credentials?.whatsappNumberId || null
            },
            idempotencyKey: idempotencyKey || `${to}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            retryCount: 0,
            nextRetryAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            sentAt: null,
            failedAt: null,
            errorMessage: null,
            meta: {
                clientUserId: credentials?.clientUserId || null,
                clientId: credentials?.clientId || null
            }
        });
        console.log(`Queued text message for ${to}, queue ID: ${docRef.id}`);
        return docRef.id;
    }
    catch (error) {
        console.error('Error queueing text message:', error);
        return null;
    }
};
/**
 * Queue a template message for sending
 * @param {string} to - Recipient phone number
 * @param {string} templateName - Template name
 * @param {string} languageCode - Language code
 * @param {Array} components - Template components
 * @param {Object} credentials - WhatsApp credentials
 * @param {string} idempotencyKey - Unique key
 * @returns {Promise<string|null>} - Queue ID
 */
const queueTemplateMessage = async (to, templateName, languageCode, components, credentials, idempotencyKey = null) => {
    if (!to || !templateName) {
        console.error('queueTemplateMessage: Missing required parameters');
        return null;
    }
    try {
        const db = getFirestore();
        const docRef = await db.collection(OUTBOUND_QUEUE_COLLECTION).add({
            type: 'template',
            to: to,
            payload: {
                templateName: templateName,
                languageCode: languageCode || 'en_US',
                components: components || []
            },
            credentials: {
                whatsappToken: credentials?.whatsappToken || null,
                whatsappNumberId: credentials?.whatsappNumberId || null
            },
            idempotencyKey: idempotencyKey || `${to}_${templateName}_${Date.now()}`,
            status: 'pending',
            retryCount: 0,
            nextRetryAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            sentAt: null,
            failedAt: null,
            errorMessage: null,
            meta: {
                clientUserId: credentials?.clientUserId || null,
                clientId: credentials?.clientId || null
            }
        });
        console.log(`Queued template message ${templateName} for ${to}`);
        return docRef.id;
    }
    catch (error) {
        console.error('Error queueing template message:', error);
        return null;
    }
};
/**
 * Process a single queue item
 * @param {string} queueId - Queue item ID
 * @returns {Promise<boolean>} - Success status
 */
const processQueueItem = async (queueId) => {
    try {
        const db = getFirestore();
        const docRef = db.collection(OUTBOUND_QUEUE_COLLECTION).doc(queueId);
        const doc = await docRef.get();
        if (!doc.exists) {
            console.error(`Queue item ${queueId} not found`);
            return false;
        }
        const data = doc.data();
        // Skip if already processed or dead-lettered
        if (data.status === 'sent' || data.status === 'dead_letter') {
            return true;
        }
        // Check if it's time to retry
        if (data.nextRetryAt && data.nextRetryAt.toDate && data.nextRetryAt.toDate() > new Date()) {
            console.log(`Queue item ${queueId} not yet ready for retry`);
            return false;
        }
        // Build credentials object
        const credentials = {
            whatsappToken: data.credentials?.whatsappToken,
            whatsappNumberId: data.credentials?.whatsappNumberId
        };
        let result = null;
        // Send based on message type
        if (data.type === 'text') {
            result = await directSendTextMessage(data.to, data.payload.text, credentials);
        }
        else if (data.type === 'template') {
            result = await directSendTemplateMessage(data.to, data.payload.templateName, data.payload.languageCode, data.payload.components, credentials);
        }
        if (result) {
            // Success - mark as sent
            await docRef.update({
                status: 'sent',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                whatsappMessageId: result.messages?.[0]?.id || null
            });
            console.log(`Queue item ${queueId} sent successfully`);
            return true;
        }
        else {
            // Failure - increment retry count
            const newRetryCount = (data.retryCount || 0) + 1;
            if (newRetryCount >= MAX_RETRIES) {
                // Dead-letter the message
                await docRef.update({
                    status: 'dead_letter',
                    failedAt: admin.firestore.FieldValue.serverTimestamp(),
                    retryCount: newRetryCount,
                    errorMessage: 'Max retries exceeded'
                });
                console.error(`Queue item ${queueId} dead-lettered after ${MAX_RETRIES} retries`);
            }
            else {
                // Schedule next retry with exponential backoff
                const delayMs = RETRY_DELAYS[Math.min(newRetryCount - 1, RETRY_DELAYS.length - 1)];
                const nextRetry = new Date(Date.now() + delayMs);
                await docRef.update({
                    status: 'pending',
                    retryCount: newRetryCount,
                    nextRetryAt: nextRetry,
                    lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
                    errorMessage: 'Send failed, will retry'
                });
                console.log(`Queue item ${queueId} scheduled for retry ${newRetryCount}/${MAX_RETRIES}`);
            }
            return false;
        }
    }
    catch (error) {
        console.error(`Error processing queue item ${queueId}:`, error);
        // Mark as failed
        try {
            const db = getFirestore();
            await db.collection(OUTBOUND_QUEUE_COLLECTION).doc(queueId).update({
                status: 'failed',
                errorMessage: error.message,
                failedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        catch (updateError) {
            console.error('Error updating failed status:', updateError);
        }
        return false;
    }
};
/**
 * Process pending queue items (batch worker)
 * @param {number} batchSize - Number of items to process
 * @returns {Promise<{processed: number, sent: number, failed: number}>}
 */
const processPendingQueue = async (batchSize = 100) => {
    try {
        const db = getFirestore();
        // Get pending items that are ready for processing
        const now = admin.firestore.Timestamp.now();
        const snapshot = await db.collection(OUTBOUND_QUEUE_COLLECTION)
            .where('status', '==', 'pending')
            .where('nextRetryAt', '<=', now)
            .limit(batchSize)
            .get();
        if (snapshot.empty) {
            return { processed: 0, sent: 0, failed: 0 };
        }
        let sent = 0;
        let failed = 0;
        // Process each item
        for (const doc of snapshot.docs) {
            const success = await processQueueItem(doc.id);
            if (success)
                sent++;
            else
                failed++;
        }
        console.log(`Processed ${snapshot.size} queue items: ${sent} sent, ${failed} failed`);
        return { processed: snapshot.size, sent, failed };
    }
    catch (error) {
        console.error('Error processing pending queue:', error);
        return { processed: 0, sent: 0, failed: 0 };
    }
};
/**
 * Get queue statistics
 * @param {string} clientUserId - Optional filter by client
 * @returns {Promise<Object>} - Queue stats
 */
const getQueueStats = async (clientUserId = null) => {
    try {
        const db = getFirestore();
        let query = db.collection(OUTBOUND_QUEUE_COLLECTION);
        const [pending, sent, deadLetter, failed] = await Promise.all([
            query.where('status', '==', 'pending').count().get(),
            query.where('status', '==', 'sent').count().get(),
            query.where('status', '==', 'dead_letter').count().get(),
            query.where('status', '==', 'failed').count().get()
        ]);
        return {
            pending: pending.data().count,
            sent: sent.data().count,
            deadLetter: deadLetter.data().count,
            failed: failed.data().count,
            lastUpdated: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error getting queue stats:', error);
        return { pending: 0, sent: 0, deadLetter: 0, failed: 0, error: error.message };
    }
};
/**
 * Clean up old processed queue items
 * @returns {Promise<number>} - Number of items cleaned up
 */
const cleanupOldQueueItems = async () => {
    try {
        const db = getFirestore();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        // Delete sent items older than 7 days
        const sentQuery = await db.collection(OUTBOUND_QUEUE_COLLECTION)
            .where('status', '==', 'sent')
            .where('sentAt', '<', sevenDaysAgo)
            .limit(500)
            .get();
        if (sentQuery.empty)
            return 0;
        const batch = db.batch();
        sentQuery.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        return sentQuery.size;
    }
    catch (error) {
        console.error('Error cleaning up queue:', error);
        return 0;
    }
};
/**
 * Retry dead-lettered messages
 * @param {string} queueId - Queue item ID
 * @returns {Promise<boolean>} - Success
 */
const retryDeadLetter = async (queueId) => {
    try {
        const db = getFirestore();
        await db.collection(OUTBOUND_QUEUE_COLLECTION).doc(queueId).update({
            status: 'pending',
            retryCount: 0,
            nextRetryAt: admin.firestore.FieldValue.serverTimestamp(),
            errorMessage: null
        });
        return true;
    }
    catch (error) {
        console.error('Error retrying dead letter:', error);
        return false;
    }
};
// Legacy direct send wrappers that now queue
const sendTextMessage = async (to, text, credentials) => {
    // Queue the message instead of sending directly
    const queueId = await queueTextMessage(to, text, credentials);
    return queueId ? { queued: true, queueId } : null;
};
const sendTemplateMessage = async (to, templateName, languageCode, components, credentials) => {
    const queueId = await queueTemplateMessage(to, templateName, languageCode, components, credentials);
    return queueId ? { queued: true, queueId } : null;
};
module.exports = {
    queueTextMessage,
    queueTemplateMessage,
    processQueueItem,
    processPendingQueue,
    getQueueStats,
    cleanupOldQueueItems,
    retryDeadLetter,
    sendTextMessage,
    sendTemplateMessage,
    OUTBOUND_QUEUE_COLLECTION,
    MAX_RETRIES
};
//# sourceMappingURL=queueSender.js.map