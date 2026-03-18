/**
 * Client Configuration Module
 * Handles per-client settings, secrets, and keys
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

const db = admin.firestore();

const { isSuperAdmin, logActivity } = require('./auth');

/**
 * getClientConfig - Get client configuration (client_user or super_admin)
 */
const getClientConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { sanitizeForClient } = require('./src/utils/secretMasking');

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User profile not found');
        }

        const userData = userDoc.data();
        if (!userData.isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }

        const targetUserId = (userData.role === 'super_admin' && data.userId) ? data.userId : userId;
        const configDoc = await db.collection('client_configs').doc(targetUserId).get();

        if (!configDoc.exists) {
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

        if (targetUserId !== userId && userData.role === 'super_admin') {
            await logActivity(userId, 'ADMIN_VIEWED_CLIENT_CONFIG', { targetUserId });
        }

        return { config: maskedConfig };
    } catch (error) {
        console.error('Error fetching client config:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch client configuration');
    }
});

/**
 * saveClientConfig - Save client configuration (client_user only)
 */
const saveClientConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User profile not found');
        }

        const userData = userDoc.data();
        if (!userData.isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }

        if (userData.role !== 'client_user') {
            throw new functions.https.HttpsError('permission-denied', 'Only client users can save their configuration');
        }

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

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                if ((field === 'openaiApiKey' || field === 'metaAccessToken') && data[field] === '••••••••') {
                    continue;
                }
                updateData[field] = data[field];
            }
        }

        const configDoc = await db.collection('client_configs').doc(userId).get();
        if (!configDoc.exists) {
            updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }

        await db.collection('client_configs').doc(userId).set(updateData, { merge: true });
        await logActivity(userId, 'CLIENT_CONFIG_SAVED', {
            updatedFields: Object.keys(updateData).filter(k => k !== 'clientUserId' && k !== 'updatedAt' && k !== 'createdAt')
        });

        return { success: true, message: 'Configuration saved successfully' };
    } catch (error) {
        console.error('Error saving client config:', error);
        throw new functions.https.HttpsError('internal', 'Failed to save client configuration');
    }
});

/**
 * getClientConfigHTTP - HTTP version with CORS support
 */
const getClientConfigHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') return res.status(204).send('');

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) return res.status(404).json({ error: 'User profile not found' });

            const userData = userDoc.data();
            if (!userData.isActive) return res.status(403).json({ error: 'User account is disabled' });

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
        } catch (error) {
            console.error('Error in getClientConfigHTTP:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
});

/**
 * saveWelcomeConfig - Save welcome message configuration
 */
const saveWelcomeConfig = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { sanitizeInput } = require('./src/utils/helpers');

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

module.exports = {
    getClientConfig,
    saveClientConfig,
    getClientConfigHTTP,
    saveWelcomeConfig
};
