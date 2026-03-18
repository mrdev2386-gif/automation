/**
 * createUser - Create a new user (super_admin only)
 */
export const createUser: functions.HttpsFunction & functions.Runnable<any>;
/**
 * updateUser - Update user details (super_admin only)
 */
export const updateUser: functions.HttpsFunction & functions.Runnable<any>;
/**
 * deleteUser - Delete a user (super_admin only)
 */
export const deleteUser: functions.HttpsFunction & functions.Runnable<any>;
/**
 * resetUserPassword - Reset user password (super_admin only)
 * Generates a password reset link sent to user's email
 */
export const resetUserPassword: functions.HttpsFunction & functions.Runnable<any>;
/**
 * setCustomUserClaims - Set custom claims for a user (super_admin only)
 */
export const setCustomUserClaims: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getAllUsers - Get all users (super_admin only)
 */
export const getAllUsers: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getUserProfile - Get current user's profile
 */
export const getUserProfile: functions.HttpsFunction & functions.Runnable<any>;
/**
 * getDashboardStats - Get dashboard statistics (super_admin only)
 */
export const getDashboardStats: functions.HttpsFunction & functions.Runnable<any>;
/**
 * generateClientKey - Generate/regenerate clientKey for a user (super_admin only)
 */
export const generateClientKey: functions.HttpsFunction & functions.Runnable<any>;
import functions = require("firebase-functions");
//# sourceMappingURL=users.d.ts.map