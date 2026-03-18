"use strict";
/**
 * Lead Finder Module
 * Handles web scraping and business lead discovery
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const db = admin.firestore();
const { logActivity } = require('./auth');
/**
 * submitWebsitesForScraping - Submit websites to scrape
 */
const submitWebsitesForScraping = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        if (!data.jobId || !data.websites || !Array.isArray(data.websites)) {
            throw new functions.https.HttpsError('invalid-argument', 'Job ID and websites array are required');
        }
        const { submitWebsites } = require('./src/services/leadFinderService');
        const result = await submitWebsites(context.auth.uid, data.jobId, data.websites);
        // Log activity
        await logActivity(context.auth.uid, 'WEBSITES_SUBMITTED_FOR_SCRAPING', {
            jobId: data.jobId,
            websiteCount: data.websites.length,
            emailsFound: result.emailsFound
        });
        return result;
    }
    catch (error) {
        console.error('Error submitting websites:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to submit websites');
    }
});
/**
 * setupLeadFinderForUser - Auto-setup Lead Finder when admin creates user
 */
const setupLeadFinderForUser = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // Check if user is super_admin (only admins can setup for other users)
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can setup Lead Finder for users');
    }
    try {
        if (!data.userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
        }
        const targetUserId = data.userId;
        const now = admin.firestore.FieldValue.serverTimestamp();
        // Create lead_finder_config record
        const configRef = db.collection('lead_finder_config').doc(targetUserId);
        await configRef.set({
            user_id: targetUserId,
            api_key: '', // User will add this themselves
            daily_limit: 500,
            max_concurrent_jobs: 1,
            status: 'active',
            created_at: now,
            updated_at: now
        });
        // Create user_tools record
        const toolRef = db.collection('user_tools').doc(`${targetUserId}_lead_finder`);
        await toolRef.set({
            user_id: targetUserId,
            tool_name: 'lead_finder',
            status: 'active',
            created_at: now
        });
        // Log activity
        await logActivity(context.auth.uid, 'LEAD_FINDER_SETUP_USER', {
            targetUserId,
            setupBy: context.auth.uid
        });
        console.log(`✅ Lead Finder setup for user ${targetUserId}`);
        return {
            success: true,
            message: 'Lead Finder successfully setup for user'
        };
    }
    catch (error) {
        console.error('Error setting up Lead Finder:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to setup Lead Finder');
    }
});
/**
 * saveLeadFinderAPIKey - Save user's SerpAPI key
 */
const saveLeadFinderAPIKey = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const userId = context.auth.uid;
        const { serpApiKeys, apifyApiKeys } = data;
        // Defensive validation
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
        }
        // Get existing configuration first
        const configRef = db.collection('lead_finder_config').doc(userId);
        const existingDoc = await configRef.get();
        let existingSerp = [];
        let existingApify = [];
        if (existingDoc.exists) {
            const data = existingDoc.data();
            existingSerp = data.serp_api_keys || [];
            existingApify = data.apify_api_keys || [];
        }
        // Clean and validate arrays - filter out KEEP_EXISTING placeholders
        const cleanSerpKeys = (serpApiKeys || [])
            .map(k => k?.trim())
            .filter(k => k && k.length > 0 && k !== 'KEEP_EXISTING');
        const cleanApifyKeys = (apifyApiKeys || [])
            .map(k => k?.trim())
            .filter(k => k && k.length > 0 && k !== 'KEEP_EXISTING');
        // Check if user wants to preserve existing keys
        const keepSerp = (serpApiKeys || []).includes('KEEP_EXISTING');
        const keepApify = (apifyApiKeys || []).includes('KEEP_EXISTING');
        const hasSerpKeys = cleanSerpKeys.length > 0 || keepSerp;
        const hasApifyKeys = cleanApifyKeys.length > 0 || keepApify;
        if (!hasSerpKeys && !hasApifyKeys) {
            throw new functions.https.HttpsError('invalid-argument', 'At least one API key type is required');
        }
        // Determine final keys to save
        const finalSerp = cleanSerpKeys.length > 0 ? cleanSerpKeys : existingSerp;
        const finalApify = cleanApifyKeys.length > 0 ? cleanApifyKeys : existingApify;
        // Prepare update data
        const updateData = {
            user_id: userId,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };
        if (finalSerp.length > 0)
            updateData.serp_api_keys = finalSerp;
        if (finalApify.length > 0)
            updateData.apify_api_keys = finalApify;
        if (!existingDoc.exists) {
            await configRef.set({
                ...updateData,
                daily_limit: 500,
                max_concurrent_jobs: 1,
                status: 'active',
                created_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        else {
            await configRef.update(updateData);
        }
        // Log activity
        await logActivity(userId, 'LEAD_FINDER_API_KEYS_SAVED', {
            serpKeysCount: finalSerp.length,
            apifyKeysCount: finalApify.length
        });
        return {
            success: true,
            message: 'API keys saved successfully',
            serpKeysCount: finalSerp.length,
            apifyKeysCount: finalApify.length
        };
    }
    catch (error) {
        console.error('saveLeadFinderAPIKey error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to save API keys');
    }
});
/**
 * getLeadFinderConfig - HTTP version with CORS support
 */
