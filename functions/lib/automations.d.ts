/**
 * createAutomation - Create a new automation (super_admin only)
 */
export const createAutomation: functions.HttpsFunction & functions.Runnable<any>;
/**
 * updateAutomation - Update an automation (super_admin only)
 */
export const updateAutomation: functions.HttpsFunction & functions.Runnable<any>;
/**
 * deleteAutomation - Delete an automation (super_admin only)
 */
export const deleteAutomation: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getAllAutomations - Get all automations (super_admin only)
 */
export const getAllAutomations: functions.HttpsFunction & functions.Runnable<any>;
/**
 * ensureLeadFinderAutomation - Ensure Lead Finder automation exists
 * Called on first use to initialize the tool
 */
export const ensureLeadFinderAutomation: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getMyAutomations - Get automations assigned to current user (client_user)
 */
export const getMyAutomations: functions.HttpsFunction & functions.Runnable<any>;
/**
 * seedDefaultAutomations - Create three production automation templates
 */
export const seedDefaultAutomations: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getMyAutomationsHTTP - HTTP version with CORS support
 */
export const getMyAutomationsHTTP: functions.HttpsFunction;
import functions = require("firebase-functions");
//# sourceMappingURL=automations.d.ts.map