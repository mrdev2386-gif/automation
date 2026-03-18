"use strict";
/**
 * Authentication & Authorization Module
 * Handles token verification, role checking, and rate limiting
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
/**
 * Check if user is super_admin
 */
const isSuperAdmin = async (userId) => {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists)
        return false;
    const userData = userDoc.data();
    return userData.role === 'super_admin' && userData.isActive === true;
};
/**
 * Check if user is active
 */
const isUserActive = async (userId) => {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists)
        return false;
    const userData = userDoc.data();
    return userData.isActive === true;
};
/**
 * Log activity to activity_logs collection
 */
const logActivity = async (userId, action, metadata = {}) => {
    try {
        await db.collection('activity_logs').add({
            userId,
            action,
            metadata,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    catch (error) {
        console.error('Failed to log activity:', error);
    }
};
/**
 * Check rate limiting using Firestore
 */
const checkRateLimit = async (email) => {
    const key = email.toLowerCase();
    const rateLimitRef = db.collection('rate_limits').doc(key);
    const now = Date.now();
    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(rateLimitRef);
            if (!doc.exists) {
                transaction.set(rateLimitRef, {
                    count: 1,
                    firstAttempt: now,
                    expiresAt: new Date(now + RATE_LIMIT_WINDOW)
                });
                return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
            }
            const data = doc.data();
            const { count, firstAttempt } = data;
            if (now - firstAttempt > RATE_LIMIT_WINDOW) {
                transaction.update(rateLimitRef, {
                    count: 1,
                    firstAttempt: now,
                    expiresAt: new Date(now + RATE_LIMIT_WINDOW)
                });
                return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
            }
            if (count >= MAX_LOGIN_ATTEMPTS) {
                return { allowed: false, remaining: 0 };
            }
            transaction.update(rateLimitRef, {
                count: count + 1
            });
            return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - count - 1 };
        });
    }
    catch (error) {
        console.error('Rate limit check error:', error);
        return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS };
    }
};
/**
 * Clean up expired rate limit entries
 */
const cleanupRateLimits = async () => {
    try {
        const expired = await db.collection('rate_limits')
            .where('expiresAt', '<', new Date())
            .get();
        const batch = db.batch();
        expired.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
    catch (error) {
        console.error('Rate limit cleanup error:', error);
    }
};
/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
/**
 * verifyLoginAttempt - Verify login attempt for rate limiting
 */
const verifyLoginAttempt = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!data.email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    }
    const result = await checkRateLimit(data.email);
    if (!result.allowed) {
        await logActivity('anonymous', 'RATE_LIMIT_EXCEEDED', {
            email: data.email
        });
        throw new functions.https.HttpsError('resource-exhausted', 'Too many login attempts. Please try again later.');
    }
    return { allowed: true, remaining: result.remaining };
});
module.exports = {
    isSuperAdmin,
    isUserActive,
    logActivity,
    checkRateLimit,
    cleanupRateLimits,
    isValidEmail,
    verifyLoginAttempt,
    RATE_LIMIT_WINDOW,
    MAX_LOGIN_ATTEMPTS
};
//# sourceMappingURL=auth.js.map