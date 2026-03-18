/**
 * Lead Finder HTTP Endpoints
 * Direct HTTP functions for fetch-based calls
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

const db = admin.firestore();
const { logActivity } = require('./auth');

/**
 * startLeadFinder - HTTP endpoint
 */
const startLeadFinder = functions.region("us-central1").https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        try {
            console.log('startLeadFinder - Request received');
            console.log('Body:', JSON.stringify(req.body));

            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            console.log('User ID:', userId);

            // Validate user
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: 'User profile not found' });
            }
            
            const userData = userDoc.data();
            if (!userData.isActive) {
                return res.status(403).json({ error: 'User account is disabled' });
            }
            if (!userData.assignedAutomations || !userData.assignedAutomations.includes('lead_finder')) {
                return res.status(403).json({ error: 'Lead Finder tool not assigned to your account' });
            }

            // Extract parameters
            const { country, niche, limit } = req.body;
            console.log('Input:', { country, niche, limit });
            
            if (!country || !niche) {
                return res.status(400).json({ error: 'Missing required fields: country or niche' });
            }

            // Create job
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
                limit: limit || 500
            });

            return res.status(200).json({
                jobId: jobRef.id,
                status: 'queued',
                websitesDiscovered: 0,
                apifyLeadsDiscovered: 0,
                message: `🚀 Lead Finder job started. Preparing to scan for ${niche} businesses in ${country}.`
            });
        } catch (error) {
            console.error('START LEAD FINDER ERROR:', error);
            console.error('Stack:', error.stack);
            return res.status(500).json({ error: error.message || 'Failed to start lead finder' });
        }
    });
});

/**
 * getLeadFinderStatus - HTTP endpoint
 */
const getLeadFinderStatus = functions.region("us-central1").https.onRequest((req, res) => {
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

            const { jobId } = req.body;
            if (!jobId) {
                return res.status(400).json({ error: 'jobId is required' });
            }

            const jobDoc = await db.collection('lead_finder_jobs').doc(jobId).get();
            if (!jobDoc.exists) {
                return res.status(404).json({ error: 'Job not found' });
            }

            const job = jobDoc.data();
            
            // Check permission
            if (job.userId !== userId) {
                const userDoc = await db.collection('users').doc(userId).get();
                if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
                    return res.status(403).json({ error: 'You do not have permission to view this job' });
                }
            }

            return res.status(200).json({ job });
        } catch (error) {
            console.error('Error getting job status:', error);
            return res.status(500).json({ error: error.message || 'Failed to get job status' });
        }
    });
});

/**
 * deleteLeadFinderLeads - HTTP endpoint
 */
const deleteLeadFinderLeads = functions.region("us-central1").https.onRequest((req, res) => {
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

            const { leadIds } = req.body;
            if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
                return res.status(400).json({ error: 'leadIds array is required' });
            }

            const batch = db.batch();
            let deletedCount = 0;

            for (const leadId of leadIds) {
                const leadDoc = await db.collection('leads').doc(leadId).get();
                if (leadDoc.exists && leadDoc.data().userId === userId) {
                    batch.delete(db.collection('leads').doc(leadId));
                    deletedCount++;
                }
            }

            await batch.commit();

            await logActivity(userId, 'LEADS_DELETED', { count: deletedCount });

            return res.status(200).json({ deleted: deletedCount });
        } catch (error) {
            console.error('Error deleting leads:', error);
            return res.status(500).json({ error: error.message || 'Failed to delete leads' });
        }
    });
});

/**
 * getMyLeadFinderLeads - HTTP endpoint
 */
const getMyLeadFinderLeads = functions.https.onRequest((req, res) => {
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
            } catch (queryError) {
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
            } catch (jobError) {
                console.warn('Failed to fetch jobs with orderBy, trying without:', jobError.message);
                try {
                    jobsSnapshot = await db
                        .collection('lead_finder_jobs')
                        .where('userId', '==', userId)
                        .limit(20)
                        .get();
                } catch (fallbackError) {
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
        } catch (error) {
            console.error('ERROR in getMyLeadFinderLeads:', error);
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
    });
});

module.exports = {
    startLeadFinder,
    getLeadFinderStatus,
    deleteLeadFinderLeads,
    getMyLeadFinderLeads
};
