/**
 * Scheduler Module
 * Handles scheduled tasks and cron jobs
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * cleanupOldLogs - Clean up old activity logs (run daily)
 */
const cleanupOldLogs = functions.pubsub.schedule('every day 00:00').onRun(async (context) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const oldLogs = await db.collection('activity_logs')
            .where('timestamp', '<', thirtyDaysAgo)
            .get();

        const batch = db.batch();
        oldLogs.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`Deleted ${oldLogs.size} old activity logs`);
    } catch (error) {
        console.error('Error cleaning up logs:', error);
    }
});

/**
 * processScheduledMessages - Process scheduled follow-up messages
 */
const processScheduledMessages = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    const now = new Date();
    try {
        const dueMessages = await db.collection('scheduled_messages')
            .where('status', '==', 'pending')
            .where('scheduledFor', '<=', now)
            .limit(100)
            .get();

        console.log(`Found ${dueMessages.size} messages to process`);

        for (const messageDoc of dueMessages.docs) {
            const message = messageDoc.data();
            try {
                const credentials = {
                    whatsappToken: message.credentials?.whatsappToken,
                    whatsappNumberId: message.credentials?.whatsappNumberId
                };

                if (!credentials.whatsappToken || !credentials.whatsappNumberId) {
                    console.error(`Missing credentials for message ${messageDoc.id}`);
                    await messageDoc.ref.update({ status: 'failed', error: 'missing_credentials' });
                    continue;
                }

                const { sendTextMessage } = require('./src/whatsapp/sender');
                const result = await sendTextMessage(message.phone, message.message, credentials);

                if (result) {
                    await messageDoc.ref.update({
                        status: 'sent',
                        sentAt: admin.firestore.FieldValue.serverTimestamp(),
                        messageId: result.messages?.[0]?.id
                    });

                    await db.collection('lead_events').add({
                        leadId: message.leadId,
                        clientUserId: message.clientUserId,
                        type: 'scheduled_followup_sent',
                        metadata: { messageType: message.type, messageId: result.messages?.[0]?.id },
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    await messageDoc.ref.update({
                        status: 'failed',
                        error: 'send_failed',
                        retryCount: (message.retryCount || 0) + 1
                    });
                }
            } catch (error) {
                console.error(`Error processing message ${messageDoc.id}:`, error);
                await messageDoc.ref.update({ status: 'failed', error: error.message, retryCount: (message.retryCount || 0) + 1 });
            }
        }
    } catch (error) {
        console.error('Error in processScheduledMessages:', error);
    }
});

/**
 * processMessageQueue - Process pending message queue every minute
 */
const processMessageQueue = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    try {
        const { processPendingQueue } = require('./src/whatsapp/queueSender');
        await processPendingQueue(100);
        return null;
    } catch (error) {
        console.error('Queue processing error:', error);
        return null;
    }
});

/**
 * cleanupProductionData - Cleanup old data daily
 */
const cleanupProductionData = functions.pubsub.schedule('every day 00:00').onRun(async (context) => {
    try {
        const { cleanupExpiredRateLimits } = require('./src/services/rateLimitService');
        const { cleanupOldProcessedMessages } = require('./src/services/idempotencyService');
        const { cleanupOldQueueItems } = require('./src/whatsapp/queueSender');

        await Promise.all([
            cleanupExpiredRateLimits(),
            cleanupOldProcessedMessages(),
            cleanupOldQueueItems()
        ]);
        return null;
    } catch (error) {
        console.error('Cleanup error:', error);
        return null;
    }
});

/**
 * detectTimedOutJobs - Scheduled function to detect and mark timed-out jobs
 */
const detectTimedOutJobs = functions.pubsub.schedule('every 10 minutes').onRun(async (context) => {
    try {
        const scraperConfigService = require('./src/services/scraperConfigService');
        await scraperConfigService.detectTimedOutJobs();
        return null;
    } catch (error) {
        console.error('Error detecting timed-out jobs:', error);
        return null;
    }
});

/**
 * checkWorkerHealth - Scheduled function to monitor worker health
 */
const checkWorkerHealth = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    try {
        const workerMonitoringService = require('./src/services/workerMonitoringService');
        await workerMonitoringService.checkDeadWorkers();
        return null;
    } catch (error) {
        console.error('Error checking worker health:', error);
        return null;
    }
});

/**
 * processLeadFinderQueue - Scheduled worker to process queued campaigns
 */
const processLeadFinderQueue = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    try {
        const snapshot = await db.collection('lead_finder_queue').where('status', '==', 'pending').limit(5).get();
        if (snapshot.empty) return null;

        for (const doc of snapshot.docs) {
            const job = doc.data();
            const jobId = doc.id;
            try {
                await db.collection('lead_finder_queue').doc(jobId).update({
                    status: 'processing',
                    processedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                const { startAutomatedLeadFinder } = require('./src/services/leadFinderService');
                await startAutomatedLeadFinder(job.userId, job.country, job.niche, job.limit || 500);

                await db.collection('lead_finder_queue').doc(jobId).update({
                    status: 'completed',
                    completedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                if (job.campaignId) {
                    await db.collection('ai_lead_campaigns').doc(job.campaignId).update({
                        status: 'completed',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            } catch (err) {
                console.error('[WORKER] Job failed:', jobId, err.message);
                await db.collection('lead_finder_queue').doc(jobId).update({
                    status: 'failed',
                    error: err.message,
                    failedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                if (job.campaignId) {
                    await db.collection('ai_lead_campaigns').doc(job.campaignId).update({
                        status: 'failed',
                        error: err.message,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        }
        return null;
    } catch (error) {
        console.error('[WORKER] Fatal error:', error.message);
        return null;
    }
});

module.exports = {
    cleanupOldLogs,
    processScheduledMessages,
    processMessageQueue,
    cleanupProductionData,
    detectTimedOutJobs,
    checkWorkerHealth,
    processLeadFinderQueue
};
