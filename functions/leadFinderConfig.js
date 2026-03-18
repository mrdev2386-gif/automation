/**
 * Lead Finder Configuration Functions
 * 100% CRASH-PROOF with full null safety
 * Handles API key storage and configuration retrieval
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * getLeadFinderConfig - Get Lead Finder configuration for current user
 * 100% CRASH-PROOF with full null safety
 * Callable function (NOT HTTP)
 */
const getLeadFinderConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    // ========================================================================
    // GLOBAL TRY-CATCH - CATCH EVERYTHING
    // ========================================================================
    try {
        // ====================================================================
        // ENTRY LOGGING
        // ====================================================================
        console.log('🔥 FUNCTION STARTED: getLeadFinderConfig');
        console.log('📥 INPUT:', JSON.stringify(data || {}, null, 2));
        console.log('👤 USER:', context?.auth?.uid || 'NO AUTH');
        console.log('📧 EMAIL:', context?.auth?.token?.email || 'NO EMAIL');
        console.log('⏰ TIMESTAMP:', new Date().toISOString());
        
        // ====================================================================
        // STEP 1: SAFE AUTH VALIDATION
        // ====================================================================
        console.log('🔐 STEP 1: Validating authentication...');
        
        if (!context || !context.auth || !context.auth.uid) {
            console.error('❌ NO AUTH - User not logged in');
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User not logged in'
            );
        }

        const userId = context.auth.uid;
        console.log('✅ Authentication validated');
        console.log('👤 User ID:', userId);

        // ====================================================================
        // STEP 2: SAFE FIRESTORE READ
        // ====================================================================
        console.log('📦 STEP 2: Reading configuration...');
        
        let configDoc = null;
        
        try {
            configDoc = await db.collection('lead_finder_config').doc(userId).get();
            console.log('   Document read successful');
            console.log('   Document exists:', configDoc?.exists || false);
        } catch (firestoreError) {
            console.error('❌ Firestore read failed:', firestoreError);
            
            // Return safe default instead of crashing
            return {
                success: true,
                leadFinderConfigured: false,
                automationEnabled: false,
                serpApiKeysCount: 0,
                apifyApiKeysCount: 0,
                webhookUrl: '',
                message: 'Unable to read configuration'
            };
        }
        
        // ====================================================================
        // STEP 3: HANDLE MISSING DOCUMENT
        // ====================================================================
        if (!configDoc || !configDoc.exists) {
            console.log('⚠️ No configuration found');
            
            try {
                await db.collection('lead_finder_config').doc(userId).set({
                    serpApiKeys: [],
                    apifyApiKeys: [],
                    enabled: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Default configuration created');
            } catch (createError) {
                console.warn('⚠️ Failed to create default config:', createError?.message);
            }
            
            return {
                success: true,
                leadFinderConfigured: false,
                automationEnabled: false,
                serpApiKeysCount: 0,
                apifyApiKeysCount: 0,
                webhookUrl: '',
                message: 'No configuration found'
            };
        }

        // ====================================================================
        // STEP 4: SAFE DATA PARSING
        // ====================================================================
        console.log('📋 STEP 4: Parsing data...');
        
        const configData = configDoc.data() || {};
        
        let serpApiKeys = [];
        let apifyApiKeys = [];
        
        try {
            serpApiKeys = Array.isArray(configData?.serpApiKeys) ? configData.serpApiKeys : [];
            apifyApiKeys = Array.isArray(configData?.apifyApiKeys) ? configData.apifyApiKeys : [];
        } catch (parseError) {
            console.warn('⚠️ Parse error:', parseError?.message);
            serpApiKeys = [];
            apifyApiKeys = [];
        }
        
        const enabled = configData?.enabled === true;
        const webhookUrl = (configData?.webhook_url || configData?.webhookUrl || '').toString();
        
        const hasSerpApiKeys = Array.isArray(serpApiKeys) && serpApiKeys.length > 0;
        const hasApifyApiKeys = Array.isArray(apifyApiKeys) && apifyApiKeys.length > 0;
        const leadFinderConfigured = hasSerpApiKeys || hasApifyApiKeys;

        // ====================================================================
        // STEP 5: SAFE RESPONSE
        // ====================================================================
        const response = {
            success: true,
            leadFinderConfigured: leadFinderConfigured === true,
            automationEnabled: enabled === true,
            serpApiKeysCount: Number(serpApiKeys.length) || 0,
            apifyApiKeysCount: Number(apifyApiKeys.length) || 0,
            webhookUrl: webhookUrl || '',
            message: leadFinderConfigured ? 'Configuration loaded' : 'API keys not configured'
        };
        
        console.log('✅ Function completed');
        return response;
        
    } catch (error) {
        // ====================================================================
        // GLOBAL ERROR HANDLER
        // ====================================================================
        console.error('❌ CRITICAL ERROR:', error?.message || 'Unknown');
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        if (error?.code === 'permission-denied') {
            throw new functions.https.HttpsError('permission-denied', 'Permission denied');
        }
        
        if (error?.code === 'unavailable') {
            throw new functions.https.HttpsError('unavailable', 'Service unavailable');
        }
        
        throw new functions.https.HttpsError('internal', `Error: ${error?.message || 'Unknown'}`);
    }
});

