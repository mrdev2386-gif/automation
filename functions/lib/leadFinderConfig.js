"use strict";
/**
 * Lead Finder Configuration Functions
 * Handles API key storage and configuration retrieval
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
/**
 * getLeadFinderConfig - Get Lead Finder configuration for current user
 * Callable function (NOT HTTP)
 */
const getLeadFinderConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    console.log('🔍 getLeadFinderConfig called');
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const userId = context.auth.uid;
    console.log('👤 User ID:', userId);
    try {
        // Get user's Lead Finder configuration
        const configDoc = await db.collection('lead_finder_config').doc(userId).get();
        if (!configDoc.exists) {
            console.log('⚠️ No configuration found for user');
            return {
                leadFinderConfigured: false,
                automationEnabled: false,
                message: 'No configuration found'
            };
        }
        const configData = configDoc.data();
        console.log('✅ Configuration found');
        // Check if API keys are configured
        const hasSerpApiKeys = configData.serpApiKeys && configData.serpApiKeys.length > 0;
        const hasApifyApiKeys = configData.apifyApiKeys && configData.apifyApiKeys.length > 0;
        const leadFinderConfigured = hasSerpApiKeys || hasApifyApiKeys;
        return {
            leadFinderConfigured,
            automationEnabled: configData.enabled || false,
            serpApiKeysCount: configData.serpApiKeys?.length || 0,
            apifyApiKeysCount: configData.apifyApiKeys?.length || 0,
            webhookUrl: configData.webhook_url || '',
            message: leadFinderConfigured ? 'Configuration loaded' : 'API keys not configured'
        };
    }
    catch (error) {
        console.error('❌ Error in getLeadFinderConfig:', error);
        console.error('❌ Stack:', error.stack);
        throw new functions.https.HttpsError('internal', `Failed to get configuration: ${error.message}`);
    }
});
/**
 * saveLeadFinderAPIKey - Save Lead Finder API keys
 * Callable function (NOT HTTP)
 */
const saveLeadFinderAPIKey = functions.region("us-central1").https.onCall(async (data, context) => {
    console.log('🔑 saveLeadFinderAPIKey called');
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const userId = context.auth.uid;
    console.log('👤 User ID:', userId);
    console.log('📋 Data received:', JSON.stringify(data));
    try {
        const { serpApiKeys = [], apifyApiKeys = [] } = data;
        // Validate input
        if (!Array.isArray(serpApiKeys) && !Array.isArray(apifyApiKeys)) {
            throw new functions.https.HttpsError('invalid-argument', 'serpApiKeys and apifyApiKeys must be arrays');
        }
        // Save configuration
        const configRef = db.collection('lead_finder_config').doc(userId);
        await configRef.set({
            serpApiKeys: serpApiKeys.filter(key => key && key.trim()),
            apifyApiKeys: apifyApiKeys.filter(key => key && key.trim()),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('✅ API keys saved successfully');
        console.log(`📊 SERP keys: ${serpApiKeys.length}, Apify keys: ${apifyApiKeys.length}`);
        // Log activity
        await db.collection('activity_logs').add({
            userId,
            action: 'LEAD_FINDER_API_KEYS_SAVED',
            metadata: {
                serpApiKeysCount: serpApiKeys.length,
                apifyApiKeysCount: apifyApiKeys.length
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            success: true,
            message: 'API keys saved successfully',
            serpApiKeysCount: serpApiKeys.length,
            apifyApiKeysCount: apifyApiKeys.length
        };
    }
    catch (error) {
        console.error('❌ Error in saveLeadFinderAPIKey:', error);
        console.error('❌ Stack:', error.stack);
        throw new functions.https.HttpsError('internal', `Failed to save API keys: ${error.message}`);
    }
});
module.exports = {
    getLeadFinderConfig,
    saveLeadFinderAPIKey
};
//# sourceMappingURL=leadFinderConfig.js.map