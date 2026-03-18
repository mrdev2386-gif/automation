/**
 * Assistant Suggestions Module
 * Handles AI-powered suggestions for chat replies
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .substring(0, 10000);
}

/**
 * getSuggestions - Get all suggestion groups for the authenticated client
 */
const getSuggestions = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required');

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) throw new functions.https.HttpsError('permission-denied', 'User account is disabled');

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
const createSuggestion = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    if (!data.triggerIntent || !data.suggestions || !Array.isArray(data.suggestions)) throw new functions.https.HttpsError('invalid-argument', 'triggerIntent and suggestions array are required');

    const validIntents = ['greeting', 'menu', 'booking', 'timing', 'location', 'general', 'fallback'];
    if (!validIntents.includes(data.triggerIntent)) throw new functions.https.HttpsError('invalid-argument', 'Invalid trigger intent');
    if (data.suggestions.length > 3) throw new functions.https.HttpsError('invalid-argument', 'Maximum 3 suggestions allowed');

    const sanitizedSuggestions = data.suggestions.map(s => sanitizeInput(s).substring(0, 50));

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) throw new functions.https.HttpsError('permission-denied', 'User account is disabled');

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
const updateSuggestion = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    if (!data.suggestionId) throw new functions.https.HttpsError('invalid-argument', 'Suggestion ID is required');

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) throw new functions.https.HttpsError('permission-denied', 'User account is disabled');

        const suggestionDoc = await db.collection('assistant_suggestions').doc(data.suggestionId).get();
        if (!suggestionDoc.exists) throw new functions.https.HttpsError('not-found', 'Suggestion not found');
        if (suggestionDoc.data().clientUserId !== userId) throw new functions.https.HttpsError('permission-denied', 'Permission denied');

        const updateData = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (data.triggerIntent !== undefined) {
            const validIntents = ['greeting', 'menu', 'booking', 'timing', 'location', 'general', 'fallback'];
            if (!validIntents.includes(data.triggerIntent)) throw new functions.https.HttpsError('invalid-argument', 'Invalid trigger intent');
            updateData.triggerIntent = data.triggerIntent;
        }
        if (data.suggestions !== undefined) {
            if (data.suggestions.length > 3) throw new functions.https.HttpsError('invalid-argument', 'Maximum 3 suggestions allowed');
            updateData.suggestions = data.suggestions.map(s => sanitizeInput(s).substring(0, 50));
        }
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        await db.collection('assistant_suggestions').doc(data.suggestionId).update(updateData);
        return { success: true, message: 'Suggestion updated successfully' };
    } catch (error) {
        if (error.code === 'not-found' || error.code === 'permission-denied') throw error;
        console.error('Error updating suggestion:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update suggestion');
    }
});

/**
 * deleteSuggestion - Delete a suggestion group
 */
const deleteSuggestion = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    if (!data.suggestionId) throw new functions.https.HttpsError('invalid-argument', 'Suggestion ID is required');

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) throw new functions.https.HttpsError('permission-denied', 'User account is disabled');

        const suggestionDoc = await db.collection('assistant_suggestions').doc(data.suggestionId).get();
        if (!suggestionDoc.exists) throw new functions.https.HttpsError('not-found', 'Suggestion not found');
        if (suggestionDoc.data().clientUserId !== userId) throw new functions.https.HttpsError('permission-denied', 'Permission denied');

        await db.collection('assistant_suggestions').doc(data.suggestionId).delete();
        return { success: true, message: 'Suggestion deleted successfully' };
    } catch (error) {
        if (error.code === 'not-found' || error.code === 'permission-denied') throw error;
        console.error('Error deleting suggestion:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete suggestion');
    }
});

module.exports = {
    getSuggestions,
    createSuggestion,
    updateSuggestion,
    deleteSuggestion
};