const getLeadFinderConfig = functions.region("us-central1").https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;
            const userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists) {
                return res.status(200).json({
                    accountActive: false,
                    leadFinderConfigured: false,
                    toolsAssigned: false,
                    serp_api_keys: [],
                    apify_api_keys: [],
                    api_key: null,
                    apify_api_key: null
                });
            }
            const userData = userDoc.data();
            const tools = userData.assignedAutomations || [];
            // Get lead_finder_config to return API keys info
            const configDoc = await db.collection('lead_finder_config').doc(uid).get();
            const config = configDoc.exists ? configDoc.data() : {};
            return res.status(200).json({
                accountActive: userData.isActive === true,
                leadFinderConfigured: tools.includes('lead_finder'),
                toolsAssigned: tools.length > 0,
                serp_api_keys: config.serp_api_keys || [],
                apify_api_keys: config.apify_api_keys || [],
                api_key: config.api_key || null,
                apify_api_key: config.apify_api_key || null,
                daily_limit: config.daily_limit || 500,
                max_concurrent_jobs: config.max_concurrent_jobs || 1,
                status: config.status || 'active',
                created_at: config.created_at || null,
                updated_at: config.updated_at || null
            });
        }
        catch (error) {
            console.error('Error in getLeadFinderConfig:', error);
            return res.status(500).json({
                success: false,
                error: 'internal_error',
                message: 'Failed to get configuration: ' + error.message
            });
        }
    });
});
/**
 * getLeadFinderQueueStats - Get queue statistics (admin only)
 */
const getLeadFinderQueueStats = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can view queue statistics');
        }
        const queueService = require('./src/services/leadFinderQueueService');
        const stats = await queueService.getQueueStats();
        const [completedJobs, failedJobs, activeJobs] = await Promise.all([
            db.collection('lead_finder_jobs').where('status', '==', 'completed').get(),
            db.collection('lead_finder_jobs').where('status', '==', 'failed').get(),
            db.collection('lead_finder_jobs').where('status', '==', 'in_progress').get()
        ]);
        return {
            queue: stats,
            jobs: {
                active_jobs: activeJobs.size,
                completed_jobs: completedJobs.size,
                failed_jobs: failedJobs.size,
                total_jobs: completedJobs.size + failedJobs.size + activeJobs.size
            },
            timestamp: Date.now()
        };
    }
    catch (error) {
        console.error('Error getting queue stats:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to get queue statistics');
    }
});
/**
 * updateScraperConfig - Update scraper configuration (admin only)
 */
const updateScraperConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can update scraper configuration');
        }
        const scraperConfigService = require('./src/services/scraperConfigService');
        const result = await scraperConfigService.saveScraperConfig(data.config);
        if (!result.success) {
            throw new functions.https.HttpsError('internal', result.error || 'Failed to save configuration');
        }
        await logActivity(context.auth.uid, 'SCRAPER_CONFIG_UPDATED', {
            updatedFields: Object.keys(data.config)
        });
        return { success: true, message: 'Scraper configuration updated successfully' };
    }
    catch (error) {
        console.error('Error updating scraper config:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to update scraper configuration');
    }
});
/**
 * getScraperConfig - Get current scraper configuration (admin only)
 */
const getScraperConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can view scraper configuration');
        }
        const scraperConfigService = require('./src/services/scraperConfigService');
        const config = await scraperConfigService.getScraperConfig(true);
        return { config };
    }
    catch (error) {
        console.error('Error getting scraper config:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to get scraper configuration');
    }
});
/**
 * saveWebhookConfig - Save webhook URL for CRM integration
 */
const saveWebhookConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const userId = context.auth.uid;
        const webhookUrl = data.webhook_url;
        const configRef = db.collection('lead_finder_config').doc(userId);
        await configRef.set({
            webhook_url: webhookUrl || '',
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        await logActivity(userId, 'WEBHOOK_CONFIG_SAVED', {
            hasWebhook: Boolean(webhookUrl)
        });
        return { success: true, message: 'Webhook configuration saved' };
    }
    catch (error) {
        console.error('Error saving webhook config:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to save webhook');
    }
});
/**
 * getMyLeadFinderLeadsHTTP - HTTP version with CORS support
 */
const getMyLeadFinderLeadsHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            const { getUserLeads, getUserJobs } = require('./src/services/leadFinderService');
            const leads = await getUserLeads(userId);
            const jobs = await getUserJobs(userId);
            return res.status(200).json({ leads, jobs });
        }
        catch (error) {
            console.error('Error fetching leads:', error);
            return res.status(500).json({ error: error.message || 'Failed to fetch leads' });
        }
    });
});
/**
 * startLeadFinderHTTP - HTTP version with CORS support
 */
const startLeadFinderHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists)
                return res.status(404).json({ error: 'User profile not found' });
            const userData = userDoc.data();
            if (!userData.isActive)
                return res.status(403).json({ error: 'User account is disabled' });
            if (!userData.assignedAutomations || !userData.assignedAutomations.includes('lead_finder')) {
                return res.status(403).json({ error: 'Lead Finder tool not assigned to your account' });
            }
            const body = req.body?.data ?? req.body ?? {};
            const { country, niche, limit } = body;
            if (!country || !niche) {
                return res.status(400).json({ error: 'invalid-argument', message: 'country and niche are required' });
            }
            const { startAutomatedLeadFinder } = require('./src/services/leadFinderService');
            const result = await startAutomatedLeadFinder(userId, country, niche, limit);
            await logActivity(userId, 'LEAD_FINDER_STARTED', {
                jobId: result.jobId,
                country,
                niche,
                limit: limit || 500
            });
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('Error starting lead finder:', error);
            return res.status(500).json({ error: error.message || 'Failed to start lead finder job' });
        }
    });
});
/**
 * getLeadFinderStatusHTTP - HTTP version with CORS support
 */
const getLeadFinderStatusHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS')
            return res.status(204).send('');
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer '))
                return res.status(401).json({ error: 'Unauthorized' });
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            const body = req.body?.data ?? req.body ?? {};
            const { jobId } = body;
            if (!jobId)
                return res.status(400).json({ error: 'invalid-argument', message: 'jobId is required' });
            const { getJobStatus } = require('./src/services/leadFinderService');
            const job = await getJobStatus(jobId);
            if (!job)
                return res.status(404).json({ error: 'Job not found' });
            if (job.userId !== userId) {
                const userDoc = await db.collection('users').doc(userId).get();
                if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
                    return res.status(403).json({ error: 'You do not have permission to view this job' });
                }
            }
            return res.status(200).json({ job });
        }
        catch (error) {
            console.error('Error getting job status:', error);
            return res.status(500).json({ error: error.message || 'Failed to get job status' });
        }
    });
});
/**
 * deleteLeadFinderLeadsHTTP - HTTP version with CORS support
 */
const deleteLeadFinderLeadsHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS')
            return res.status(204).send('');
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer '))
                return res.status(401).json({ error: 'Unauthorized' });
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            const body = req.body?.data ?? req.body ?? {};
            const { leadIds } = body;
            if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
                return res.status(400).json({ error: 'invalid-argument', message: 'leadIds array is required' });
            }
            const { deleteLeads } = require('./src/services/leadFinderService');
            const result = await deleteLeads(userId, leadIds);
            await logActivity(userId, 'LEADS_DELETED', { count: result.deleted });
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('Error deleting leads:', error);
            return res.status(500).json({ error: error.message || 'Failed to delete leads' });
        }
    });
});
module.exports = {
    submitWebsitesForScraping,
    setupLeadFinderForUser,
    saveLeadFinderAPIKey,
    getLeadFinderConfig,
    getLeadFinderQueueStats,
    updateScraperConfig,
    getScraperConfig,
    saveWebhookConfig,
    getMyLeadFinderLeadsHTTP,
    getMyLeadFinderLeads: getMyLeadFinderLeadsHTTP,
    startLeadFinderHTTP,
    startLeadFinder: startLeadFinderHTTP,
    getLeadFinderStatusHTTP,
    getLeadFinderStatus: getLeadFinderStatusHTTP,
    deleteLeadFinderLeadsHTTP,
    deleteLeadFinderLeads: deleteLeadFinderLeadsHTTP
};
//# sourceMappingURL=leadFinder.js.map