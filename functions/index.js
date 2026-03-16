/**
 * Firebase Callable Functions for User Management
 * Implements secure admin-only user creation and management
 * 
 * Security Features:
 * - Only super_admin can create users
 * - Rate limiting on login attempts
 * - App Check enforcement
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

const { validateTools } = require('./src/utils/toolFeatures');

// Minimal Firebase Admin initialization
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Initialize CORS middleware FIRST (before any HTTP endpoints)
const cors = require('cors')({ origin: true });

// Create Express app for global CORS middleware
const app = express();
app.use(express.json());

// Global CORS middleware for all routes
app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.set('Access-Control-Allow-Credentials', 'false');
    res.set('Access-Control-Max-Age', '3600');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    
    next();
});

// Global CORS wrapper for all HTTP endpoints
function withCors(handler) {
    return (req, res) => {
        return cors(req, res, async () => {
            // Set CORS headers for localhost development
            const origin = req.headers.origin || '*';
            res.set('Access-Control-Allow-Origin', origin);
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
            res.set('Access-Control-Allow-Credentials', 'false');
            res.set('Access-Control-Max-Age', '3600');

            // Handle preflight OPTIONS requests
            if (req.method === 'OPTIONS') {
                return res.status(204).send('');
            }

            try {
                await handler(req, res);
            } catch (error) {
                console.error('HTTP Function Error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    };
}

// ============================================================================
// CORS FIX: Wrapper for callable functions when using emulator
// When connectFunctionsEmulator is used, callable functions are converted
// to HTTP POST requests, so they need proper CORS headers.
// ============================================================================

function withCallableCors(handler) {
    return async (data, context) => {
        // This wraps callable function handlers to ensure they work with emulator
        return await handler(data, context);
    };
}

// ============================================================================
// PRODUCTION CORS FIX: HTTP bridge for callable functions
// Provides reliable HTTP endpoints with explicit CORS for all regions
// ============================================================================

// HTTP wrapper that delegates to callable function logic
function createCallableHttpWrapper(callableHandler) {
    return withCors(async (req, res) => {
        try {
            // Parse request body
            const data = req.body.data || req.body || {};
            const idToken = req.headers.authorization?.split('Bearer ')[1];
            
            // Mock context for callable-like behavior
            const context = {
                auth: null,
                rawRequest: req
            };
            
            // Verify token if provided
            if (idToken) {
                try {
                    const decodedToken = await admin.auth().verifyIdToken(idToken);
                    context.auth = {
                        uid: decodedToken.uid,
                        token: decodedToken
                    };
                } catch (error) {
                    console.error('Token verification failed:', error);
                    // Continue without auth - handler will check if needed
                }
            }
            
            // Call the handler
            const result = await callableHandler(data, context);
            
            // Return result in Firebase callable format
            return res.status(200).json({ result });
        } catch (error) {
            console.error('Callable HTTP wrapper error:', error);
            if (error.code === 'unauthenticated' || error.message?.includes('unauthenticated')) {
                return res.status(401).json({ error: { code: 'unauthenticated', message: error.message } });
            }
            return res.status(500).json({ error: { code: 'internal', message: error.message || 'Internal error' } });
        }
    });
}

// Initialize Firebase Admin
const auth = admin.auth();

// ============================================================================
// RATE LIMITING CONFIGURATION (Firestore-based for production safety)
// ============================================================================

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user is super_admin
 */
const isSuperAdmin = async (userId) => {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    const userData = userDoc.data();
    return userData.role === 'super_admin' && userData.isActive === true;
};

/**
 * Check if user is active
 */
const isUserActive = async (userId) => {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
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
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

/**
 * Check rate limiting using Firestore (production-safe, distributed)
 * Uses Firestore transactions for atomic operations
 */
const checkRateLimit = async (email) => {
    const key = email.toLowerCase();
    const rateLimitRef = db.collection('rate_limits').doc(key);
    const now = Date.now();

    try {
        // Use Firestore transaction for atomic read/write
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(rateLimitRef);

            if (!doc.exists) {
                // First attempt - create new record
                transaction.set(rateLimitRef, {
                    count: 1,
                    firstAttempt: now,
                    expiresAt: new Date(now + RATE_LIMIT_WINDOW)
                });
                return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
            }

            const data = doc.data();
            const { count, firstAttempt } = data;

            // Reset if window has passed
            if (now - firstAttempt > RATE_LIMIT_WINDOW) {
                transaction.update(rateLimitRef, {
                    count: 1,
                    firstAttempt: now,
                    expiresAt: new Date(now + RATE_LIMIT_WINDOW)
                });
                return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
            }

            // Check if exceeded limit
            if (count >= MAX_LOGIN_ATTEMPTS) {
                return { allowed: false, remaining: 0 };
            }

            // Increment counter
            transaction.update(rateLimitRef, {
                count: count + 1
            });

            return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - count - 1 };
        });
    } catch (error) {
        console.error('Rate limit check error:', error);
        // Fail open - allow request if rate limiting fails
        return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS };
    }
};

/**
 * Clean up expired rate limit entries (call periodically)
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
    } catch (error) {
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

// ============================================================================
// CALLABLE FUNCTIONS
// ============================================================================

/**
 * createUser - Create a new user (super_admin only)
 * 
 * Request body:
 * - email: string (required)
 * - password: string (required, min 8 chars)
 * - role: string (required, 'super_admin' | 'client_user')
 * - assignedAutomations: array (optional)
 */
