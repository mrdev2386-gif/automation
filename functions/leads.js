/**
 * Lead Management Module
 * Handles lead capture, uploads, and tracking
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

const db = admin.firestore();

const { isSuperAdmin, logActivity } = require('./auth');

/**
 * captureLead - HTTP version with CORS support
 * Primary endpoint for external capture forms/webhooks
 */
const captureLead = functions.region("us-central1").https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // Handle preflight
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        try {
            const {
                createLead,
                checkDuplicate,
                triggerLeadAutomation,
                checkLeadRateLimit,
                isValidPhone,
                sanitizeString,
                isValidEmail
            } = require('./src/services/leadService');

            // 1. Extract and Sanitize Data
            const body = req.body || {};
            const clientKey = req.query.clientKey || body.clientKey;
            const source = sanitizeString(body.source || 'direct');
            const name = sanitizeString(body.name || '');
            const email = body.email ? body.email.toLowerCase().trim() : '';
            const phone = body.phone || '';
            const metadata = body.metadata || {};

            // 2. Validate Required Fields
            if (!clientKey) {
                return res.status(400).json({ error: 'clientKey is required' });
            }

            if (!email && !phone) {
                return res.status(400).json({ error: 'Email or phone number is required' });
            }

            if (email && !isValidEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            if (phone && !isValidPhone(phone)) {
                return res.status(400).json({ error: 'Invalid phone format (E.164 required)' });
            }

            // 3. Authenticate Client
            const userSnapshot = await db.collection('users')
                .where('clientKey', '==', clientKey)
                .where('isActive', '==', true)
                .limit(1)
                .get();

            if (userSnapshot.empty) {
                return res.status(401).json({ error: 'Invalid or inactive clientKey' });
            }

            const clientUser = userSnapshot.docs[0];
            const userId = clientUser.id;

            // 4. Rate Limiting Check
            const rateLimit = await checkLeadRateLimit(userId);
            if (!rateLimit.allowed) {
                return res.status(429).json({ error: 'Rate limit exceeded for this client' });
            }

            // 5. Check for Duplicates (within 24h)
            const isDuplicate = await checkDuplicate(userId, email, phone);
            if (isDuplicate) {
                return res.status(200).json({ 
                    success: true, 
                    message: 'Lead already captured recently',
                    duplicate: true
                });
            }

            // 6. Create Lead
            const leadId = await createLead(userId, {
                name,
                email,
                phone,
                source,
                metadata,
                status: 'new'
            });

            // 7. Trigger Automations (Non-blocking)
            // Trigger background automation based on assigned tools
            triggerLeadAutomation(userId, leadId, {
                name,
                email,
                phone,
                source,
                metadata
            }).catch(err => console.error('Automation trigger failed:', err));

            // 8. Log activity
            await logActivity(userId, 'LEAD_CAPTURED', {
                leadId,
                source
            });

            return res.status(201).json({
                success: true,
                leadId,
                message: 'Lead captured successfully'
            });

        } catch (error) {
            console.error('Error in captureLead:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
});

/**
 * captureLeadCallable - Callable version of lead capture
 */
const captureLeadCallable = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication if needed (or use clientKey)
    const {
        createLead,
        checkDuplicate,
        triggerLeadAutomation,
        isValidEmail,
        isValidPhone
    } = require('./src/services/leadService');

    const userId = context.auth ? context.auth.uid : data.userId;
    if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'User ID required');
    }

    try {
        const { name, email, phone, source, metadata } = data;

        if (email && !isValidEmail(email)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email');
        }

        const leadId = await createLead(userId, {
            name,
            email,
            phone,
            source: source || 'callable',
            metadata: metadata || {},
            status: 'new'
        });

        return { success: true, leadId };
    } catch (error) {
        console.error('captureLeadCallable error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * uploadLeadsBulk - Bulk upload leads from CSV (super_admin or client_user)
 */
const uploadLeadsBulk = functions.region("us-central1").runWith({ timeoutSeconds: 300, memory: '1GB' }).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { leads, source } = data;
    if (!leads || !Array.isArray(leads)) {
        throw new functions.https.HttpsError('invalid-argument', 'Leads array is required');
    }

    try {
        const { processBulkLeads } = require('./src/services/leadService');
        const result = await processBulkLeads(context.auth.uid, leads, source || 'bulk_upload');

        await logActivity(context.auth.uid, 'LEADS_BULK_UPLOADED', {
            count: leads.length,
            processed: result.processed,
            errors: result.errors
        });

        return result;
    } catch (error) {
        console.error('uploadLeadsBulk error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * getMyLeads - Get leads for the current user
 */
const getMyLeads = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const { getUserLeads } = require('./src/services/leadService');
        const leads = await getUserLeads(context.auth.uid, data.filters || {});

        return { leads };
    } catch (error) {
        console.error('getMyLeads error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * getLeadEvents - Get timeline events for a lead
 */
const getLeadEvents = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    if (!data.leadId) {
        throw new functions.https.HttpsError('invalid-argument', 'Lead ID is required');
    }

    try {
        const eventsSnapshot = await db.collection('leads')
            .doc(data.leadId)
            .collection('events')
            .orderBy('timestamp', 'desc')
            .get();

        const events = eventsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { events };
    } catch (error) {
        console.error('getLeadEvents error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * updateLeadStatus - Update status of a lead
 */
const updateLeadStatus = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { leadId, status } = data;
    if (!leadId || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'Lead ID and status are required');
    }

    try {
        await db.collection('leads').doc(leadId).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Add event
        await db.collection('leads').doc(leadId).collection('events').add({
            type: 'STATUS_CHANGE',
            status,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: context.auth.uid
        });

        return { success: true };
    } catch (error) {
        console.error('updateLeadStatus error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * getAllLeads - Get all leads (super_admin only)
 */
const getAllLeads = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only super_admin can view all leads');
    }

    try {
        const leadsSnapshot = await db.collection('leads')
            .orderBy('createdAt', 'desc')
            .limit(1000)
            .get();

        const leads = leadsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { leads };
    } catch (error) {
        console.error('getAllLeads error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

module.exports = {
    captureLead,
    captureLeadCallable,
    uploadLeadsBulk,
    getMyLeads,
    getLeadEvents,
    updateLeadStatus,
    getAllLeads
};
