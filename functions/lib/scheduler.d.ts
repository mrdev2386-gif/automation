/**
 * cleanupOldLogs - Clean up old activity logs (run daily)
 */
export const cleanupOldLogs: functions.CloudFunction<unknown>;
/**
 * processScheduledMessages - Process scheduled follow-up messages
 */
export const processScheduledMessages: functions.CloudFunction<unknown>;
/**
 * processMessageQueue - Process pending message queue every minute
 */
export const processMessageQueue: functions.CloudFunction<unknown>;
/**
 * cleanupProductionData - Cleanup old data daily
 */
export const cleanupProductionData: functions.CloudFunction<unknown>;
/**
 * detectTimedOutJobs - Scheduled function to detect and mark timed-out jobs
 */
export const detectTimedOutJobs: functions.CloudFunction<unknown>;
/**
 * checkWorkerHealth - Scheduled function to monitor worker health
 */
export const checkWorkerHealth: functions.CloudFunction<unknown>;
/**
 * processLeadFinderQueue - Scheduled worker to process queued campaigns
 */
export const processLeadFinderQueue: functions.CloudFunction<unknown>;
import functions = require("firebase-functions");
//# sourceMappingURL=scheduler.d.ts.map