"use strict";
/**
 * Automation Management Module
 * Handles automation creation, updates, deletion, and assignment
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const { isSuperAdmin, logActivity } = require('./auth');
/**
 * createAutomation - Create a new automation (super_admin only)
 */
const createAutomation = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only super_admin can create automations');
    }
    // Validate input
    if (!data.name) {
        throw new functions.https.HttpsError('invalid-argument', 'Automation name is required');
    }
    try {
        const automationRef = await db.collection('automations').add({
            name: data.name,
            description: data.description || '',
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Log activity
        await logActivity(context.auth.uid, 'AUTOMATION_CREATED', {
            automationId: automationRef.id,
            automationName: data.name
        });
        return {
            success: true,
            automationId: automationRef.id,
            message: 'Automation created successfully'
        };
    }
    catch (error) {
        console.error('Error creating automation:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create automation');
    }
});
/**
 * updateAutomation - Update an automation (super_admin only)
 */
const updateAutomation = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only super_admin can update automations');
    }
    // Validate input
    if (!data.automationId) {
        throw new functions.https.HttpsError('invalid-argument', 'Automation ID is required');
    }
    const updateData = {};
    if (data.name !== undefined)
        updateData.name = data.name;
    if (data.description !== undefined)
        updateData.description = data.description;
    if (data.isActive !== undefined)
        updateData.isActive = data.isActive;
    try {
        await db.collection('automations').doc(data.automationId).update(updateData);
        // Log activity
        await logActivity(context.auth.uid, 'AUTOMATION_UPDATED', {
            automationId: data.automationId,
            updates: updateData
        });
        return {
            success: true,
            message: 'Automation updated successfully'
        };
    }
    catch (error) {
        console.error('Error updating automation:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update automation');
    }
});
/**
 * deleteAutomation - Delete an automation (super_admin only)
 */
const deleteAutomation = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only super_admin can delete automations');
    }
    // Validate input
    if (!data.automationId) {
        throw new functions.https.HttpsError('invalid-argument', 'Automation ID is required');
    }
    try {
        await db.collection('automations').doc(data.automationId).delete();
        // Log activity
        await logActivity(context.auth.uid, 'AUTOMATION_DELETED', {
            automationId: data.automationId
        });
        return {
            success: true,
            message: 'Automation deleted successfully'
        };
    }
    catch (error) {
        console.error('Error deleting automation:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete automation');
    }
});
/**
 * getAllAutomations - Get all automations (super_admin only)
 */
const getAllAutomations = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only super_admin can view all automations');
    }
    try {
        const automationsSnapshot = await db.collection('automations')
            .orderBy('createdAt', 'desc')
            .get();
        const automations = automationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { automations };
    }
    catch (error) {
        console.error('Error fetching automations:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch automations');
    }
});
/**
 * ensureLeadFinderAutomation - Ensure Lead Finder automation exists
 * Called on first use to initialize the tool
 */