/**
 * saveLeadFinderAPIKey - Save Lead Finder API keys
 * 100% CRASH-PROOF with full null safety
 */
const saveLeadFinderAPIKey = functions.region("us-central1").https.onCall(async (data, context) => {
    try {
        console.log('🔥 FUNCTION STARTED: saveLeadFinderAPIKey');
        
        if (!context || !context.auth || !context.auth.uid) {
            throw new functions.https.HttpsError('unauthenticated', 'User not logged in');
        }

        const userId = context.auth.uid;
        
        if (!data || typeof data !== 'object') {
            throw new functions.https.HttpsError('invalid-argument', 'No data provided');
        }
        
        let serpApiKeys = [];
        let apifyApiKeys = [];
        
        try {
            serpApiKeys = Array.isArray(data?.serpApiKeys) ? data.serpApiKeys : [];
            apifyApiKeys = Array.isArray(data?.apifyApiKeys) ? data.apifyApiKeys : [];
        } catch (parseError) {
            serpApiKeys = [];
            apifyApiKeys = [];
        }
        
        let cleanedSerpKeys = [];
        let cleanedApifyKeys = [];
        
        try {
            cleanedSerpKeys = serpApiKeys
                .filter(key => key && typeof key === 'string' && key.trim())
                .map(key => key.trim());
                
            cleanedApifyKeys = apifyApiKeys
                .filter(key => key && typeof key === 'string' && key.trim())
                .map(key => key.trim());
        } catch (cleanError) {
            cleanedSerpKeys = [];
            cleanedApifyKeys = [];
        }
        
        try {
            await db.collection('lead_finder_config').doc(userId).set({
                serpApiKeys: cleanedSerpKeys,
                apifyApiKeys: cleanedApifyKeys,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (firestoreError) {
            throw new functions.https.HttpsError('internal', 'Failed to save');
        }

        try {
            await db.collection('activity_logs').add({
                userId,
                action: 'LEAD_FINDER_API_KEYS_SAVED',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (logError) {
            console.warn('⚠️ Log failed:', logError?.message);
        }

        return {
            success: true,
            message: 'API keys saved',
            serpApiKeysCount: Number(cleanedSerpKeys.length) || 0,
            apifyApiKeysCount: Number(cleanedApifyKeys.length) || 0
        };
        
    } catch (error) {
        console.error('❌ ERROR:', error?.message || 'Unknown');
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', `Error: ${error?.message || 'Unknown'}`);
    }
});

module.exports = {
    getLeadFinderConfig,
    saveLeadFinderAPIKey
};
