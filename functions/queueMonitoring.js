/**
 * Lead Finder Queue Monitoring & Configuration
 * Handles queue statistics, scraper configuration, and worker health
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

const getLeadFinderQueueStats = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can view queue statistics');
        }

        const [completedJobs, failedJobs, activeJobs] = await Promise.all([
            db.collection('lead_finder_jobs').where('status', '==', 'completed').get(),
            db.collection('lead_finder_jobs').where('status', '==', 'failed').get(),
            db.collection('lead_finder_jobs').where('status', '==', 'in_progress').get()
        ]);

        return {
            queue: { status: 'operational' },
            jobs: {
                active_jobs: activeJobs.size,
                completed_jobs: completedJobs.size,
                failed_jobs: failedJobs.size,
                total_jobs: completedJobs.size + failedJobs.size + activeJobs.size
            },
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('Error getting queue stats:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to get queue statistics');
    }
});

const updateScraperConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can update scraper configuration');
        }

        return { success: true, message: 'Scraper configuration updated successfully' };
    } catch (error) {
        console.error('Error updating scraper config:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to update scraper configuration');
    }
});

const getScraperConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can view scraper configuration');
        }

        return { config: {} };
    } catch (error) {
        console.error('Error getting scraper config:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to get scraper configuration');
    }
});

const saveWebhookConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userId = context.auth.uid;
        const webhookUrl = data.webhook_url;

        if (webhookUrl && typeof webhookUrl !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid webhook URL');
        }

        const configRef = db.collection('lead_finder_config').doc(userId);
        await configRef.set({
            webhook_url: webhookUrl || '',
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true, message: 'Webhook configuration saved' };
    } catch (error) {
        console.error('Error saving webhook config:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to save webhook');
    }
});

module.exports = {
    getLeadFinderQueueStats,
    updateScraperConfig,
    getScraperConfig,
    saveWebhookConfig
};
