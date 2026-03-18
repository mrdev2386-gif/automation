/**
 * getFAQs - Get all FAQs for the authenticated client
 */
export const getFAQs: functions.HttpsFunction & functions.Runnable<any>;
/**
 * createFAQ - Create a new FAQ (client_user only)
 */
export const createFAQ: functions.HttpsFunction & functions.Runnable<any>;
/**
 * updateFAQ - Update an existing FAQ (client_user only)
 */
export const updateFAQ: functions.HttpsFunction & functions.Runnable<any>;
/**
 * deleteFAQ - Delete an FAQ (client_user only)
 */
export const deleteFAQ: functions.HttpsFunction & functions.Runnable<any>;
/**
 * rebuildFaqEmbeddings - Rebuild embeddings for all FAQs
 */
export const rebuildFaqEmbeddings: functions.HttpsFunction & functions.Runnable<any>;
/**
 * testFaqMatch - Test FAQ semantic matching
 */
export const testFaqMatch: functions.HttpsFunction & functions.Runnable<any>;
import functions = require("firebase-functions");
//# sourceMappingURL=faqs.d.ts.map