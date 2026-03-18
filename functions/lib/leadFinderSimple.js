"use strict";
/**
 * Lead Finder Module - Simplified Version
 * Minimal implementation to get the function working
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const db = admin.firestore();
const { logActivity } = require('./auth');
/**
 * startLeadFinderCallable - Callable version for Firebase SDK
 */
const startLeadFinderCallable = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        console.log('startLeadFinder - Request received');
        console.log('Data:', JSON.stringify(data));
        const userId = context.auth.uid;
        console.log('User ID:', userId);
        // Validate user exists and is active
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            console.error('User not found:', userId);
            throw new functions.https.HttpsError('not-found', 'User profile not found');
        }
        const userData = userDoc.data();
        console.log('User data:', { isActive: userData.isActive, tools: userData.assignedAutomations });
        if (!userData.isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }
        if (!userData.assignedAutomations || !userData.assignedAutomations.includes('lead_finder')) {
            throw new functions.https.HttpsError('permission-denied', 'Lead Finder tool not assigned to your account');
        }
        // Extract parameters
        const country = data.country || data.targetCountry;
        const niche = data.niche || data.targetNiche;
        const limit = data.limit || data.maxWebsites || 500;
        console.log('Lead Finder Input:', { country, niche, limit });
        // Validate inputs
        if (!country || !niche) {
            console.error('Missing required fields:', { country, niche });
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: country or niche');
        }
        // Create job record
        const jobRef = db.collection('lead_finder_jobs').doc();
        const now = admin.firestore.FieldValue.serverTimestamp();
        const job = {
            id: jobRef.id,
            userId,
            country,
            niche,
            status: 'queued',
            progress: {
                websitesScanned: 0,
                emailsFound: 0,
                createdAt: now
            },
            websites: [],
            results: [],
            createdAt: now,
            updatedAt: now
        };
        await jobRef.set(job);
        console.log('Job created:', jobRef.id);
        // Log activity
        await logActivity(userId, 'LEAD_FINDER_STARTED', {
            jobId: jobRef.id,
            country,
            niche,
            limit
        });
        return {
            jobId: jobRef.id,
            status: 'queued',
            websitesDiscovered: 0,
            apifyLeadsDiscovered: 0,
            message: `🚀 Lead Finder job started. Preparing to scan for ${niche} businesses in ${country}.`
        };
    }
    catch (error) {
        console.error('START LEAD FINDER ERROR:', error);
        console.error('Error stack:', error.stack);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to start lead finder');
    }
});
/**
 * getLeadFinderStatusCallable - Get job status
 */
const getLeadFinderStatusCallable = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const { jobId } = data;
        if (!jobId) {
            throw new functions.https.HttpsError('invalid-argument', 'jobId is required');
        }
        const jobDoc = await db.collection('lead_finder_jobs').doc(jobId).get();
        if (!jobDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Job not found');
        }
        const job = jobDoc.data();
        // Check permission
        if (job.userId !== context.auth.uid) {
            const userDoc = await db.collection('users').doc(context.auth.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
                throw new functions.https.HttpsError('permission-denied', 'You do not have permission to view this job');
            }
        }
        return { job };
    }
    catch (error) {
        console.error('Error getting job status:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to get job status');
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
            console.log('Fetching leads for user:', userId);
            // Fetch leads
            let leadsSnapshot;
            try {
                leadsSnapshot = await db
                    .collection('leads')
                    .where('userId', '==', userId)
                    .where('source', '==', 'lead_finder')
                    .limit(100)
                    .get();
            }
            catch (queryError) {
                console.warn('Query with source filter failed, trying without filter:', queryError.message);
                leadsSnapshot = await db
                    .collection('leads')
                    .where('userId', '==', userId)
                    .limit(100)
                    .get();
            }
            const leads = leadsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Leads found:', leads.length);
            // Fetch jobs
            let jobsSnapshot;
            try {
                jobsSnapshot = await db
                    .collection('lead_finder_jobs')
                    .where('userId', '==', userId)
                    .orderBy('createdAt', 'desc')
                    .limit(20)
                    .get();
            }
            catch (jobError) {
                console.warn('Failed to fetch jobs with orderBy, trying without:', jobError.message);
                try {
                    jobsSnapshot = await db
                        .collection('lead_finder_jobs')
                        .where('userId', '==', userId)
                        .limit(20)
                        .get();
                }
                catch (fallbackError) {
                    console.warn('Failed to fetch jobs:', fallbackError.message);
                    jobsSnapshot = { docs: [] };
                }
            }
            const jobs = jobsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Jobs found:', jobs.length);
            return res.status(200).json({
                leads,
                jobs
            });
        }
        catch (error) {
            console.error('ERROR in getMyLeadFinderLeads:', error);
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
    });
});
/**
 * deleteLeadFinderLeadsCallable - Delete leads
 */
const deleteLeadFinderLeadsCallable = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const { leadIds } = data;
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'leadIds array is required');
        }
        const userId = context.auth.uid;
        const batch = db.batch();
        for (const leadId of leadIds) {
            const leadDoc = await db.collection('leads').doc(leadId).get();
            if (leadDoc.exists && leadDoc.data().userId === userId) {
                batch.delete(db.collection('leads').doc(leadId));
            }
        }
        await batch.commit();
        await logActivity(userId, 'LEADS_DELETED', { count: leadIds.length });
        return { deleted: leadIds.length };
    }
    catch (error) {
        console.error('Error deleting leads:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to delete leads');
    }
});
module.exports = {
    startLeadFinder: startLeadFinderCallable,
    getLeadFinderStatus: getLeadFinderStatusCallable,
    getMyLeadFinderLeads: getMyLeadFinderLeadsHTTP,
    deleteLeadFinderLeads: deleteLeadFinderLeadsCallable
};
//# sourceMappingURL=leadFinderSimple.js.map