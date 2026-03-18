/**
 * captureLead - HTTP version with CORS support
 * Primary endpoint for external capture forms/webhooks
 */
export const captureLead: functions.HttpsFunction;
/**
 * captureLeadCallable - Callable version of lead capture
 */
export const captureLeadCallable: functions.HttpsFunction & functions.Runnable<any>;
/**
 * uploadLeadsBulk - Bulk upload leads from CSV (super_admin or client_user)
 */
export const uploadLeadsBulk: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getMyLeads - Get leads for the current user
 */
export const getMyLeads: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getLeadEvents - Get timeline events for a lead
 */
export const getLeadEvents: functions.HttpsFunction & functions.Runnable<any>;
/**
 * updateLeadStatus - Update status of a lead
 */
export const updateLeadStatus: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getAllLeads - Get all leads (super_admin only)
 */
export const getAllLeads: functions.HttpsFunction & functions.Runnable<any>;
import functions = require("firebase-functions");
//# sourceMappingURL=leads.d.ts.map