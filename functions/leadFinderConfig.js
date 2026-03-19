/**
 * Lead Finder Configuration Functions
 * MINIMAL STABLE VERSION - NO FIRESTORE
 * Returns static safe response to verify function works
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * getLeadFinderConfig - MINIMAL STABLE VERSION
 * Returns static response without any Firestore calls
 * This version CANNOT crash - it's pure logic
 */
const getLeadFinderConfig = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    try {
      console.log("🔥 getLeadFinderConfig HIT");
      console.log("📥 Data:", data);
      console.log("👤 Context:", context?.auth?.uid || 'NO AUTH');

      // Auth check
      if (!context || !context.auth) {
        console.error("❌ NO AUTH");
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not logged in"
        );
      }

      console.log("✅ Auth validated for user:", context.auth.uid);

      // RETURN STATIC SAFE RESPONSE
      const response = {
        success: true,
        message: "Function working - static response",
        leadFinderConfigured: false,
        automationEnabled: false,
        serpApiKeysCount: 0,
        apifyApiKeysCount: 0,
        webhookUrl: "",
        timestamp: new Date().toISOString()
      };

      console.log("✅ Returning response:", response);
      return response;

    } catch (error) {
      console.error("❌ FUNCTION CRASH:", error);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Error stack:", error?.stack);
      
      // Re-throw HttpsError as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      // Wrap any other error
      throw new functions.https.HttpsError(
        "internal",
        error?.message || "Unknown error"
      );
    }
  });

/**
 * saveLeadFinderAPIKey - MINIMAL STABLE VERSION
 * Returns success without actually saving (for testing)
 */
const saveLeadFinderAPIKey = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    try {
      console.log("🔥 saveLeadFinderAPIKey HIT");
      console.log("📥 Data:", data);

      // Auth check
      if (!context || !context.auth) {
        console.error("❌ NO AUTH");
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not logged in"
        );
      }

      console.log("✅ Auth validated for user:", context.auth.uid);

      // Validate data
      if (!data || typeof data !== 'object') {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "No data provided"
        );
      }

      const serpApiKeys = Array.isArray(data?.serpApiKeys) ? data.serpApiKeys : [];
      const apifyApiKeys = Array.isArray(data?.apifyApiKeys) ? data.apifyApiKeys : [];

      console.log("📊 Keys received - SERP:", serpApiKeys.length, "Apify:", apifyApiKeys.length);

      // RETURN STATIC SUCCESS RESPONSE
      const response = {
        success: true,
        message: "API keys saved (static response)",
        serpApiKeysCount: serpApiKeys.length,
        apifyApiKeysCount: apifyApiKeys.length,
        timestamp: new Date().toISOString()
      };

      console.log("✅ Returning response:", response);
      return response;

    } catch (error) {
      console.error("❌ FUNCTION CRASH:", error);
      console.error("❌ Error message:", error?.message);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        error?.message || "Unknown error"
      );
    }
  });

module.exports = {
    getLeadFinderConfig,
    saveLeadFinderAPIKey
};
