/**
 * processLeadFinder - Firestore trigger
 * Triggers when a new document is created in lead_finder_jobs collection
 * Automatically starts processing the job
 */
export const processLeadFinder: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
import functions = require("firebase-functions");
//# sourceMappingURL=leadFinderTrigger.d.ts.map