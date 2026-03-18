/**
 * getClientConfig - Get client configuration (client_user or super_admin)
 */
export const getClientConfig: functions.HttpsFunction & functions.Runnable<any>;
/**
 * saveClientConfig - Save client configuration (client_user only)
 */
export const saveClientConfig: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getClientConfigHTTP - HTTP version with CORS support
 */
export const getClientConfigHTTP: functions.HttpsFunction;
/**
 * saveWelcomeConfig - Save welcome message configuration
 */
export const saveWelcomeConfig: functions.HttpsFunction & functions.Runnable<any>;
import functions = require("firebase-functions");
//# sourceMappingURL=clients.d.ts.map