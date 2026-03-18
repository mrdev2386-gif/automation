/**
 * Check if user is super_admin
 */
export function isSuperAdmin(userId: any): Promise<boolean>;
/**
 * Check if user is active
 */
export function isUserActive(userId: any): Promise<boolean>;
/**
 * Log activity to activity_logs collection
 */
export function logActivity(userId: any, action: any, metadata?: {}): Promise<void>;
/**
 * Check rate limiting using Firestore
 */
export function checkRateLimit(email: any): Promise<{
    allowed: boolean;
    remaining: number;
}>;
/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): Promise<void>;
/**
 * Validate email format
 */
export function isValidEmail(email: any): boolean;
/**
 * verifyLoginAttempt - Verify login attempt for rate limiting
 */
export const verifyLoginAttempt: functions.HttpsFunction & functions.Runnable<any>;
export const RATE_LIMIT_WINDOW: number;
export const MAX_LOGIN_ATTEMPTS: 5;
import functions = require("firebase-functions");
//# sourceMappingURL=auth.d.ts.map