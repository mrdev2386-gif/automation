/**
 * Client Service
 * Manages client/tenant operations for multi-tenant system
 * 
 * Each client represents a business (restaurant, hotel, SaaS company, etc.)
 * that uses the WhatsApp automation platform.
 */

const { getFirestore, admin } = require('../config/firebase');

/**
 * Get client by ID
 * @param {string} clientId - Client ID
 * @returns {Promise<Object|null>} - Client data or null
 */
const getClientById = async (clientId) => {
    try {
        const db = getFirestore();
        const doc = await db.collection('clients').doc(clientId).get();
        
        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Error getting client by ID:', error);
        throw error;
    }
};

/**
 * Get client by WhatsApp Phone Number ID
 * @param {string} phoneNumberId - WhatsApp Phone Number ID
 * @returns {Promise<Object|null>} - Client data or null
 */
const getClientByPhoneNumberId = async (phoneNumberId) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('clients')
            .where('whatsappNumberId', '==', phoneNumberId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        const clientData = doc.data();
        
        // Add default industryType if missing (backward compatibility)
        if (!clientData.industryType) {
            console.warn(`Client ${doc.id} missing industryType, defaulting to 'saas'`);
            clientData.industryType = 'saas';
        }
        
        return {
            id: doc.id,
            ...clientData
        };
    } catch (error) {
        console.error('Error getting client by phone number ID:', error);
        throw error;
    }
};

/**
 * Get client by WhatsApp Number
 * @param {string} whatsappNumber - WhatsApp number (E.164 format)
 * @returns {Promise<Object|null>} - Client data or null
 */
const getClientByWhatsAppNumber = async (whatsappNumber) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('clients')
            .where('profile.whatsappNumber', '==', whatsappNumber)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Error getting client by WhatsApp number:', error);
        throw error;
    }
};

/**
 * Create a new client
 * @param {Object} clientData - Client data
 * @returns {Promise<string>} - Client ID
 */
const createClient = async (clientData) => {
    try {
        const db = getFirestore();
        
        // Validate required fields
        if (!clientData.industryType) {
            throw new Error('industryType is required');
        }
        
        // Validate industryType is one of allowed values
        const allowedIndustryTypes = ['saas', 'restaurant', 'hotel', 'service'];
        if (!allowedIndustryTypes.includes(clientData.industryType)) {
            throw new Error(`industryType must be one of: ${allowedIndustryTypes.join(', ')}`);
        }
        
        if (!clientData.whatsappNumberId) {
            throw new Error('whatsappNumberId is required');
        }

        // Set default industryType to 'saas' if not provided (though validation above requires it)
        const industryType = clientData.industryType || 'saas';

        // Create client document
        const clientRef = await db.collection('clients').add({
            industryType: industryType,
            whatsappNumberId: clientData.whatsappNumberId,
            profile: {
                name: clientData.name || 'Unnamed Business',
                whatsappNumber: clientData.whatsappNumber || null,
                email: clientData.email || null,
                address: clientData.address || null,
                website: clientData.website || null
            },
            botConfig: {
                botEnabled: clientData.botEnabled ?? true,
                customQuestions: clientData.customQuestions || [],
                greetingMessage: clientData.greetingMessage || null,
                completionMessage: clientData.completionMessage || null
            },
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Client created: ${clientRef.id} with industryType: ${industryType}`);
        return clientRef.id;
    } catch (error) {
        console.error('Error creating client:', error);
        throw error;
    }
};

/**
 * Update client
 * @param {string} clientId - Client ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
const updateClient = async (clientId, updates) => {
    try {
        const db = getFirestore();
        await db.collection('clients').doc(clientId).update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Client ${clientId} updated`);
    } catch (error) {
        console.error('Error updating client:', error);
        throw error;
    }
};

/**
 * Update client bot configuration
 * @param {string} clientId - Client ID
 * @param {Object} botConfig - Bot configuration
 * @returns {Promise<void>}
 */
const updateClientBotConfig = async (clientId, botConfig) => {
    try {
        const db = getFirestore();
        await db.collection('clients').doc(clientId).update({
            botConfig: botConfig,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Client ${clientId} bot config updated`);
    } catch (error) {
        console.error('Error updating client bot config:', error);
        throw error;
    }
};

/**
 * Get all leads for a client
 * @param {string} clientId - Client ID
 * @param {number} limit - Maximum number of leads to return
 * @returns {Promise<Array>} - Array of leads
 */
const getClientLeads = async (clientId, limit = 50) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('clients')
            .doc(clientId)
            .collection('leads')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting client leads:', error);
        throw error;
    }
};

/**
 * Get lead by ID
 * @param {string} clientId - Client ID
 * @param {string} leadId - Lead ID
 * @returns {Promise<Object|null>} - Lead data or null
 */
const getLeadById = async (clientId, leadId) => {
    try {
        const db = getFirestore();
        const doc = await db.collection('clients')
            .doc(clientId)
            .collection('leads')
            .doc(leadId)
            .get();

        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Error getting lead by ID:', error);
        throw error;
    }
};

/**
 * Update lead status
 * @param {string} clientId - Client ID
 * @param {string} leadId - Lead ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
const updateLeadStatus = async (clientId, leadId, status) => {
    try {
        const db = getFirestore();
        await db.collection('clients')
            .doc(clientId)
            .collection('leads')
            .doc(leadId)
            .update({
                status: status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        console.log(`Lead ${leadId} status updated to ${status}`);
    } catch (error) {
        console.error('Error updating lead status:', error);
        throw error;
    }
};

/**
 * Get client statistics
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} - Client statistics
 */
const getClientStats = async (clientId) => {
    try {
        const db = getFirestore();
        
        // Get total leads
        const leadsSnapshot = await db.collection('clients')
            .doc(clientId)
            .collection('leads')
            .get();

        // Get leads from last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentLeadsSnapshot = await db.collection('clients')
            .doc(clientId)
            .collection('leads')
            .where('createdAt', '>', thirtyDaysAgo)
            .get();

        // Get leads that need human handoff
        const humanHandoffSnapshot = await db.collection('leadCaptureStates')
            .where('clientId', '==', clientId)
            .where('needsHuman', '==', true)
            .where('completed', '==', false)
            .get();

        return {
            totalLeads: leadsSnapshot.size,
            leadsLast30Days: recentLeadsSnapshot.size,
            pendingHumanHandoff: humanHandoffSnapshot.size
        };
    } catch (error) {
        console.error('Error getting client stats:', error);
        throw error;
    }
};

module.exports = {
    getClientById,
    getClientByPhoneNumberId,
    getClientByWhatsAppNumber,
    createClient,
    updateClient,
    updateClientBotConfig,
    getClientLeads,
    getLeadById,
    updateLeadStatus,
    getClientStats
};