const ensureLeadFinderAutomation = functions.region("us-central1").https.onCall(async (data, context) => {
    console.log('🔍 ensureLeadFinderAutomation called');
    console.log('📋 Input data:', JSON.stringify(data));
    console.log('👤 Context auth:', context.auth ? context.auth.uid : 'NO AUTH');
    try {
        const leadFinderRef = db.collection('automations').doc('lead_finder');
        const leadFinderDoc = await leadFinderRef.get();
        console.log('📊 Lead Finder doc exists:', leadFinderDoc.exists);
        if (!leadFinderDoc.exists) {
            // Create the Lead Finder automation
            console.log('✨ Creating Lead Finder automation...');
            await leadFinderRef.set({
                id: 'lead_finder',
                name: 'Lead Finder',
                description: 'Find and extract business emails from websites using web scraping',
                category: 'lead_generation',
                icon: 'search',
                isActive: true,
                features: [
                    'Search by country and niche',
                    'Automatic website scraping',
                    'Email extraction',
                    'CSV export',
                    'Batch processing'
                ],
                maxResults: 500,
                rateLimit: {
                    jobsPerDay: 5,
                    websitesPerJob: 500
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Lead Finder automation created successfully');
            return {
                success: true,
                status: 'created',
                message: 'Lead Finder automation initialized'
            };
        }
        console.log('✅ Lead Finder automation already exists');
        return {
            success: true,
            status: 'exists',
            message: 'Lead Finder automation already exists'
        };
    }
    catch (error) {
        console.error('❌ Error ensuring Lead Finder automation:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        throw new functions.https.HttpsError('internal', `Failed to initialize Lead Finder automation: ${error.message}`);
    }
});
/**
 * getMyAutomations - Get automations assigned to current user (client_user)
 */
const getMyAutomations = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        // Get user profile
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User profile not found');
        }
        const userData = userDoc.data();
        // Check if user is active
        if (!userData.isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }
        const assignedAutomations = userData.assignedAutomations || [];
        if (assignedAutomations.length === 0) {
            return { automations: [], message: 'No automations assigned' };
        }
        // Fetch assigned automations
        const automationsPromises = assignedAutomations.map(async (automationId) => {
            const doc = await db.collection('automations').doc(automationId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        });
        const automations = (await Promise.all(automationsPromises))
            .filter(a => a !== null);
        return { automations };
    }
    catch (error) {
        console.error('Error fetching user automations:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch automations');
    }
});
/**
 * seedDefaultAutomations - Create three production automation templates
 */
const seedDefaultAutomations = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only super_admin can seed automations');
    }
    // Define the four production automations
    const defaultAutomations = [
        {
            id: 'saas_automation',
            name: 'SaaS Lead Automation',
            description: 'Capture and nurture SaaS product leads with automated follow-ups',
            isActive: true,
            featureFlags: {
                leadCaptureWebhook: true,
                autoFollowUp: true,
                crmSync: true,
                aiAutoReply: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            id: 'restaurant_automation',
            name: 'Restaurant Growth Automation',
            description: 'Reservations, reviews, and customer engagement for restaurants',
            isActive: true,
            featureFlags: {
                tableBookingCapture: true,
                reviewRequestAutomation: true,
                whatsappConfirmation: true,
                repeatCustomerTagging: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            id: 'hotel_automation',
            name: 'Hotel Booking Automation',
            description: 'Guest inquiry and booking workflow for hotels',
            isActive: true,
            featureFlags: {
                bookingInquiryCapture: true,
                availabilityAutoResponse: true,
                preArrivalReminders: true,
                guestFollowUp: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            id: 'whatsapp_ai_assistant',
            name: 'AI WhatsApp Receptionist',
            description: 'Intelligent AI-powered WhatsApp receptionist for automated customer support',
            isActive: true,
            featureFlags: {
                aiReceptionist: true,
                intelligentRouting: true,
                appointmentScheduling: true,
                leadQualification: true,
                multiLanguageSupport: true,
                customResponseFlows: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
    ];
    try {
        const results = [];
        for (const automation of defaultAutomations) {
            // Check if automation already exists
            const existingDoc = await db.collection('automations').doc(automation.id).get();
            if (existingDoc.exists) {
                // Update existing
                await db.collection('automations').doc(automation.id).update({
                    ...automation,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                results.push({ id: automation.id, status: 'updated' });
            }
            else {
                // Create new
                await db.collection('automations').doc(automation.id).set(automation);
                results.push({ id: automation.id, status: 'created' });
            }
        }
        // Log activity
        await logActivity(context.auth.uid, 'AUTOMATIONS_SEEDED', {
            automations: results.map(r => r.id),
            action: 'seeded default automations'
        });
        return {
            success: true,
            message: 'Default automations seeded successfully',
            results
        };
    }
    catch (error) {
        console.error('Error seeding automations:', error);
        throw new functions.https.HttpsError('internal', 'Failed to seed automations');
    }
});
/**
 * getMyAutomationsHTTP - HTTP version with CORS support
 */
const getMyAutomationsHTTP = functions.https.onRequest(async (req, res) => {
    // Note: withCors implementation might be needed if not globally handled
    const cors = require('cors')({ origin: true });
    return cors(req, res, async () => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: 'User profile not found' });
            }
            const userData = userDoc.data();
            if (!userData.isActive) {
                return res.status(403).json({ error: 'User account is disabled' });
            }
            const assignedAutomations = userData.assignedAutomations || [];
            if (assignedAutomations.length === 0) {
                return res.status(200).json({ automations: [], message: 'No automations assigned' });
            }
            const automationsPromises = assignedAutomations.map(async (automationId) => {
                const doc = await db.collection('automations').doc(automationId).get();
                if (doc.exists) {
                    return { id: doc.id, ...doc.data() };
                }
                return null;
            });
            const automations = (await Promise.all(automationsPromises)).filter(a => a !== null);
            return res.status(200).json({ automations });
        }
        catch (error) {
            console.error('Error in getMyAutomationsHTTP:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
});
module.exports = {
    createAutomation,
    updateAutomation,
    deleteAutomation,
    getAllAutomations,
    ensureLeadFinderAutomation,
    getMyAutomations,
    seedDefaultAutomations,
    getMyAutomationsHTTP
};
//# sourceMappingURL=automations.js.map