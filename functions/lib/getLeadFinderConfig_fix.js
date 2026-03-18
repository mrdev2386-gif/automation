"use strict";
// REPLACEMENT FOR getLeadFinderConfig function
// Replace the test/disabled version in functions/index.js with this production implementation
exports.getLeadFinderConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const uid = context.auth.uid;
        console.log('🔍 getLeadFinderConfig called for user:', uid);
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            console.log('❌ User document not found:', uid);
            return {
                accountActive: false,
                leadFinderConfigured: false,
                toolsAssigned: false,
                serp_api_keys: [],
                apify_api_keys: [],
                api_key: null,
                apify_api_key: null
            };
        }
        const userData = userDoc.data();
        const tools = userData.assignedAutomations || [];
        console.log('✅ User found, tools assigned:', tools);
        const configDoc = await db.collection('lead_finder_config').doc(uid).get();
        const config = configDoc.exists ? configDoc.data() : {};
        console.log('📊 Config loaded:', { hasConfig: configDoc.exists, serpKeysCount: config.serp_api_keys?.length || 0 });
        return {
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
        };
    }
    catch (error) {
        console.error('❌ Error in getLeadFinderConfig:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get configuration: ' + error.message);
    }
});
//# sourceMappingURL=getLeadFinderConfig_fix.js.map