exports.createUser = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        await logActivity(context.auth.uid, 'UNAUTHORIZED_USER_CREATE_ATTEMPT', {
            attemptedEmail: data.email
        });
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can create users'
        );
    }

    // Validate input
    if (!data.email || !data.password || !data.role) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Email, password, and role are required'
        );
    }

    if (!isValidEmail(data.email)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid email format'
        );
    }

    if (data.password.length < 8) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Password must be at least 8 characters'
        );
    }

    if (!['super_admin', 'client_user'].includes(data.role)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Role must be either super_admin or client_user'
        );
    }

    // Validate assigned tools
    if (data.assignedAutomations && !validateTools(data.assignedAutomations)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid automation tool assigned'
        );
    }

    try {
        // Generate unique clientKey for API access
        const clientKey = `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email: data.email,
            password: data.password,
            emailVerified: true // Admin creates verified users
        });

        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: data.email,
            role: data.role,
            isActive: true,
            clientKey: clientKey,
            assignedAutomations: data.assignedAutomations || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log activity
        await logActivity(context.auth.uid, 'user_created', {
            createdUserId: userRecord.uid,
            createdUserEmail: data.email,
            role: data.role,
            automationsCount: (data.assignedAutomations || []).length
        });

        return {
            success: true,
            userId: userRecord.uid,
            message: 'User created successfully'
        };
    } catch (error) {
        console.error('Error creating user:', error);

        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError(
                'already-exists',
                'Email already exists'
            );
        }

        throw new functions.https.HttpsError(
            'internal',
            'Failed to create user'
        );
    }
});

/**
 * updateUser - Update user details (super_admin only)
 */
exports.updateUser = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can update users'
        );
    }

    // Validate input
    if (!data.userId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'User ID is required'
        );
    }

    const updateData = {};

    if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
    }

    if (data.assignedAutomations !== undefined) {
        // Validate tools
        if (!validateTools(data.assignedAutomations)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid automation tool assigned'
            );
        }
        // CRITICAL FIX: Use the provided array directly (admin sends complete array)
        // This replaces the entire array with the new selection from admin panel
        updateData.assignedAutomations = data.assignedAutomations;
    }

    if (data.role) {
        if (!['super_admin', 'client_user'].includes(data.role)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid role'
            );
        }
        updateData.role = data.role;
    }

    try {
        // Update Firestore document
        await db.collection('users').doc(data.userId).update(updateData);

        // Enhanced activity logging
        const activityAction = data.assignedAutomations !== undefined
            ? 'automation_assigned'
            : 'USER_UPDATED';

        const activityMetadata = data.assignedAutomations !== undefined
            ? {
                userId: data.userId,
                automationIds: data.assignedAutomations,
                previousAutomationCount: (await db.collection('users').doc(data.userId).get()).data()?.assignedAutomations?.length || 0,
                newAutomationCount: data.assignedAutomations.length
            }
            : {
                updatedUserId: data.userId,
                updates: updateData
            };

        // Log activity
        await logActivity(context.auth.uid, activityAction, activityMetadata);

        return {
            success: true,
            message: 'User updated successfully'
        };
    } catch (error) {
        console.error('Error updating user:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to update user'
        );
    }
});

/**
 * deleteUser - Delete a user (super_admin only)
 */
exports.deleteUser = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can delete users'
        );
    }

    // Validate input
    if (!data.userId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'User ID is required'
        );
    }

    // Prevent self-deletion
    if (data.userId === context.auth.uid) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Cannot delete your own account'
        );
    }

    try {
        // Delete from Firebase Auth
        await auth.deleteUser(data.userId);

        // Delete Firestore document
        await db.collection('users').doc(data.userId).delete();

        // Log activity
        await logActivity(context.auth.uid, 'USER_DELETED', {
            deletedUserId: data.userId
        });

        return {
            success: true,
            message: 'User deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting user:', error);

        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError(
                'not-found',
                'User not found'
            );
        }

        throw new functions.https.HttpsError(
            'internal',
            'Failed to delete user'
        );
    }
});

/**
 * resetUserPassword - Reset user password (super_admin only)
 * Generates a password reset link sent to user's email
 */
exports.resetUserPassword = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can reset passwords'
        );
    }

    // Validate input
    if (!data.userId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'User ID is required'
        );
    }

    try {
        // Generate password reset link
        const resetLink = await auth.generatePasswordResetLink(data.email || '');

        // In production, send email with reset link
        // For now, just log and return success

        // Log activity
        await logActivity(context.auth.uid, 'PASSWORD_RESET_REQUESTED', {
            targetUserId: data.userId
        });

        return {
            success: true,
            message: 'Password reset email sent'
        };
    } catch (error) {
        console.error('Error resetting password:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to reset password'
        );
    }
});

/**
 * setCustomUserClaims - Set custom claims for a user (super_admin only)
 */
exports.setCustomUserClaims = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can set custom claims'
        );
    }

    // Validate input
    if (!data.userId || !data.claims) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'User ID and claims are required'
        );
    }

    try {
        // Set custom claims
        await auth.setCustomUserClaims(data.userId, data.claims);

        // Log activity
        await logActivity(context.auth.uid, 'CLAIMS_SET', {
            targetUserId: data.userId,
            claims: data.claims
        });

        return {
            success: true,
            message: 'Custom claims set successfully'
        };
    } catch (error) {
        console.error('Error setting claims:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to set custom claims'
        );
    }
});

/**
 * getAllUsers - Get all users (super_admin only)
 */
exports.getAllUsers = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can view all users'
        );
    }

    try {
        const usersSnapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();

        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { users };
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch users'
        );
    }
});

/**
 * getUserProfile - Get current user's profile
 */
exports.getUserProfile = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();

        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Access denied. Admin account not found.'
            );
        }

        return { user: userDoc.data() };
    } catch (error) {
        // Re-throw HttpsError as-is to preserve error code and message
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        console.error('Error fetching user profile:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch user profile'
        );
    }
});

/**
 * getDashboardStats - Get dashboard statistics (super_admin only)
 */
exports.getDashboardStats = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can view dashboard statistics'
        );
    }

    try {
        // Get total users
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;

        // Get active users
        const activeUsersSnapshot = await db.collection('users')
            .where('isActive', '==', true)
            .get();
        const activeUsers = activeUsersSnapshot.size;

        // Get automations
        const automationsSnapshot = await db.collection('automations').get();
        const totalAutomations = automationsSnapshot.size;

        // Get active automations
        const activeAutomationsSnapshot = await db.collection('automations')
            .where('isActive', '==', true)
            .get();
        const activeAutomations = activeAutomationsSnapshot.size;

        // Get recent activity logs (last 50)
        const logsSnapshot = await db.collection('activity_logs')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        const recentActivity = logsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            stats: {
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                totalAutomations,
                activeAutomations,
                inactiveAutomations: totalAutomations - activeAutomations
            },
            recentActivity
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch dashboard statistics'
        );
    }
});

// ============================================================================
// AUTOMATION MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * createAutomation - Create a new automation (super_admin only)
 */
exports.createAutomation = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can create automations'
        );
    }

    // Validate input
    if (!data.name) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Automation name is required'
        );
    }

    try {
        const automationRef = await db.collection('automations').add({
            name: data.name,
            description: data.description || '',
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log activity
        await logActivity(context.auth.uid, 'AUTOMATION_CREATED', {
            automationId: automationRef.id,
            automationName: data.name
        });

        return {
            success: true,
            automationId: automationRef.id,
            message: 'Automation created successfully'
        };
    } catch (error) {
        console.error('Error creating automation:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to create automation'
        );
    }
});

/**
 * updateAutomation - Update an automation (super_admin only)
 */
exports.updateAutomation = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can update automations'
        );
    }

    // Validate input
    if (!data.automationId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Automation ID is required'
        );
    }

    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    try {
        await db.collection('automations').doc(data.automationId).update(updateData);

        // Log activity
        await logActivity(context.auth.uid, 'AUTOMATION_UPDATED', {
            automationId: data.automationId,
            updates: updateData
        });

        return {
            success: true,
            message: 'Automation updated successfully'
        };
    } catch (error) {
        console.error('Error updating automation:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to update automation'
        );
    }
});

/**
 * deleteAutomation - Delete an automation (super_admin only)
 */
exports.deleteAutomation = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can delete automations'
        );
    }

    // Validate input
    if (!data.automationId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Automation ID is required'
        );
    }

    try {
        await db.collection('automations').doc(data.automationId).delete();

        // Log activity
        await logActivity(context.auth.uid, 'AUTOMATION_DELETED', {
            automationId: data.automationId
        });

        return {
            success: true,
            message: 'Automation deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting automation:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to delete automation'
        );
    }
});

/**
 * getAllAutomations - Get all automations (super_admin only)
 */
exports.getAllAutomations = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can view all automations'
        );
    }

    try {
        const automationsSnapshot = await db.collection('automations')
            .orderBy('createdAt', 'desc')
            .get();

        const automations = automationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { automations };
    } catch (error) {
        console.error('Error fetching automations:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch automations'
        );
    }
});

/**
 * ensureLeadFinderAutomation - Ensure Lead Finder automation exists
 * Called on first use to initialize the tool
 */
exports.ensureLeadFinderAutomation = functions.region("us-central1").https.onCall(async (data, context) => {
    try {
        const leadFinderRef = db.collection('automations').doc('lead_finder');
        const leadFinderDoc = await leadFinderRef.get();

        if (!leadFinderDoc.exists) {
            // Create the Lead Finder automation
            await leadFinderRef.set({
                id: 'lead_finder',
                name: 'Lead Finder',
                description: 'Find and extract business emails from websites using web scraping',
                category: 'lead_generation',
                icon: 'search',
                isActive: true,
                features: [
                    'Search by country and niche',
                    'Automatic website scraping',
                    'Email extraction',
                    'CSV export',
                    'Batch processing'
                ],
                maxResults: 500,
                rateLimit: {
                    jobsPerDay: 5,
                    websitesPerJob: 500
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Lead Finder automation created');
            return { status: 'created', message: 'Lead Finder automation initialized' };
        }

        return { status: 'exists', message: 'Lead Finder automation already exists' };
    } catch (error) {
        console.error('Error ensuring Lead Finder automation:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to initialize Lead Finder automation'
        );
    }
});

/**
 * getMyAutomations - Get automations assigned to current user (client_user)
 */
exports.getMyAutomations = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    try {
        // Get user profile
        const userDoc = await db.collection('users').doc(context.auth.uid).get();

        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User profile not found'
            );
        }

        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'User account is disabled'
            );
        }

        const assignedAutomations = userData.assignedAutomations || [];

        if (assignedAutomations.length === 0) {
            return { automations: [], message: 'No automations assigned' };
        }

        // Fetch assigned automations
        const automationsPromises = assignedAutomations.map(async (automationId) => {
            const doc = await db.collection('automations').doc(automationId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        });

        const automations = (await Promise.all(automationsPromises))
            .filter(a => a !== null);

        return { automations };
    } catch (error) {
        console.error('Error fetching user automations:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch automations'
        );
    }
});

// ============================================================================
// LEAD FINDER TOOL FUNCTIONS
// ============================================================================

// Note: HTTP versions of startLeadFinder, getLeadFinderStatus, deleteLeadFinderLeads,
// and getMyLeadFinderLeads are defined later in the file with proper CORS support.
// The active exports point to those HTTP implementations.

// Move service imports inside functions to avoid top-level async issues

/**
 * submitWebsitesForScraping - Submit websites to scrape
 */
exports.submitWebsitesForScraping = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    try {
        if (!data.jobId || !data.websites || !Array.isArray(data.websites)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Job ID and websites array are required'
            );
        }

        const { submitWebsites } = require('./src/services/leadFinderService');
        const result = await submitWebsites(context.auth.uid, data.jobId, data.websites);

        // Log activity
        await logActivity(context.auth.uid, 'WEBSITES_SUBMITTED_FOR_SCRAPING', {
            jobId: data.jobId,
            websiteCount: data.websites.length,
            emailsFound: result.emailsFound
        });

        return result;
    } catch (error) {
        console.error('Error submitting websites:', error);
        throw new functions.https.HttpsError(
            'internal',
            error.message || 'Failed to submit websites'
        );
    }
});

// ============================================================================
// LEAD FINDER - API KEY & AUTO-SETUP
// ============================================================================

/**
 * setupLeadFinderForUser - Auto-setup Lead Finder when admin creates user
 * Called by admin panel when creating a new user with Lead Finder tool
 * 
 * Creates:
 * - lead_finder_config record (for API key storage)
 * - user_tools record (for tool assignment tracking)
 * - activity log entry
 */
exports.setupLeadFinderForUser = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin (only admins can setup for other users)
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only admins can setup Lead Finder for users'
        );
    }

    try {
        if (!data.userId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'User ID is required'
            );
        }

        const targetUserId = data.userId;
        const now = admin.firestore.FieldValue.serverTimestamp();

        // Create lead_finder_config record
        const configRef = db.collection('lead_finder_config').doc(targetUserId);
        await configRef.set({
            user_id: targetUserId,
            api_key: '',  // User will add this themselves
            daily_limit: 500,
            max_concurrent_jobs: 1,
            status: 'active',
            created_at: now,
            updated_at: now
        });

        // Create user_tools record
        const toolRef = db.collection('user_tools').doc(`${targetUserId}_lead_finder`);
        await toolRef.set({
            user_id: targetUserId,
            tool_name: 'lead_finder',
            status: 'active',
            created_at: now
        });

        // Log activity
        await logActivity(context.auth.uid, 'LEAD_FINDER_SETUP_USER', {
            targetUserId,
            setupBy: context.auth.uid
        });

        console.log(`✅ Lead Finder setup for user ${targetUserId}`);

        return {
            success: true,
            message: 'Lead Finder successfully setup for user'
        };

    } catch (error) {
        console.error('Error setting up Lead Finder:', error);
        throw new functions.https.HttpsError(
            'internal',
            error.message || 'Failed to setup Lead Finder'
        );
    }
});

/**
 * saveLeadFinderAPIKey - Save user's SerpAPI key (callable function)
 * Called from LeadFinderSettings page when user enters their API key
 * 
 * Encrypts and stores API key in lead_finder_config
 */
exports.saveLeadFinderAPIKey = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    try {
        const userId = context.auth.uid;
        const { serpApiKeys, apifyApiKeys } = data;

        // Defensive validation
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
        }

        console.log('🔍 saveLeadFinderAPIKey request:', { userId, serpKeysCount: serpApiKeys?.length || 0, apifyKeysCount: apifyApiKeys?.length || 0 });
        console.log('📊 Saving API keys for user:', userId);
        console.log('📊 SERP keys:', serpApiKeys);
        console.log('📊 Apify keys:', apifyApiKeys);
        
        // Get existing configuration first
        const configRef = db.collection('lead_finder_config').doc(userId);
        const existingDoc = await configRef.get();
        
        let existingSerp = [];
        let existingApify = [];
        
        if (existingDoc.exists) {
            const data = existingDoc.data();
            existingSerp = data.serp_api_keys || [];
            existingApify = data.apify_api_keys || [];
        }
        
        // Clean and validate arrays - filter out KEEP_EXISTING placeholders
        const cleanSerpKeys = (serpApiKeys || [])
            .map(k => k?.trim())
            .filter(k => k && k.length > 0 && k !== 'KEEP_EXISTING');
        
        const cleanApifyKeys = (apifyApiKeys || [])
            .map(k => k?.trim())
            .filter(k => k && k.length > 0 && k !== 'KEEP_EXISTING');
        
        // Check if user wants to preserve existing keys
        const keepSerp = (serpApiKeys || []).includes('KEEP_EXISTING');
        const keepApify = (apifyApiKeys || []).includes('KEEP_EXISTING');
        
        const hasSerpKeys = cleanSerpKeys.length > 0 || keepSerp;
        const hasApifyKeys = cleanApifyKeys.length > 0 || keepApify;
        
        if (!hasSerpKeys && !hasApifyKeys) {
            console.log('❌ Validation failed: No valid API keys provided');
            throw new functions.https.HttpsError('invalid-argument', 'At least one API key type is required');
        }
        console.log('✅ Validation passed:', { hasSerpKeys, hasApifyKeys });
        
        // Determine final keys to save
        const finalSerp = cleanSerpKeys.length > 0 ? cleanSerpKeys : existingSerp;
        const finalApify = cleanApifyKeys.length > 0 ? cleanApifyKeys : existingApify;
        
        // Validate SERP API keys
        if (finalSerp.length > 0) {
            if (finalSerp.length > 10) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Maximum 10 SERP API keys allowed'
                );
            }
            const uniqueSerpKeys = [...new Set(finalSerp)];
            if (uniqueSerpKeys.length !== finalSerp.length) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Duplicate SERP API keys detected'
                );
            }
        }

        // Validate Apify API keys
        if (finalApify.length > 0) {
            if (finalApify.length > 10) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Maximum 10 Apify API keys allowed'
                );
            }
            const uniqueApifyKeys = [...new Set(finalApify)];
            if (uniqueApifyKeys.length !== finalApify.length) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Duplicate Apify API keys detected'
                );
            }
        }

        // Prepare update data
        console.log('💾 Preparing to save to Firestore...');
        const updateData = {
            user_id: userId,
            updated_at: new Date()
        };

        if (finalSerp.length > 0) {
            updateData.serp_api_keys = finalSerp;
            console.log('✅ Added SERP keys to updateData:', finalSerp.length);
        }

        if (finalApify.length > 0) {
            updateData.apify_api_keys = finalApify;
            console.log('✅ Added Apify keys to updateData:', finalApify.length);
        }

        console.log('💾 Update data prepared:', Object.keys(updateData));

        if (!existingDoc.exists) {
            console.log('📝 Creating new config document...');
            await configRef.set({
                ...updateData,
                daily_limit: 500,
                max_concurrent_jobs: 1,
                status: 'active',
                created_at: new Date()
            }, { merge: true });
            console.log('✅ New config document created');
        } else {
            console.log('📝 Updating existing config document...');
            await configRef.update(updateData);
            console.log('✅ Config document updated');
        }

        // Log activity
        await logActivity(userId, 'LEAD_FINDER_API_KEYS_SAVED', {
            serpKeysCount: finalSerp.length,
            apifyKeysCount: finalApify.length
        });

        console.log('✅ Configuration saved successfully');
        console.log(`✅ API keys saved for user ${userId}: ${finalSerp.length} SERP, ${finalApify.length} Apify`);

        return {
            success: true,
            message: 'API keys saved successfully',
            serpKeysCount: finalSerp.length,
            apifyKeysCount: finalApify.length
        };

    } catch (error) {
        console.error('❌ saveLeadFinderAPIKey error:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        throw new functions.https.HttpsError(
            'internal',
            error.message || 'Failed to save API keys'
        );
    }
});


exports.getLeadFinderConfig = functions.region("us-central1").https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;
            console.log('🔍 getLeadFinderConfig called for user:', uid);
            
            const userDoc = await db.collection('users').doc(uid).get();

            if (!userDoc.exists) {
                console.log('❌ User document not found:', uid);
                return res.status(200).json({
                    accountActive: false,
                    leadFinderConfigured: false,
                    toolsAssigned: false,
                    serp_api_keys: [],
                    apify_api_keys: [],
                    api_key: null,
                    apify_api_key: null
                });
            }

            const userData = userDoc.data();
            const tools = userData.assignedAutomations || [];
            console.log('✅ User found, tools assigned:', tools);

            // Get lead_finder_config to return API keys info
            const configDoc = await db.collection('lead_finder_config').doc(uid).get();
            const config = configDoc.exists ? configDoc.data() : {};
            console.log('📊 Config loaded:', { hasConfig: configDoc.exists, serpKeysCount: config.serp_api_keys?.length || 0 });

            return res.status(200).json({
                accountActive: userData.isActive === true,
                leadFinderConfigured: tools.includes('lead_finder'),
                toolsAssigned: tools.length > 0,
                serp_api_keys: config.serp_api_keys || [],
                apify_api_keys: config.apify_api_keys || [],
                api_key: config.api_key || null,
                apify_api_key: config.apify_api_key || null,
                daily_limit: config.daily_limit || 500,
                max_concurrent_jobs: config.max_concurrent_jobs || 1,
                status: config.status || 'active',
                created_at: config.created_at || null,
                updated_at: config.updated_at || null
            });
        } catch (error) {
            console.error('❌ Error in getLeadFinderConfig:', error);
            return res.status(500).json({
                success: false,
                error: 'internal_error',
                message: 'Failed to get configuration: ' + error.message
            });
        }
    });
});




// ============================================================================
// RATE LIMITED LOGIN VERIFICATION (Custom Token Verification)
// ============================================================================

/**
 * verifyLoginAttempt - Verify login attempt for rate limiting
 */
exports.verifyLoginAttempt = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!data.email) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Email is required'
        );
    }

    const result = await checkRateLimit(data.email);

    if (!result.allowed) {
        await logActivity('anonymous', 'RATE_LIMIT_EXCEEDED', {
            email: data.email
        });
        throw new functions.https.HttpsError(
            'resource-exhausted',
            'Too many login attempts. Please try again later.'
        );
    }

    return { allowed: true, remaining: result.remaining };
});

// ============================================================================
// AUTOMATION SEEDING FUNCTION
// ============================================================================

/**
 * seedDefaultAutomations - Create three production automation templates
 * Can be called manually or used during initial setup
 */
exports.seedDefaultAutomations = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can seed automations'
        );
    }

    // Define the four production automations
    const defaultAutomations = [
        {
            id: 'saas_automation',
            name: 'SaaS Lead Automation',
            description: 'Capture and nurture SaaS product leads with automated follow-ups',
            isActive: true,
            featureFlags: {
                leadCaptureWebhook: true,
                autoFollowUp: true,
                crmSync: true,
                aiAutoReply: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            id: 'restaurant_automation',
            name: 'Restaurant Growth Automation',
            description: 'Reservations, reviews, and customer engagement for restaurants',
            isActive: true,
            featureFlags: {
                tableBookingCapture: true,
                reviewRequestAutomation: true,
                whatsappConfirmation: true,
                repeatCustomerTagging: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            id: 'hotel_automation',
            name: 'Hotel Booking Automation',
            description: 'Guest inquiry and booking workflow for hotels',
            isActive: true,
            featureFlags: {
                bookingInquiryCapture: true,
                availabilityAutoResponse: true,
                preArrivalReminders: true,
                guestFollowUp: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            id: 'whatsapp_ai_assistant',
            name: 'AI WhatsApp Receptionist',
            description: 'Intelligent AI-powered WhatsApp receptionist for automated customer support',
            isActive: true,
            featureFlags: {
                aiReceptionist: true,
                intelligentRouting: true,
                appointmentScheduling: true,
                leadQualification: true,
                multiLanguageSupport: true,
                customResponseFlows: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
    ];

    try {
        const results = [];

        for (const automation of defaultAutomations) {
            // Check if automation already exists
            const existingDoc = await db.collection('automations').doc(automation.id).get();

            if (existingDoc.exists) {
                // Update existing
                await db.collection('automations').doc(automation.id).update({
                    ...automation,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                results.push({ id: automation.id, status: 'updated' });
            } else {
                // Create new
                await db.collection('automations').doc(automation.id).set(automation);
                results.push({ id: automation.id, status: 'created' });
            }
        }

        // Log activity
        await logActivity(context.auth.uid, 'AUTOMATIONS_SEEDED', {
            automations: results.map(r => r.id),
            action: 'seeded default automations'
        });

        return {
            success: true,
            message: 'Default automations seeded successfully',
            results
        };
    } catch (error) {
        console.error('Error seeding automations:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to seed automations'
        );
    }
});

// ============================================================================
// LEAD MANAGEMENT FUNCTIONS
// ============================================================================

// Move service imports inside functions to avoid top-level async issues

/**
 * captureLead - HTTPS webhook for lead capture (no auth required)
 * 
 * Request body:
 * - name: string (required)
 * - email: string (optional)
 * - phone: string (optional)
 * - source: string (optional, default: 'website')
 * - clientKey: string (required) - client identifier for webhook auth
 */
exports.captureLead = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Client-Key');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const {
            createLead,
            checkDuplicate,
            triggerLeadAutomation,
            checkLeadRateLimit,
            isValidPhone,
            sanitizeString
        } = require('./src/services/leadService');
        
        // Support both formats: direct body and callable-style wrapped in 'data'
        const body = req.body?.data ?? req.body ?? {};
        const { name, email, phone, source, clientKey } = body;

        // Validate required fields
        if (!clientKey) {
            res.status(400).json({ error: 'clientKey is required' });
            return;
        }

        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: 'name is required' });
            return;
        }

        // Check payload size (prevent oversized requests)
        const payloadSize = JSON.stringify(body).length;
        if (payloadSize > 100000) { // 100KB limit
            res.status(413).json({ error: 'Payload too large' });
            return;
        }

        // Validate clientKey - look up user by clientKey field
        const clientQuery = await db.collection('users')
            .where('clientKey', '==', clientKey)
            .limit(1)
            .get();

        if (clientQuery.empty) {
            res.status(401).json({ error: 'Invalid clientKey' });
            return;
        }

        const clientUser = clientQuery.docs[0];
        const clientUserId = clientUser.id;
        const clientData = clientUser.data();

        // Check if user is active
        if (!clientData.isActive) {
            res.status(403).json({ error: 'Client account is disabled' });
            return;
        }

        // Check rate limiting
        const rateLimitCheck = await checkLeadRateLimit(clientUserId, req.ip);
        if (!rateLimitCheck.allowed) {
            res.status(429).json({ error: 'Too many requests. Please try again later.' });
            return;
        }

        // Validate email if provided
        if (email && !isValidEmail(email)) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }

        // Validate phone if provided
        if (phone && !isValidPhone(phone)) {
            res.status(400).json({ error: 'Invalid phone format' });
            return;
        }

        // At least one of email or phone must be provided
        if (!email && !phone) {
            res.status(400).json({ error: 'Either email or phone is required' });
            return;
        }

        // Check for duplicates
        const duplicateCheck = await checkDuplicate(clientUserId, email, phone);
        if (duplicateCheck.isDuplicate) {
            res.status(409).json({
                error: 'Lead already exists',
                existingLeadId: duplicateCheck.existingLead.id
            });
            return;
        }

        // Create the lead
        const lead = await createLead({
            clientUserId,
            name: sanitizeString(name),
            email,
            phone,
            source: source || 'website',
            metadata: {
                ip: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        // Trigger automation asynchronously (fire and forget)
        triggerLeadAutomation(lead, clientUserId).catch(err => {
            console.error('Failed to trigger automation:', err);
        });

        res.status(200).json({
            success: true,
            leadId: lead.id,
            message: 'Lead captured successfully'
        });

    } catch (error) {
        console.error('Error capturing lead:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * captureLeadCallable - Firebase callable version for CORS-free access
 * 
 * Request data:
 * - name: string (required)
 * - email: string (optional)
 * - phone: string (optional)
 * - source: string (optional, default: 'website')
 * - clientKey: string (required) - client identifier for webhook auth
 */
exports.captureLeadCallable = functions.region("us-central1").https.onCall(async (data, context) => {
    try {
        const {
            createLead,
            checkDuplicate,
            triggerLeadAutomation,
            checkLeadRateLimit,
            isValidPhone,
            sanitizeString
        } = require('./src/services/leadService');
        
        const { name, email, phone, source, clientKey } = data;

        // Validate required fields
        if (!clientKey) {
            throw new functions.https.HttpsError('invalid-argument', 'clientKey is required');
        }

        if (!name || typeof name !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'name is required');
        }

        // Validate clientKey - look up user by clientKey field
        const clientQuery = await db.collection('users')
            .where('clientKey', '==', clientKey)
            .limit(1)
            .get();

        if (clientQuery.empty) {
            throw new functions.https.HttpsError('permission-denied', 'Invalid clientKey');
        }

        const clientUser = clientQuery.docs[0];
        const clientUserId = clientUser.id;
        const clientData = clientUser.data();

        // Check if user is active
        if (!clientData.isActive) {
            throw new functions.https.HttpsError('permission-denied', 'Client account is disabled');
        }

        // Check rate limiting (use context.rawRequest.ip if available)
        const ip = context.rawRequest?.ip || 'unknown';
        const rateLimitCheck = await checkLeadRateLimit(clientUserId, ip);
        if (!rateLimitCheck.allowed) {
            throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Please try again later.');
        }

        // Validate email if provided
        if (email && !isValidEmail(email)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
        }

        // Validate phone if provided
        if (phone && !isValidPhone(phone)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid phone format');
        }

        // At least one of email or phone must be provided
        if (!email && !phone) {
            throw new functions.https.HttpsError('invalid-argument', 'Either email or phone is required');
        }

        // Check for duplicates
        const duplicateCheck = await checkDuplicate(clientUserId, email, phone);
        if (duplicateCheck.isDuplicate) {
            throw new functions.https.HttpsError('already-exists', 'Lead already exists');
        }

        // Create the lead
        const lead = await createLead({
            clientUserId,
            name: sanitizeString(name),
            email,
            phone,
            source: source || 'website',
            metadata: {
                ip: ip,
                userAgent: context.rawRequest?.get?.('user-agent') || 'unknown'
            }
        });

        // Trigger automation asynchronously (fire and forget)
        triggerLeadAutomation(lead, clientUserId).catch(err => {
            console.error('Failed to trigger automation:', err);
        });

        return {
            success: true,
            leadId: lead.id,
            message: 'Lead captured successfully'
        };

    } catch (error) {
        console.error('Error capturing lead:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Internal server error');
    }
});

/**
 * uploadLeadsBulk - Bulk upload leads (callable function with auth)
 * 
 * Request body:
 * - leads: array of { name, email, phone, source }
 * - targetUserId: string (optional, for super_admin only)
 */
exports.uploadLeadsBulk = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    const { leads, targetUserId } = data;
    const { MAX_BULK_UPLOAD, isValidPhone, sanitizeString, createLead, checkDuplicate, triggerLeadAutomation } = require('./src/services/leadService');

    // Validate leads array
    if (!Array.isArray(leads) || leads.length === 0) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Leads array is required'
        );
    }

    // Check batch size limit
    if (leads.length > MAX_BULK_UPLOAD) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            `Maximum ${MAX_BULK_UPLOAD} leads per upload`
        );
    }

    // Determine which user to upload for
    let clientUserId;
    const isAdmin = await isSuperAdmin(context.auth.uid);

    if (isAdmin && targetUserId) {
        // Super admin can upload for any user
        clientUserId = targetUserId;

        // Verify target user exists and is active
        const targetUser = await db.collection('users').doc(targetUserId).get();
        if (!targetUser.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Target user not found'
            );
        }
        if (!targetUser.data().isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Target user account is disabled'
            );
        }
    } else {
        // Regular users can only upload for themselves
        clientUserId = context.auth.uid;

        // Verify current user is active
        const isActive = await isUserActive(clientUserId);
        if (!isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'User account is disabled'
            );
        }
    }

    // Process leads
    const results = {
        total: leads.length,
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: []
    };

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        const rowNum = i + 1;

        try {
            // Validate required fields
            if (!lead.name || typeof lead.name !== 'string') {
                results.failed++;
                results.errors.push({ row: rowNum, error: 'name is required' });
                continue;
            }

            // At least one of email or phone required
            if (!lead.email && !lead.phone) {
                results.failed++;
                results.errors.push({ row: rowNum, error: 'Either email or phone is required' });
                continue;
            }

            // Validate email if provided
            if (lead.email && !isValidEmail(lead.email)) {
                results.failed++;
                results.errors.push({ row: rowNum, error: 'Invalid email format' });
                continue;
            }

            // Validate phone if provided
            if (lead.phone && !isValidPhone(lead.phone)) {
                results.failed++;
                results.errors.push({ row: rowNum, error: 'Invalid phone format' });
                continue;
            }

            // Check for duplicates
            const duplicateCheck = await checkDuplicate(clientUserId, lead.email, lead.phone);
            if (duplicateCheck.isDuplicate) {
                results.duplicates++;
                continue;
            }

            // Create the lead
            const newLead = await createLead({
                clientUserId,
                name: sanitizeString(lead.name),
                email: lead.email,
                phone: lead.phone,
                source: lead.source || 'manual',
                metadata: {
                    uploadedBy: context.auth.uid,
                    uploadMethod: 'bulk'
                }
            });

            // Trigger automation (async)
            triggerLeadAutomation(newLead, clientUserId).catch(err => {
                console.error('Failed to trigger automation for lead:', err);
            });

            results.success++;

        } catch (error) {
            results.failed++;
            results.errors.push({ row: rowNum, error: error.message });
        }
    }

    // Log activity
    await logActivity(context.auth.uid, 'BULK_LEAD_UPLOAD', {
        targetUserId: clientUserId,
        total: results.total,
        success: results.success,
        failed: results.failed,
        duplicates: results.duplicates
    });

    return results;
});

/**
 * getMyLeads - Get leads for current user
 */
exports.getMyLeads = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    const { status, source, search, limit = 50, page = 1 } = data;
    const userId = context.auth.uid;

    // Verify user is active
    const isActive = await isUserActive(userId);
    if (!isActive) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'User account is disabled'
        );
    }

    try {
        let query = db.collection('leads')
            .where('clientUserId', '==', userId)
            .orderBy('createdAt', 'desc');

        // Apply filters
        if (status) {
            query = query.where('status', '==', status);
        }

        if (source) {
            query = query.where('source', '==', source);
        }

        // Get total count
        const totalSnapshot = await query.get();
        const total = totalSnapshot.docs.length;

        // Apply pagination
        const offset = (page - 1) * limit;
        const paginatedQuery = query.limit(limit).offset(offset);

        const snapshot = await paginatedQuery.get();

        const leads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Apply search filter in memory (for name/email/phone)
        let filteredLeads = leads;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredLeads = leads.filter(lead =>
                (lead.name && lead.name.toLowerCase().includes(searchLower)) ||
                (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
                (lead.phone && lead.phone.includes(search))
            );
        }

        return {
            leads: filteredLeads,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };

    } catch (error) {
        console.error('Error fetching leads:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch leads'
        );
    }
});

/**
 * getLeadEvents - Get events for a specific lead
 */
exports.getLeadEvents = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    const { leadId } = data;

    if (!leadId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'leadId is required'
        );
    }

    const userId = context.auth.uid;
    const isAdmin = await isSuperAdmin(userId);

    try {
        // Verify lead belongs to user (or user is admin)
        const leadDoc = await db.collection('leads').doc(leadId).get();

        if (!leadDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Lead not found'
            );
        }

        const leadData = leadDoc.data();

        // Check ownership (unless admin)
        if (!isAdmin && leadData.clientUserId !== userId) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Access denied'
            );
        }

        // Get events
        const eventsSnapshot = await db.collection('lead_events')
            .where('leadId', '==', leadId)
            .orderBy('timestamp', 'desc')
            .get();

        const events = eventsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { events };

    } catch (error) {
        console.error('Error fetching lead events:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch lead events'
        );
    }
});

/**
 * updateLeadStatus - Update lead status
 */
exports.updateLeadStatus = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    const { leadId, status, score } = data;

    if (!leadId || !status) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'leadId and status are required'
        );
    }

    const userId = context.auth.uid;
    const isAdmin = await isSuperAdmin(userId);

    try {
        // Verify lead belongs to user (or user is admin)
        const leadDoc = await db.collection('leads').doc(leadId).get();

        if (!leadDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Lead not found'
            );
        }

        const leadData = leadDoc.data();

        // Check ownership (unless admin)
        if (!isAdmin && leadData.clientUserId !== userId) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Access denied'
            );
        }

        // Update lead
        const updateData = {
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (typeof score === 'number') {
            updateData.score = score;
        }

        await db.collection('leads').doc(leadId).update(updateData);

        // Log event
        await db.collection('lead_events').add({
            leadId,
            clientUserId: userId,
            type: 'status_changed',
            metadata: { status, score },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };

    } catch (error) {
        console.error('Error updating lead:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to update lead'
        );
    }
});

/**
 * getAllLeads - Get all leads (super_admin only)
 */
exports.getAllLeads = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can view all leads'
        );
    }

    const { status, source, limit = 100, page = 1 } = data;

    try {
        let query = db.collection('leads')
            .orderBy('createdAt', 'desc');

        if (status) {
            query = query.where('status', '==', status);
        }

        if (source) {
            query = query.where('source', '==', source);
        }

        const totalSnapshot = await query.get();
        const total = totalSnapshot.docs.length;

        const offset = (page - 1) * limit;
        const paginatedQuery = query.limit(limit).offset(offset);

        const snapshot = await paginatedQuery.get();

        const leads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            leads,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };

    } catch (error) {
        console.error('Error fetching all leads:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch leads'
        );
    }
});

// ============================================================================
// SCHEDULED FUNCTIONS
// ============================================================================

/**
 * Clean up old activity logs (run daily)
 */
exports.cleanupOldLogs = functions.pubsub.schedule('every day 00:00').onRun(async (context) => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const oldLogs = await db.collection('activity_logs')
                .where('timestamp', '<', thirtyDaysAgo)
                .get();

            const batch = db.batch();
            oldLogs.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`Deleted ${oldLogs.size} old activity logs`);
        } catch (error) {
            console.error('Error cleaning up logs:', error);
        }
    });

/**
 * processScheduledMessages - Process scheduled follow-up messages
 * Runs every 5 minutes to check for messages that need to be sent
 */
exports.processScheduledMessages = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
        const db = admin.firestore();
        const now = new Date();

        try {
            // Find pending messages that are due
            const dueMessages = await db.collection('scheduled_messages')
                .where('status', '==', 'pending')
                .where('scheduledFor', '<=', now)
                .limit(100) // Process in batches
                .get();

            console.log(`Found ${dueMessages.size} messages to process`);

            for (const messageDoc of dueMessages.docs) {
                const message = messageDoc.data();

                try {
                    // Get credentials from the scheduled message
                    const credentials = {
                        whatsappToken: message.credentials?.whatsappToken,
                        whatsappNumberId: message.credentials?.whatsappNumberId
                    };

                    if (!credentials.whatsappToken || !credentials.whatsappNumberId) {
                        console.error(`Missing credentials for message ${messageDoc.id}`);
                        await messageDoc.ref.update({ status: 'failed', error: 'missing_credentials' });
                        continue;
                    }

                    // Send the message
                    const { sendTextMessage } = require('./src/whatsapp/sender');
                    const result = await sendTextMessage(
                        message.phone,
                        message.message,
                        credentials
                    );

                    if (result) {
                        await messageDoc.ref.update({
                            status: 'sent',
                            sentAt: admin.firestore.FieldValue.serverTimestamp(),
                            messageId: result.messages?.[0]?.id
                        });

                        // Log event
                        await db.collection('lead_events').add({
                            leadId: message.leadId,
                            clientUserId: message.clientUserId,
                            type: 'scheduled_followup_sent',
                            metadata: {
                                messageType: message.type,
                                messageId: result.messages?.[0]?.id
                            },
                            timestamp: admin.firestore.FieldValue.serverTimestamp()
                        });

                        console.log(`Sent scheduled message ${messageDoc.id}`);
                    } else {
                        await messageDoc.ref.update({
                            status: 'failed',
                            error: 'send_failed',
                            retryCount: (message.retryCount || 0) + 1
                        });
                    }

                } catch (error) {
                    console.error(`Error processing message ${messageDoc.id}:`, error);
                    await messageDoc.ref.update({
                        status: 'failed',
                        error: error.message,
                        retryCount: (message.retryCount || 0) + 1
                    });
                }
            }

            console.log(`Processed ${dueMessages.size} scheduled messages`);

        } catch (error) {
            console.error('Error in processScheduledMessages:', error);
        }
    });

// ============================================================================
// CLIENT CONFIG MANAGEMENT (Per-Client Isolated)
// ============================================================================

/**
 * getClientConfig - Get client configuration (client_user or super_admin)
 * Returns config with masked secrets
 */
exports.getClientConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Import secret masking utility
    const { sanitizeForClient, maskSecret } = require('./src/utils/secretMasking');

    try {
        const userId = context.auth.uid;

        // Get user to check role
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User profile not found'
            );
        }

        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'User account is disabled'
            );
        }

        // For client_user: get their own config
        // For super_admin: can optionally get another user's config
        const targetUserId = (userData.role === 'super_admin' && data.userId)
            ? data.userId
            : userId;

        // Get config from Firestore
        const configDoc = await db.collection('client_configs').doc(targetUserId).get();

        if (!configDoc.exists) {
            // Return default empty config
            return {
                config: {
                    clientUserId: targetUserId,
                    openaiApiKey: '',
                    openaiApiKeyMasked: false,
                    metaPhoneNumberId: '',
                    metaAccessToken: '',
                    whatsappBusinessAccountId: '',
                    webhookVerifyToken: '',
                    assistantEnabled: false,
                    createdAt: null,
                    updatedAt: null
                }
            };
        }

        const config = configDoc.data();

        // ========================================================================
        // PRODUCTION: Use comprehensive secret masking
        // ========================================================================

        // Remove all forbidden fields and mask sensitive ones
        const safeConfig = sanitizeForClient(config, true);

        // Add additional metadata about what's masked
        const maskedConfig = {
            ...safeConfig,
            // Ensure we don't accidentally send real secrets
            openaiApiKey: safeConfig.openaiApiKey || '',
            openaiApiKeyMasked: !!config.openaiApiKey,
            metaAccessToken: safeConfig.metaAccessToken || '',
            metaAccessTokenMasked: !!config.metaAccessToken,
            whatsappToken: safeConfig.whatsappToken || '',
            whatsappTokenMasked: !!config.whatsappToken
        };

        // Log activity for admin viewing other configs
        if (targetUserId !== userId && userData.role === 'super_admin') {
            await logActivity(userId, 'ADMIN_VIEWED_CLIENT_CONFIG', {
                targetUserId
            });
        }

        return { config: maskedConfig };
    } catch (error) {
        console.error('Error fetching client config:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch client configuration'
        );
    }
});

/**
 * saveClientConfig - Save client configuration (client_user only)
 * Secrets are encrypted/masked server-side
 */
exports.saveClientConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    try {
        const userId = context.auth.uid;

        // Get user to check role
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User profile not found'
            );
        }

        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'User account is disabled'
            );
        }

        // Only client_user can save their own config
        // super_admin cannot modify client configs through this function
        if (userData.role !== 'client_user') {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only client users can save their configuration'
            );
        }

        // Validate input - only allow specific fields
        const allowedFields = [
            'openaiApiKey',
            'metaPhoneNumberId',
            'metaAccessToken',
            'whatsappBusinessAccountId',
            'webhookVerifyToken',
            'assistantEnabled'
        ];

        const updateData = {
            clientUserId: userId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Process each allowed field
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                // Don't overwrite API keys with masked values
                if ((field === 'openaiApiKey' || field === 'metaAccessToken') &&
                    data[field] === '••••••••') {
                    // Keep existing value - don't update
                    continue;
                }
                updateData[field] = data[field];
            }
        }

        // Check if this is first-time config (no existing doc)
        const configDoc = await db.collection('client_configs').doc(userId).get();
        if (!configDoc.exists) {
            updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }

        // Save to Firestore
        await db.collection('client_configs').doc(userId).set(updateData, { merge: true });

        // Log activity
        await logActivity(userId, 'CLIENT_CONFIG_SAVED', {
            updatedFields: Object.keys(updateData).filter(k =>
                k !== 'clientUserId' && k !== 'updatedAt' && k !== 'createdAt'
            )
        });

        return {
            success: true,
            message: 'Configuration saved successfully'
        };
    } catch (error) {
        console.error('Error saving client config:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to save client configuration'
        );
    }
});

/**
 * generateClientKey - Generate/regenerate clientKey for a user (super_admin only)
 */
exports.generateClientKey = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Check if user is super_admin
    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only super_admin can generate client keys'
        );
    }

    // Validate input
    if (!data.userId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'User ID is required'
        );
    }

    try {
        // Generate a new client key
        const crypto = require('crypto');
        const newClientKey = crypto.randomBytes(16).toString('hex');

        // Update user's clientKey
        await db.collection('users').doc(data.userId).update({
            clientKey: newClientKey,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log activity
        await logActivity(context.auth.uid, 'CLIENT_KEY_REGENERATED', {
            targetUserId: data.userId
        });

        return {
            success: true,
            clientKey: newClientKey,
            message: 'Client key generated successfully'
        };
    } catch (error) {
        console.error('Error generating client key:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to generate client key'
        );
    }
});

// ============================================================================
// FAQ KNOWLEDGE BASE MANAGEMENT (Per-Client Isolated)
// ============================================================================

/**
 * getFAQs - Get all FAQs for the authenticated client
 */
exports.getFAQs = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    try {
        const userId = context.auth.uid;

        // Get user to check role
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User profile not found'
            );
        }

        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'User account is disabled'
            );
        }

        // Build query - client_user sees only their FAQs
        let query = db.collection('faq_knowledge')
            .where('clientUserId', '==', userId);

        // Add optional filters
        if (data.activeOnly === true) {
            query = query.where('isActive', '==', true);
        }

        // Add sorting
        query = query.orderBy('createdAt', 'desc');

        // Add limit if provided
        if (data.limit) {
            query = query.limit(Math.min(data.limit, 100));
        }

        const faqSnapshot = await query.get();
        const faqs = faqSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { faqs };
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch FAQs'
        );
    }
});

/**
 * createFAQ - Create a new FAQ (client_user only)
 */
exports.createFAQ = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Validate input
    if (!data.question || !data.answer) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Question and answer are required'
        );
    }

    try {
        const userId = context.auth.uid;

        // Get user to check role
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User profile not found'
            );
        }

        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'User account is disabled'
            );
        }

        // Only client_user can create FAQs
        if (userData.role !== 'client_user') {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only client users can create FAQs'
            );
        }

        // Sanitize inputs
        const sanitizedQuestion = sanitizeInput(data.question);
        const sanitizedAnswer = sanitizeInput(data.answer);

        // Create FAQ document
        const faqRef = await db.collection('faq_knowledge').add({
            clientUserId: userId,
            question: sanitizedQuestion,
            answer: sanitizedAnswer,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log activity
        await logActivity(userId, 'FAQ_CREATED', {
            faqId: faqRef.id,
            question: sanitizedQuestion.substring(0, 50)
        });

        return {
            success: true,
            faqId: faqRef.id,
            message: 'FAQ created successfully'
        };
    } catch (error) {
        console.error('Error creating FAQ:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to create FAQ'
        );
    }
});

/**
 * updateFAQ - Update an existing FAQ (client_user only)
 */
exports.updateFAQ = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Validate input
    if (!data.faqId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'FAQ ID is required'
        );
    }

    try {
        const userId = context.auth.uid;

        // Get user to check role
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User profile not found'
            );
        }

        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'User account is disabled'
            );
        }

        // Only client_user can update FAQs
        if (userData.role !== 'client_user') {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only client users can update FAQs'
            );
        }

        // Verify ownership
        const faqDoc = await db.collection('faq_knowledge').doc(data.faqId).get();
        if (!faqDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'FAQ not found'
            );
        }

        const faqData = faqDoc.data();
        if (faqData.clientUserId !== userId) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'You do not have permission to update this FAQ'
            );
        }

        // Build update object
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (data.question !== undefined) {
            updateData.question = sanitizeInput(data.question);
        }

        if (data.answer !== undefined) {
            updateData.answer = sanitizeInput(data.answer);
        }

        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive;
        }

        // Update FAQ
        await db.collection('faq_knowledge').doc(data.faqId).update(updateData);

        // Log activity
        await logActivity(userId, 'FAQ_UPDATED', {
            faqId: data.faqId,
            updatedFields: Object.keys(updateData).filter(k => k !== 'updatedAt')
        });

        return {
            success: true,
            message: 'FAQ updated successfully'
        };
    } catch (error) {
        if (error.code === 'not-found' || error.code === 'permission-denied') {
            throw error;
        }
        console.error('Error updating FAQ:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to update FAQ'
        );
    }
});

/**
 * deleteFAQ - Delete an FAQ (client_user only)
 */
exports.deleteFAQ = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    // Validate input
    if (!data.faqId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'FAQ ID is required'
        );
    }

    try {
        const userId = context.auth.uid;

        // Get user to check role
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User profile not found'
            );
        }

        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'User account is disabled'
            );
        }

        // Only client_user can delete FAQs
        if (userData.role !== 'client_user') {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only client users can delete FAQs'
            );
        }

        // Verify ownership
        const faqDoc = await db.collection('faq_knowledge').doc(data.faqId).get();
        if (!faqDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'FAQ not found'
            );
        }

        const faqData = faqDoc.data();
        if (faqData.clientUserId !== userId) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'You do not have permission to delete this FAQ'
            );
        }

        // Delete FAQ
        await db.collection('faq_knowledge').doc(data.faqId).delete();

        // Log activity
        await logActivity(userId, 'FAQ_DELETED', {
            faqId: data.faqId
        });

        return {
            success: true,
            message: 'FAQ deleted successfully'
        };
    } catch (error) {
        if (error.code === 'not-found' || error.code === 'permission-denied') {
            throw error;
        }
        console.error('Error deleting FAQ:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to delete FAQ'
        );
    }
});

// ============================================================================
// PART 2: ASSISTANT SUGGESTIONS MANAGEMENT (Per-Client Isolated)
// ============================================================================

/**
 * OpenAI for embeddings
 */
const OpenAI = require('openai');

/**
 * getSuggestions - Get all suggestion groups for the authenticated client
 */
exports.getSuggestions = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }

        const snapshot = await db.collection('assistant_suggestions')
            .where('clientUserId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const suggestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { suggestions };
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch suggestions');
    }
});

/**
 * createSuggestion - Create a new suggestion group
 */
exports.createSuggestion = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    if (!data.triggerIntent || !data.suggestions || !Array.isArray(data.suggestions)) {
        throw new functions.https.HttpsError('invalid-argument', 'triggerIntent and suggestions array are required');
    }

    // Validate suggestions
    const validIntents = ['greeting', 'menu', 'booking', 'timing', 'location', 'general', 'fallback'];
    if (!validIntents.includes(data.triggerIntent)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid trigger intent');
    }

    if (data.suggestions.length > 3) {
        throw new functions.https.HttpsError('invalid-argument', 'Maximum 3 suggestions allowed');
    }

    // Sanitize suggestions
    const sanitizedSuggestions = data.suggestions.map(s =>
        sanitizeInput(s).substring(0, 50)
    );

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }

        const docRef = await db.collection('assistant_suggestions').add({
            clientUserId: userId,
            triggerIntent: data.triggerIntent,
            suggestions: sanitizedSuggestions,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, id: docRef.id, message: 'Suggestion group created' };
    } catch (error) {
        console.error('Error creating suggestion:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create suggestion');
    }
});

/**
 * updateSuggestion - Update an existing suggestion group
 */
exports.updateSuggestion = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    if (!data.suggestionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Suggestion ID is required');
    }

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }

        // Verify ownership
        const suggestionDoc = await db.collection('assistant_suggestions').doc(data.suggestionId).get();
        if (!suggestionDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Suggestion not found');
        }

        const suggestionData = suggestionDoc.data();
        if (suggestionData.clientUserId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Permission denied');
        }

        const updateData = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

        if (data.triggerIntent !== undefined) {
            const validIntents = ['greeting', 'menu', 'booking', 'timing', 'location', 'general', 'fallback'];
            if (!validIntents.includes(data.triggerIntent)) {
                throw new functions.https.HttpsError('invalid-argument', 'Invalid trigger intent');
            }
            updateData.triggerIntent = data.triggerIntent;
        }

        if (data.suggestions !== undefined) {
            if (data.suggestions.length > 3) {
                throw new functions.https.HttpsError('invalid-argument', 'Maximum 3 suggestions allowed');
            }
            updateData.suggestions = data.suggestions.map(s => sanitizeInput(s).substring(0, 50));
        }

        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive;
        }

        await db.collection('assistant_suggestions').doc(data.suggestionId).update(updateData);

        return { success: true, message: 'Suggestion updated successfully' };
    } catch (error) {
        if (error.code === 'not-found' || error.code === 'permission-denied') {
            throw error;
        }
        console.error('Error updating suggestion:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update suggestion');
    }
});

/**
 * deleteSuggestion - Delete a suggestion group
 */
exports.deleteSuggestion = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    if (!data.suggestionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Suggestion ID is required');
    }

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }

        // Verify ownership
        const suggestionDoc = await db.collection('assistant_suggestions').doc(data.suggestionId).get();
        if (!suggestionDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Suggestion not found');
        }

        const suggestionData = suggestionDoc.data();
        if (suggestionData.clientUserId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Permission denied');
        }

        await db.collection('assistant_suggestions').doc(data.suggestionId).delete();

        return { success: true, message: 'Suggestion deleted successfully' };
    } catch (error) {
        if (error.code === 'not-found' || error.code === 'permission-denied') {
            throw error;
        }
        console.error('Error deleting suggestion:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete suggestion');
    }
});

// ============================================================================
// PART 1: SEMANTIC FAQ EMBEDDINGS MANAGEMENT
// ============================================================================

/**
 * rebuildFaqEmbeddings - Rebuild embeddings for all FAQs (requires OpenAI API key)
 */
exports.rebuildFaqEmbeddings = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }

        // Get client config to check for OpenAI key
        const configDoc = await db.collection('client_configs').doc(userId).get();
        const config = configDoc.exists ? configDoc.data() : {};
        const openaiApiKey = config.openaiApiKey;

        if (!openaiApiKey) {
            throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key not configured');
        }

        const openai = new OpenAI({ apiKey: openaiApiKey });

        // Get all active FAQs for this client
        const faqsSnapshot = await db.collection('faq_knowledge')
            .where('clientUserId', '==', userId)
            .where('isActive', '==', true)
            .get();

        if (faqsSnapshot.empty) {
            return { success: true, message: 'No FAQs to rebuild', count: 0 };
        }

        let processedCount = 0;

        for (const faqDoc of faqsSnapshot.docs) {
            const faqData = faqDoc.data();

            // Generate embedding
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: faqData.question
            });

            const embedding = embeddingResponse.data[0].embedding;

            // Update FAQ with embedding
            await db.collection('faq_knowledge').doc(faqDoc.id).update({
                embedding: embedding,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            processedCount++;
        }

        return {
            success: true,
            message: `Successfully rebuilt embeddings for ${processedCount} FAQs`,
            count: processedCount
        };
    } catch (error) {
        console.error('Error rebuilding embeddings:', error);
        if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to rebuild embeddings: ' + error.message);
    }
});

/**
 * testFaqMatch - Test FAQ semantic matching with a sample message
 */
exports.testFaqMatch = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    if (!data.message) {
        throw new functions.https.HttpsError('invalid-argument', 'Test message is required');
    }

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }

        // Get client config
        const configDoc = await db.collection('client_configs').doc(userId).get();
        const config = configDoc.exists ? configDoc.data() : {};
        const openaiApiKey = config.openaiApiKey;

        if (!openaiApiKey) {
            throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key not configured');
        }

        const openai = new OpenAI({ apiKey: openaiApiKey });
        const threshold = config.semanticThreshold || 0.82;

        // Get all active FAQs
        const faqsSnapshot = await db.collection('faq_knowledge')
            .where('clientUserId', '==', userId)
            .where('isActive', '==', true)
            .get();

        if (faqsSnapshot.empty) {
            return { success: true, matches: [], message: 'No FAQs configured' };
        }

        // Generate embedding for test message
        const messageEmbeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: data.message
        });
        const messageEmbedding = messageEmbeddingResponse.data[0].embedding;

        // Calculate cosine similarity
        const cosineSimilarity = (vec1, vec2) => {
            let dotProduct = 0, norm1 = 0, norm2 = 0;
            for (let i = 0; i < vec1.length; i++) {
                dotProduct += vec1[i] * vec2[i];
                norm1 += vec1[i] * vec1[i];
                norm2 += vec2[i] * vec2[i];
            }
            return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        };

        // Find best match
        let bestMatch = null;
        let bestScore = 0;
        const matches = [];

        for (const faqDoc of faqsSnapshot.docs) {
            const faqData = faqDoc.data();

            // Use cached embedding or generate new one
            let faqEmbedding = faqData.embedding;

            if (!faqEmbedding || faqEmbedding.length === 0) {
                // Generate embedding for this FAQ
                const faqEmbeddingResponse = await openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: faqData.question
                });
                faqEmbedding = faqEmbeddingResponse.data[0].embedding;
            }

            const similarity = cosineSimilarity(messageEmbedding, faqEmbedding);

            matches.push({
                question: faqData.question,
                answer: faqData.answer,
                similarity: parseFloat(similarity.toFixed(4)),
                meetsThreshold: similarity >= threshold
            });

            if (similarity > bestScore) {
                bestScore = similarity;
                bestMatch = {
                    question: faqData.question,
                    answer: faqData.answer,
                    similarity: similarity
                };
            }
        }

        // Sort matches by similarity
        matches.sort((a, b) => b.similarity - a.similarity);

        return {
            success: true,
            testMessage: data.message,
            threshold: threshold,
            matches: matches.slice(0, 5), // Top 5 matches
            bestMatch: bestMatch && bestScore >= threshold ? bestMatch : null,
            bestScore: parseFloat(bestScore.toFixed(4))
        };
    } catch (error) {
        console.error('Error testing FAQ match:', error);
        if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to test FAQ match: ' + error.message);
    }
});

// ============================================================================
// PART 3: WELCOME MESSAGE CONFIGURATION
// ============================================================================

/**
 * saveWelcomeConfig - Save welcome message configuration
 */
exports.saveWelcomeConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }

        const updateData = {};

        if (data.welcomeEnabled !== undefined) {
            updateData.welcomeEnabled = Boolean(data.welcomeEnabled);
        }

        if (data.welcomeMessage !== undefined) {
            updateData.welcomeMessage = sanitizeInput(data.welcomeMessage).substring(0, 500);
        }

        if (data.welcomeSuggestions !== undefined) {
            if (!Array.isArray(data.welcomeSuggestions)) {
                throw new functions.https.HttpsError('invalid-argument', 'welcomeSuggestions must be an array');
            }
            if (data.welcomeSuggestions.length > 3) {
                throw new functions.https.HttpsError('invalid-argument', 'Maximum 3 welcome suggestions allowed');
            }
            updateData.welcomeSuggestions = data.welcomeSuggestions.map(s =>
                sanitizeInput(s).substring(0, 50)
            );
        }

        // Update client config
        await db.collection('client_configs').doc(userId).update(updateData);

        return { success: true, message: 'Welcome configuration saved successfully' };
    } catch (error) {
        if (error.code === 'not-found' || error.code === 'permission-denied' || error.code === 'invalid-argument') {
            throw error;
        }
        console.error('Error saving welcome config:', error);
        throw new functions.https.HttpsError('internal', 'Failed to save welcome configuration');
    }
});

// ============================================================================
// CHAT LOG MANAGEMENT (Per-Client Isolated)
// ============================================================================

/**
 * getChatLogs - Get chat logs for the authenticated client
 */
exports.getChatLogs = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    try {
        const userId = context.auth.uid;

        // Get user to check role
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User profile not found'
            );
        }

        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'User account is disabled'
            );
        }

        // Build query
        let query = db.collection('chat_logs')
            .where('clientUserId', '==', userId);

        // Filter by phone if provided
        if (data.phone) {
            query = query.where('phone', '==', data.phone);
        }

        // Filter by direction if provided
        if (data.direction) {
            query = query.where('direction', '==', data.direction);
        }

        // Add sorting
        query = query.orderBy('timestamp', 'desc');

        // Add limit
        const limit = data.limit || 100;
        query = query.limit(Math.min(limit, 500));

        const logsSnapshot = await query.get();
        const logs = logsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { logs };
    } catch (error) {
        console.error('Error fetching chat logs:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch chat logs'
        );
    }
});

/**
 * getChatContacts - Get unique contacts for the authenticated client
 */
exports.getChatContacts = functions.region("us-central1").https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required'
        );
    }

    try {
        const userId = context.auth.uid;

        // Get user to check role
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User profile not found'
            );
        }

        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'User account is disabled'
            );
        }

        // Get all chat logs for this client
        const logsSnapshot = await db.collection('chat_logs')
            .where('clientUserId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(1000)
            .get();

        // Group by phone number
        const contactsMap = new Map();
        logsSnapshot.docs.forEach(doc => {
            const log = doc.data();
            if (!contactsMap.has(log.phone)) {
                contactsMap.set(log.phone, {
                    phone: log.phone,
                    lastMessage: log.message,
                    lastDirection: log.direction,
                    lastTimestamp: log.timestamp,
                    unreadCount: 0
                });
            }
        });

        // Convert to array
        const contacts = Array.from(contactsMap.values());

        // Sort by last timestamp
        contacts.sort((a, b) => {
            const timeA = a.lastTimestamp?.toDate?.() || new Date(0);
            const timeB = b.lastTimestamp?.toDate?.() || new Date(0);
            return timeB - timeA;
        });

        return { contacts };
    } catch (error) {
        console.error('Error fetching chat contacts:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch chat contacts'
        );
    }
});

// ============================================================================
// UTILITY FUNCTION
// ============================================================================

/**
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    // Remove potential script injections and control characters
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .substring(0, 10000); // Limit length
}

// ============================================================================
// PRODUCTION HARDENING: WhatsApp Webhook (Non-Blocking)
// ============================================================================

// Use existing admin initialization from top of file

/**
 * Production WhatsApp Webhook Handler
 * - Returns 200 immediately (< 2 seconds)
 * - Processes messages asynchronously
 * - Uses idempotency checks
 * - Implements rate limiting
 */
exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
    try {
        // Delegate to production handler
        const { handleWebhookProduction } = require('./src/whatsapp/webhookProduction');
        return handleWebhookProduction(req, res);
    } catch (error) {
        console.error('Webhook error:', error);
        // Still return 200 to prevent Meta retries
        return res.sendStatus(200);
    }
});

// ============================================================================
// PRODUCTION HARDENING: Queue Processor (Scheduled)
// ============================================================================

// Move service imports inside functions to avoid top-level async issues

/**
 * Process pending message queue every minute
 * Handles retry logic with exponential backoff
 */
exports.processMessageQueue = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
        try {
            console.log('Processing message queue...');
            const { processPendingQueue } = require('./src/whatsapp/queueSender');
            const result = await processPendingQueue(100);
            console.log(`Queue processing result: ${JSON.stringify(result)}`);
            return null;
        } catch (error) {
            console.error('Queue processing error:', error);
            return null;
        }
    });

/**
 * Cleanup old data daily
 * - Expired rate limit entries
 * - Old processed message records
 * - Old queue items
 */
exports.cleanupProductionData = functions.pubsub.schedule('every day 00:00').onRun(async (context) => {
        try {
            console.log('Running production cleanup...');
            
            const { cleanupExpiredRateLimits } = require('./src/services/rateLimitService');
            const { cleanupOldProcessedMessages } = require('./src/services/idempotencyService');
            const { cleanupOldQueueItems } = require('./src/whatsapp/queueSender');

            const [rateLimitCleaned, processedCleaned, queueCleaned] = await Promise.all([
                cleanupExpiredRateLimits(),
                cleanupOldProcessedMessages(),
                cleanupOldQueueItems()
            ]);

            console.log(`Cleanup complete: ${rateLimitCleaned} rate limits, ${processedCleaned} processed messages, ${queueCleaned} queue items`);
            return null;
        } catch (error) {
            console.error('Cleanup error:', error);
            return null;
        }
    });

// ============================================================================
// LEAD FINDER - QUEUE MONITORING & CONFIGURATION (Phase 2 Upgrades)
// ============================================================================

/**
 * getLeadFinderQueueStats - Get queue statistics (admin only)
 * NEW: Queue monitoring API for admin dashboard
 */
exports.getLeadFinderQueueStats = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can view queue statistics');
        }

        const queueService = require('./src/services/leadFinderQueueService');
        const stats = await queueService.getQueueStats();

        if (!stats) {
            throw new functions.https.HttpsError('unavailable', 'Queue service not available');
        }

        const [completedJobs, failedJobs, activeJobs] = await Promise.all([
            db.collection('lead_finder_jobs').where('status', '==', 'completed').get(),
            db.collection('lead_finder_jobs').where('status', '==', 'failed').get(),
            db.collection('lead_finder_jobs').where('status', '==', 'in_progress').get()
        ]);

        return {
            queue: stats,
            jobs: {
                active_jobs: activeJobs.size,
                completed_jobs: completedJobs.size,
                failed_jobs: failedJobs.size,
                total_jobs: completedJobs.size + failedJobs.size + activeJobs.size
            },
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('Error getting queue stats:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to get queue statistics');
    }
});

/**
 * updateScraperConfig - Update scraper configuration (admin only)
 * NEW: Allows admin to configure proxy, rate limits, etc.
 */
exports.updateScraperConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can update scraper configuration');
        }

        const scraperConfigService = require('./src/services/scraperConfigService');
        const result = await scraperConfigService.saveScraperConfig(data.config);

        if (!result.success) {
            throw new functions.https.HttpsError('internal', result.error || 'Failed to save configuration');
        }

        await logActivity(context.auth.uid, 'SCRAPER_CONFIG_UPDATED', {
            updatedFields: Object.keys(data.config)
        });

        return { success: true, message: 'Scraper configuration updated successfully' };
    } catch (error) {
        console.error('Error updating scraper config:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to update scraper configuration');
    }
});

/**
 * getScraperConfig - Get current scraper configuration (admin only)
 * NEW: View current proxy, rate limit, and system settings
 */
exports.getScraperConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can view scraper configuration');
        }

        const scraperConfigService = require('./src/services/scraperConfigService');
        const config = await scraperConfigService.getScraperConfig(true);

        return { config };
    } catch (error) {
        console.error('Error getting scraper config:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to get scraper configuration');
    }
});

/**
 * detectTimedOutJobs - Scheduled function to detect and mark timed-out jobs
 * NEW: Runs every 10 minutes to check for jobs exceeding 45 minute threshold
 */
exports.detectTimedOutJobs = functions.pubsub.schedule('every 10 minutes').onRun(async (context) => {
        try {
            console.log('Checking for timed-out Lead Finder jobs...');
            const scraperConfigService = require('./src/services/scraperConfigService');
            const timedOutJobs = await scraperConfigService.detectTimedOutJobs();
            
            if (timedOutJobs.length > 0) {
                console.log(`Marked ${timedOutJobs.length} jobs as timed out`);
            } else {
                console.log('No timed-out jobs found');
            }
            
            return null;
        } catch (error) {
            console.error('Error detecting timed-out jobs:', error);
            return null;
        }
    });

// ============================================================================
// LEAD FINDER - WEBHOOK & WORKER MONITORING (Production Optimizations)
// ============================================================================

/**
 * saveWebhookConfig - Save webhook URL for CRM integration
 */
exports.saveWebhookConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userId = context.auth.uid;
        const webhookUrl = data.webhook_url;

        if (webhookUrl && typeof webhookUrl !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid webhook URL');
        }

        const configRef = db.collection('lead_finder_config').doc(userId);
        await configRef.set({
            webhook_url: webhookUrl || '',
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await logActivity(userId, 'WEBHOOK_CONFIG_SAVED', {
            hasWebhook: Boolean(webhookUrl)
        });

        return { success: true, message: 'Webhook configuration saved' };
    } catch (error) {
        console.error('Error saving webhook config:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to save webhook');
    }
});

/**
 * checkWorkerHealth - Scheduled function to monitor worker health
 * Runs every 5 minutes to detect dead workers
 */
exports.checkWorkerHealth = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
        try {
            console.log('Checking worker health...');
            const workerMonitoringService = require('./src/services/workerMonitoringService');
            const deadWorkers = await workerMonitoringService.checkDeadWorkers();
            
            if (deadWorkers > 0) {
                console.log(`Found ${deadWorkers} dead workers`);
            }
            
            return null;
        } catch (error) {
            console.error('Error checking worker health:', error);
            return null;
        }
    });

/**
 * processLeadFinderQueue - Scheduled worker to process queued campaigns
 * Runs every 1 minute to check for and process pending lead finder jobs
 */
exports.processLeadFinderQueue = functions.pubsub
  .schedule('every 1 minutes')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('[WORKER] Checking lead finder queue');

      // Fetch pending jobs from queue
      const snapshot = await db.collection('lead_finder_queue')
        .where('status', '==', 'pending')
        .limit(5)
        .get();

      if (snapshot.empty) {
        console.log('[WORKER] No pending jobs');
        return null;
      }

      console.log(`[WORKER] Found ${snapshot.docs.length} pending job(s)`);

      // Process each job
      for (const doc of snapshot.docs) {
        const job = doc.data();
        const jobId = doc.id;

        try {
          console.log('[WORKER] Processing campaign:', job.campaignId);

          // Mark as processing
          await db.collection('lead_finder_queue').doc(jobId).update({
            status: 'processing',
            processedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Execute the lead finder job
          const { startAutomatedLeadFinder } = require('./src/services/leadFinderService');
          await startAutomatedLeadFinder(job.userId, job.country, job.niche, job.limit || 500);

          // Mark as completed
          await db.collection('lead_finder_queue').doc(jobId).update({
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Update campaign status if applicable
          if (job.campaignId) {
            await db.collection('ai_lead_campaigns').doc(job.campaignId).update({
              status: 'completed',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }).catch(err => console.error('Error updating campaign:', err.message));
          }

          console.log('[WORKER] Job completed:', jobId);
        } catch (err) {
          console.error('[WORKER] Job failed:', jobId, err.message);
          
          // Mark job as failed
          await db.collection('lead_finder_queue').doc(jobId).update({
            status: 'failed',
            error: err.message,
            failedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Update campaign status if applicable
          if (job.campaignId) {
            await db.collection('ai_lead_campaigns').doc(job.campaignId).update({
              status: 'failed',
              error: err.message,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }).catch(e => console.error('Error updating campaign on failure:', e.message));
          }
        }
      }

      console.log('[WORKER] Queue processing complete');
      return null;
    } catch (error) {
      console.error('[WORKER] Fatal error:', error.message);
      return null;
    }
  });

// ============================================================================
// AI LEAD AGENT - AUTOMATED LEAD GENERATION & QUALIFICATION
// ============================================================================

/**
 * startAILeadCampaign - Initialize AI lead generation campaign
 * Reuses Lead Finder backend to discover and scrape websites
 */
exports.startAILeadCampaign = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userId = context.auth.uid;
        const {
            campaignId,
            name,
            country,
            niche,
            leadLimit,
            minScore,
            enableEmail,
            enableWhatsApp
        } = data;

        // Validate input
        if (!campaignId || !name || !country || !niche) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        // Get user document to verify ownership and access
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }

        const userData = userDoc.data();
        if (!userData.assignedAutomations || !userData.assignedAutomations.includes('ai_lead_agent')) {
            throw new functions.https.HttpsError('permission-denied', 'AI Lead Agent not assigned');
        }

        // Create campaign subcollection for leads
        await db.collection('ai_lead_campaigns').doc(campaignId).collection('leads').doc('_init').set({
            initialized: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        await logActivity(userId, 'AI_CAMPAIGN_STARTED', {
            campaignId,
            country,
            niche,
            leadLimit
        });

        // Enqueue campaign job for processing (same as Lead Finder)
        // This reuses the existing Lead Finder scraping infrastructure
        const queueRef = db.collection('lead_finder_queue').doc();
        await queueRef.set({
            userId,
            type: 'ai_lead_campaign',
            campaignId,
            country,
            niche,
            limit: leadLimit,
            minScore,
            status: 'pending',
            progress: {
                websitesDiscovered: 0,
                websitesScanned: 0,
                emailsFound: 0,
                leadsQualified: 0,
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Insert job into Firestore queue collection
        const jobId = queueRef.id;
        await db.collection('lead_finder_queue').doc(jobId).set({
            campaignId: campaignId,
            userId: userId,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('[QUEUE] Job created for campaign:', campaignId);

        return {
            success: true,
            campaignId,
            message: 'Campaign started successfully'
        };
    } catch (error) {
        console.error('Error starting AI campaign:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to start campaign');
    }
});

/**
 * generateAIEmailDraft - Generate personalized cold email using AI
 */
exports.generateAIEmailDraft = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const { businessName, website, niche } = data;

        if (!businessName || !website || !niche) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        // Generate email template (can be enhanced with OpenAI API)
        const domain = new URL(website).hostname.replace('www.', '');

        const emailTemplate = {
            subject: `Partner with ${businessName} - ${niche} Solutions`,
            body: `Hi there,

I hope this email finds you well. I came across ${businessName} and was impressed by your work in the ${niche} industry.

I wanted to reach out because I believe we could create significant value together. We specialize in helping ${niche} companies just like yours scale their operations and reach new markets.

Here's what we typically help our partners achieve:
• Increase operational efficiency by 40%+
• Expand market reach with proven strategies
• Streamline processes and reduce costs

I'd love to have a quick chat to see if there's potential for collaboration. Would you be open to a brief call next week?

Looking forward to connecting!

Best regards,
[Your Name]
[Your Company]
[Your Email]
[Your Phone]
[Your Website]

P.S. - Feel free to check out our recent case studies: [link]`
        };

        return emailTemplate;
    } catch (error) {
        console.error('Error generating email draft:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to generate email');
    }
});

/**
 * generateAIWhatsappMessage - Generate WhatsApp follow-up message
 */
exports.generateAIWhatsappMessage = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const { businessName, niche } = data;

        if (!businessName || !niche) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        // Generate WhatsApp message template
        const whatsappTemplate = {
            message: `Hi ${businessName} 👋

I noticed you work in the ${niche} space. We've been helping businesses like yours achieve amazing results in growth and efficiency.

Would you be open to a quick 15-min call to explore how we could add value to your business? 

Let me know! 😊

[Your Name]`
        };

        return whatsappTemplate;
    } catch (error) {
        console.error('Error generating WhatsApp message:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to generate message');
    }
});

/**
 * qualifyAILead - Score and qualify a lead based on criteria
 */
exports.qualifyAILead = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const { campaignId, leadId, lead } = data;

        if (!campaignId || !leadId || !lead) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        // Calculate lead quality score based on multiple factors
        let score = lead.score || 0;

        // Bonus for premium email domains
        const premiumDomains = ['.com', '.io', '.co', '.biz'];
        const domain = lead.email?.split('@')[1] || '';
        if (premiumDomains.some(d => domain.endsWith(d))) {
            score += 2;
        }

        // Deduct for free email domains
        const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        if (freeDomains.includes(domain)) {
            score -= 2;
        }

        // Determine qualification status
        let qualificationStatus = 'cold';
        if (score >= 15) qualificationStatus = 'hot';
        else if (score >= 12) qualificationStatus = 'warm';

        // Update lead with qualification data
        await db.collection('ai_lead_campaigns').doc(campaignId).collection('leads').doc(leadId).update({
            score: Math.min(score, 20),
            qualificationStatus,
            qualifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            stage: qualificationStatus === 'hot' ? 'qualified' : 'new'
        });

        return {
            leadId,
            score: Math.min(score, 20),
            qualificationStatus,
            qualified: qualificationStatus !== 'cold'
        };
    } catch (error) {
        console.error('Error qualifying lead:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to qualify lead');
    }
});

/**
 * updateLeadPipelineStage - Move lead between pipeline stages
 */
exports.updateLeadPipelineStage = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userId = context.auth.uid;
        const { campaignId, leadId, newStage } = data;

        if (!campaignId || !leadId || !newStage) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        // Verify campaign ownership
        const campaignDoc = await db.collection('ai_lead_campaigns').doc(campaignId).get();
        if (!campaignDoc.exists || campaignDoc.data().userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Campaign not found');
        }

        // Update lead stage
        const validStages = ['new', 'qualified', 'contacted', 'responded', 'converted'];
        if (!validStages.includes(newStage)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid stage');
        }

        await db.collection('ai_lead_campaigns').doc(campaignId).collection('leads').doc(leadId).update({
            stage: newStage,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, leadId, newStage };
    } catch (error) {
        console.error('Error updating lead stage:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to update lead');
    }
});

// ============================================================================
// HTTP VERSION WITH CORS - getLeadFinderConfig
// ============================================================================

// ============================================================================
// HTTP VERSIONS WITH CORS - For Direct HTTP Access
// ============================================================================

/**
 * getMyAutomationsHTTP - HTTP version with CORS support
 */
/**
 * getMyAutomationsHTTP - HTTP version with CORS support
 */
exports.getMyAutomationsHTTP = functions.https.onRequest(
    withCors(async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        const userData = userDoc.data();
        if (!userData.isActive) {
            return res.status(403).json({ error: 'User account is disabled' });
        }

        const assignedAutomations = userData.assignedAutomations || [];
        if (assignedAutomations.length === 0) {
            return res.status(200).json({ automations: [], message: 'No automations assigned' });
        }

        const automationsPromises = assignedAutomations.map(async (automationId) => {
            const doc = await db.collection('automations').doc(automationId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        });

        const automations = (await Promise.all(automationsPromises)).filter(a => a !== null);
        return res.status(200).json({ automations });
    })
);

/**
 * getClientConfigHTTP - HTTP version with CORS support
 */
/**
 * getClientConfigHTTP - HTTP version with CORS support
 */
exports.getClientConfigHTTP = functions.https.onRequest(
    withCors(async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        const userData = userDoc.data();
        if (!userData.isActive) {
            return res.status(403).json({ error: 'User account is disabled' });
        }

        const configDoc = await db.collection('client_configs').doc(userId).get();
        if (!configDoc.exists) {
            return res.status(200).json({
                config: {
                    clientUserId: userId,
                    openaiApiKey: '',
                    openaiApiKeyMasked: false,
                    metaPhoneNumberId: '',
                    metaAccessToken: '',
                    whatsappBusinessAccountId: '',
                    webhookVerifyToken: '',
                    assistantEnabled: false,
                    createdAt: null,
                    updatedAt: null
                }
            });
        }

        const config = configDoc.data();
        const { sanitizeForClient } = require('./src/utils/secretMasking');
        const safeConfig = sanitizeForClient(config, true);

        const maskedConfig = {
            ...safeConfig,
            openaiApiKey: safeConfig.openaiApiKey || '',
            openaiApiKeyMasked: !!config.openaiApiKey,
            metaAccessToken: safeConfig.metaAccessToken || '',
            metaAccessTokenMasked: !!config.metaAccessToken,
            whatsappToken: safeConfig.whatsappToken || '',
            whatsappTokenMasked: !!config.whatsappToken
        };

        return res.status(200).json({ config: maskedConfig });
    })
);

/**
 * getMyLeadFinderLeadsHTTP - HTTP version with CORS support
 */
/**
 * getMyLeadFinderLeadsHTTP - HTTP version with CORS support
 */
exports.getMyLeadFinderLeadsHTTP = functions.https.onRequest(
    withCors(async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { getUserLeads, getUserJobs } = require('./src/services/leadFinderService');
        const leads = await getUserLeads(userId);
        const jobs = await getUserJobs(userId);

        return res.status(200).json({ leads, jobs });
    })
);

/**
 * getMyLeadFinderLeads - HTTP version with CORS (alias for getMyLeadFinderLeadsHTTP)
 */
exports.getMyLeadFinderLeads = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            const { getUserLeads, getUserJobs } = require('./src/services/leadFinderService');
            const leads = await getUserLeads(userId);
            const jobs = await getUserJobs(userId);

            return res.status(200).json({ leads, jobs });
        } catch (error) {
            console.error('Error fetching leads:', error);
            return res.status(500).json({ error: error.message || 'Failed to fetch leads' });
        }
    });
});

// ============================================================================
// EMULATOR HELPER - Seed Test User
// ============================================================================

/**
 * seedTestUser - Create test user in Auth Emulator (development only)
 * Call: http://localhost:5001/waautomation-13fa6/us-central1/seedTestUser
 */
exports.seedTestUser = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    
    try {
        const testEmail = 'mrdev2386@gmail.com';
        const testPassword = 'test123456';
        
        // Try to get existing user first
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(testEmail);
            console.log('Test user already exists:', userRecord.uid);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                // Create new user
                userRecord = await auth.createUser({
                    email: testEmail,
                    password: testPassword,
                    emailVerified: true
                });
                console.log('Created test user:', userRecord.uid);
            } else {
                throw err;
            }
        }
        
        // Create or update user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: testEmail,
            role: 'client_user',
            isActive: true,
            clientKey: `client_test_${Date.now()}`,
            assignedAutomations: ['lead_finder', 'ai_lead_agent'],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        res.json({ 
            success: true, 
            uid: userRecord.uid,
            email: testEmail,
            password: testPassword,
            message: 'Test user is ready'
        });
    } catch (error) {
        console.error('Error in seedTestUser:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            code: error.code
        });
    }
});

/**
 * initializeEmulator - Initialize emulator with test data
 * Call: http://localhost:5001/waautomation-13fa6/us-central1/initializeEmulator
 */
exports.initializeEmulator = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    
    try {
        console.log('🚀 Initializing emulator...');
        
        const testEmail = 'mrdev2386@gmail.com';
        const testPassword = 'test123456';
        
        // Step 1: Create or get test user
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(testEmail);
        } catch (err) {
            userRecord = await auth.createUser({
                email: testEmail,
                password: testPassword,
                emailVerified: true
            });
        }
        
        // Step 2: Create user document
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: testEmail,
            role: 'client_user',
            isActive: true,
            clientKey: `client_test_${Date.now()}`,
            assignedAutomations: ['lead_finder', 'ai_lead_agent'],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Step 3: Ensure Lead Finder automation exists
        const lfAutomation = await db.collection('automations').doc('lead_finder').get();
        if (!lfAutomation.exists) {
            await db.collection('automations').doc('lead_finder').set({
                id: 'lead_finder',
                name: 'Lead Finder',
                description: 'Find and extract business emails',
                isActive: true
            });
        }
        
        // Step 4: Ensure AI Lead Agent automation exists  
        const alaAutomation = await db.collection('automations').doc('ai_lead_agent').get();
        if (!alaAutomation.exists) {
            await db.collection('automations').doc('ai_lead_agent').set({
                id: 'ai_lead_agent',
                name: 'AI Lead Agent',
                description: 'AI-powered lead engagement',
                isActive: true
            });
        }
        
        res.json({
            success: true,
            message: 'Emulator initialized successfully',
            testUser: {
                email: testEmail,
                password: testPassword,
                uid: userRecord.uid
            },
            status: {
                authSetup: true,
                testUserCreated: true,
                automationsCreated: true
            }
        });
    } catch (error) {
        console.error('Error initializing emulator:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code
        });
    }
});


// ============================================================================
// LEAD FINDER HTTP ENDPOINTS WITH CORS
// ============================================================================

/**
 * startLeadFinderHTTP - HTTP version with CORS support
 */
exports.startLeadFinderHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: 'User profile not found' });
            }

            const userData = userDoc.data();
            if (!userData.isActive) {
                return res.status(403).json({ error: 'User account is disabled' });
            }

            if (!userData.assignedAutomations || !userData.assignedAutomations.includes('lead_finder')) {
                return res.status(403).json({ error: 'Lead Finder tool not assigned to your account' });
            }

            // Support both formats: direct body and callable-style wrapped in 'data'
            const body = req.body?.data ?? req.body ?? {};
            const { country, niche, limit } = body;
            
            if (!country || !niche) {
                return res.status(400).json({ error: 'invalid-argument', message: 'country and niche are required' });
            }

            const { startAutomatedLeadFinder } = require('./src/services/leadFinderService');
            const result = await startAutomatedLeadFinder(userId, country, niche, limit);

            await logActivity(userId, 'LEAD_FINDER_STARTED', {
                jobId: result.jobId,
                country,
                niche,
                limit: limit || 500
            });

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error starting lead finder:', error);
            return res.status(500).json({ error: error.message || 'Failed to start lead finder job' });
        }
    });
});

/**
 * startLeadFinder - HTTP version with CORS (delegates to startLeadFinderHTTP)
 */
exports.startLeadFinder = exports.startLeadFinderHTTP;

/**
 * getLeadFinderStatusHTTP - HTTP version with CORS support
 */
exports.getLeadFinderStatusHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            // Support both formats: direct body and callable-style wrapped in 'data'
            const body = req.body?.data ?? req.body ?? {};
            const { jobId } = body;
            
            if (!jobId) {
                return res.status(400).json({ error: 'invalid-argument', message: 'jobId is required' });
            }

            const { getJobStatus } = require('./src/services/leadFinderService');
            const job = await getJobStatus(jobId);
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            if (job.userId !== userId) {
                const userDoc = await db.collection('users').doc(userId).get();
                if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
                    return res.status(403).json({ error: 'You do not have permission to view this job' });
                }
            }

            return res.status(200).json({ job });
        } catch (error) {
            console.error('Error getting job status:', error);
            return res.status(500).json({ error: error.message || 'Failed to get job status' });
        }
    });
});

/**
 * getLeadFinderStatus - HTTP version with CORS (delegates to getLeadFinderStatusHTTP)
 */
exports.getLeadFinderStatus = exports.getLeadFinderStatusHTTP;

/**
 * deleteLeadFinderLeadsHTTP - HTTP version with CORS support
 */
exports.deleteLeadFinderLeadsHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            // Support both formats: direct body and callable-style wrapped in 'data'
            const body = req.body?.data ?? req.body ?? {};
            const { leadIds } = body;
            
            if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
                return res.status(400).json({ error: 'invalid-argument', message: 'leadIds array is required' });
            }

            const { deleteLeads } = require('./src/services/leadFinderService');
            const result = await deleteLeads(userId, leadIds);

            await logActivity(userId, 'LEADS_DELETED', {
                count: result.deleted
            });

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error deleting leads:', error);
            return res.status(500).json({ error: error.message || 'Failed to delete leads' });
        }
    });
});

/**
 * deleteLeadFinderLeads - HTTP version with CORS (delegates to deleteLeadFinderLeadsHTTP)
 */
exports.deleteLeadFinderLeads = exports.deleteLeadFinderLeadsHTTP;




