/**
 * startLeadFinderCallable - Callable version for Firebase SDK
 */
declare const startLeadFinderCallable: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getLeadFinderStatusCallable - Get job status
 */
declare const getLeadFinderStatusCallable: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getMyLeadFinderLeadsHTTP - HTTP version with CORS support
 */
declare const getMyLeadFinderLeadsHTTP: functions.HttpsFunction;
/**
 * deleteLeadFinderLeadsCallable - Delete leads
 */
declare const deleteLeadFinderLeadsCallable: functions.HttpsFunction & functions.Runnable<any>;
import functions = require("firebase-functions");
export { startLeadFinderCallable as startLeadFinder, getLeadFinderStatusCallable as getLeadFinderStatus, getMyLeadFinderLeadsHTTP as getMyLeadFinderLeads, deleteLeadFinderLeadsCallable as deleteLeadFinderLeads };
//# sourceMappingURL=leadFinderSimple.d.ts.map