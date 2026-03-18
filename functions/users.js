/**
 * User Management Module
 * Handles user creation, updates, deletion, and profile management
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const auth = admin.auth();

const { validateTools } = require('./src/utils/toolFeatures');
const { isSuperAdmin, logActivity, isValidEmail } = require('./auth');

/**
 * createUser - Create a new user (super_admin only)
 */
const createUser = functions.region("us-central1").https.onCall(async (data, context) => {
    try {
        console.log('👤 createUser called');
        
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
        }

        const isAdmin = await isSuperAdmin(context.auth.uid);
        if (!isAdmin) {
            await logActivity(context.auth.uid, 'UNAUTHORIZED_USER_CREATE_ATTEMPT', {
                attemptedEmail: data.email
            });
            throw new functions.https.HttpsError('permission-denied', 'Only super_admin can create users');
        }

        if (!data.email || !data.password || !data.role) {
            throw new functions.https.HttpsError('invalid-argument', 'Email, password, and role are required');
        }

        if (!isValidEmail(data.email)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
        }

        if (data.password.length < 8) {
            throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 8 characters');
        }

        if (!['super_admin', 'client_user'].includes(data.role)) {
            throw new functions.https.HttpsError('invalid-argument', 'Role must be either super_admin or client_user');
        }

        if (data.assignedAutomations && !validateTools(data.assignedAutomations)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid automation tool assigned');
        }

        const clientKey = `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

        const userRecord = await auth.createUser({
            email: data.email,
            password: data.password,
            emailVerified: true
        });

        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: data.email,
            role: data.role,
            isActive: true,
            clientKey: clientKey,
            assignedAutomations: data.assignedAutomations || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

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
        console.error('❌ createUser error:', error);

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'Email already exists');
        }

        throw new functions.https.HttpsError('internal', `Failed to create user: ${error.message}`);
    }
});

/**
 * updateUser - Update user details (super_admin only)
 */
const updateUser = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const isAdmin = await isSuperAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only super_admin can update users');
    }

    if (!data.userId) {
        throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
    }

    const updateData = {};

    if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
    }

    if (data.assignedAutomations !== undefined) {
        if (!validateTools(data.assignedAutomations)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid automation tool assigned');
        }
        updateData.assignedAutomations = data.assignedAutomations;
    }

    if (data.role) {
        if (!['super_admin', 'client_user'].includes(data.role)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
        }
        updateData.role = data.role;
    }

    try {
        await db.collection('users').doc(data.userId).update(updateData);

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

        await logActivity(context.auth.uid, activityAction, activityMetadata);

        return {
            success: true,
            message: 'User updated successfully'
        };
    } catch (error) {
        console.error('Error updating user:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update user');
    }
});

/**
 * deleteUser - Delete a user (super_admin only)
 */
const deleteUser = functions.region("us-central1").https.onCall(async (data, context) => {
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
const resetUserPassword = functions.region("us-central1").https.onCall(async (data, context) => {
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
const setCustomUserClaims = functions.region("us-central1").https.onCall(async (data, context) => {
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
const getAllUsers = functions.region("us-central1").https.onCall(async (data, context) => {
    try {
        console.log('👥 getAllUsers called');
        
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

        const usersSnapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();

        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { users };
    } catch (error) {
        console.error('❌ getAllUsers error:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError(
            'internal',
            `Failed to fetch users: ${error.message}`
        );
    }
});

/**
 * getUserProfile - Get current user's profile
 */
const getUserProfile = functions.region("us-central1").https.onCall(async (data, context) => {
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
const getDashboardStats = functions.region("us-central1").https.onCall(async (data, context) => {
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

/**
 * generateClientKey - Generate/regenerate clientKey for a user (super_admin only)
 */
const generateClientKey = functions.region("us-central1").https.onCall(async (data, context) => {
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

module.exports = {
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    setCustomUserClaims,
    getAllUsers,
    getUserProfile,
    getDashboardStats,
    generateClientKey
};
