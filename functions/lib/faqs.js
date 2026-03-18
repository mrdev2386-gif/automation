"use strict";
/**
 * FAQ & Knowledge Base Module
 * Handles FAQ creation, updates, deletion, and semantic search
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');
const db = admin.firestore();
const { logActivity } = require('./auth');
/**
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(input) {
    if (typeof input !== 'string')
        return '';
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .substring(0, 10000);
}
/**
 * getFAQs - Get all FAQs for the authenticated client
 */
const getFAQs = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }
        let query = db.collection('faq_knowledge').where('clientUserId', '==', userId);
        if (data.activeOnly === true)
            query = query.where('isActive', '==', true);
        query = query.orderBy('createdAt', 'desc');
        if (data.limit)
            query = query.limit(Math.min(data.limit, 100));
        const faqSnapshot = await query.get();
        const faqs = faqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { faqs };
    }
    catch (error) {
        console.error('Error fetching FAQs:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch FAQs');
    }
});
/**
 * createFAQ - Create a new FAQ (client_user only)
 */
const createFAQ = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    if (!data.question || !data.answer) {
        throw new functions.https.HttpsError('invalid-argument', 'Question and answer are required');
    }
    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }
        if (userDoc.data().role !== 'client_user') {
            throw new functions.https.HttpsError('permission-denied', 'Only client users can create FAQs');
        }
        const sanitizedQuestion = sanitizeInput(data.question);
        const sanitizedAnswer = sanitizeInput(data.answer);
        const faqRef = await db.collection('faq_knowledge').add({
            clientUserId: userId,
            question: sanitizedQuestion,
            answer: sanitizedAnswer,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await logActivity(userId, 'FAQ_CREATED', {
            faqId: faqRef.id,
            question: sanitizedQuestion.substring(0, 50)
        });
        return { success: true, faqId: faqRef.id, message: 'FAQ created successfully' };
    }
    catch (error) {
        console.error('Error creating FAQ:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create FAQ');
    }
});
/**
 * updateFAQ - Update an existing FAQ (client_user only)
 */
const updateFAQ = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    if (!data.faqId) {
        throw new functions.https.HttpsError('invalid-argument', 'FAQ ID is required');
    }
    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }
        if (userDoc.data().role !== 'client_user') {
            throw new functions.https.HttpsError('permission-denied', 'Only client users can update FAQs');
        }
        const faqDoc = await db.collection('faq_knowledge').doc(data.faqId).get();
        if (!faqDoc.exists)
            throw new functions.https.HttpsError('not-found', 'FAQ not found');
        if (faqDoc.data().clientUserId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'You do not have permission to update this FAQ');
        }
        const updateData = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (data.question !== undefined)
            updateData.question = sanitizeInput(data.question);
        if (data.answer !== undefined)
            updateData.answer = sanitizeInput(data.answer);
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        await db.collection('faq_knowledge').doc(data.faqId).update(updateData);
        await logActivity(userId, 'FAQ_UPDATED', {
            faqId: data.faqId,
            updatedFields: Object.keys(updateData).filter(k => k !== 'updatedAt')
        });
        return { success: true, message: 'FAQ updated successfully' };
    }
    catch (error) {
        if (error.code === 'not-found' || error.code === 'permission-denied')
            throw error;
        console.error('Error updating FAQ:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update FAQ');
    }
});
/**
 * deleteFAQ - Delete an FAQ (client_user only)
 */
const deleteFAQ = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    if (!data.faqId) {
        throw new functions.https.HttpsError('invalid-argument', 'FAQ ID is required');
    }
    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }
        if (userDoc.data().role !== 'client_user') {
            throw new functions.https.HttpsError('permission-denied', 'Only client users can delete FAQs');
        }
        const faqDoc = await db.collection('faq_knowledge').doc(data.faqId).get();
        if (!faqDoc.exists)
            throw new functions.https.HttpsError('not-found', 'FAQ not found');
        if (faqDoc.data().clientUserId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'You do not have permission to delete this FAQ');
        }
        await db.collection('faq_knowledge').doc(data.faqId).delete();
        await logActivity(userId, 'FAQ_DELETED', { faqId: data.faqId });
        return { success: true, message: 'FAQ deleted successfully' };
    }
    catch (error) {
        if (error.code === 'not-found' || error.code === 'permission-denied')
            throw error;
        console.error('Error deleting FAQ:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete FAQ');
    }
});
/**
 * rebuildFaqEmbeddings - Rebuild embeddings for all FAQs
 */
const rebuildFaqEmbeddings = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive)
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        const configDoc = await db.collection('client_configs').doc(userId).get();
        const openaiApiKey = configDoc.exists ? configDoc.data().openaiApiKey : null;
        if (!openaiApiKey)
            throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key not configured');
        const openai = new OpenAI({ apiKey: openaiApiKey });
        const faqsSnapshot = await db.collection('faq_knowledge')
            .where('clientUserId', '==', userId)
            .where('isActive', '==', true)
            .get();
        if (faqsSnapshot.empty)
            return { success: true, message: 'No FAQs to rebuild', count: 0 };
        let processedCount = 0;
        for (const faqDoc of faqsSnapshot.docs) {
            const faqData = faqDoc.data();
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: faqData.question
            });
            const embedding = embeddingResponse.data[0].embedding;
            await db.collection('faq_knowledge').doc(faqDoc.id).update({
                embedding: embedding,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            processedCount++;
        }
        return { success: true, message: `Successfully rebuilt embeddings for ${processedCount} FAQs`, count: processedCount };
    }
    catch (error) {
        console.error('Error rebuilding embeddings:', error);
        if (error.code === 'failed-precondition' || error.code === 'permission-denied')
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to rebuild embeddings: ' + error.message);
    }
});
/**
 * testFaqMatch - Test FAQ semantic matching
 */
const testFaqMatch = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    if (!data.message)
        throw new functions.https.HttpsError('invalid-argument', 'Test message is required');
    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive)
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        const configDoc = await db.collection('client_configs').doc(userId).get();
        const config = configDoc.exists ? configDoc.data() : {};
        const openaiApiKey = config.openaiApiKey;
        if (!openaiApiKey)
            throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key not configured');
        const openai = new OpenAI({ apiKey: openaiApiKey });
        const threshold = config.semanticThreshold || 0.82;
        const faqsSnapshot = await db.collection('faq_knowledge')
            .where('clientUserId', '==', userId)
            .where('isActive', '==', true)
            .get();
        if (faqsSnapshot.empty)
            return { success: true, matches: [], message: 'No FAQs configured' };
        const messageEmbeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: data.message
        });
        const messageEmbedding = messageEmbeddingResponse.data[0].embedding;
        const cosineSimilarity = (vec1, vec2) => {
            let dotProduct = 0, norm1 = 0, norm2 = 0;
            for (let i = 0; i < vec1.length; i++) {
                dotProduct += vec1[i] * vec2[i];
                norm1 += vec1[i] * vec1[i];
                norm2 += vec2[i] * vec2[i];
            }
            return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        };
        let bestMatch = null;
        let bestScore = 0;
        const matches = [];
        for (const faqDoc of faqsSnapshot.docs) {
            const faqData = faqDoc.data();
            let faqEmbedding = faqData.embedding;
            if (!faqEmbedding || faqEmbedding.length === 0) {
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
                bestMatch = { question: faqData.question, answer: faqData.answer, similarity: similarity };
            }
        }
        matches.sort((a, b) => b.similarity - a.similarity);
        return {
            success: true,
            testMessage: data.message,
            threshold: threshold,
            matches: matches.slice(0, 5),
            bestMatch: bestMatch && bestScore >= threshold ? bestMatch : null,
            bestScore: parseFloat(bestScore.toFixed(4))
        };
    }
    catch (error) {
        console.error('Error testing FAQ match:', error);
        if (error.code === 'failed-precondition' || error.code === 'permission-denied')
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to test FAQ match: ' + error.message);
    }
});
module.exports = {
    getFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    rebuildFaqEmbeddings,
    testFaqMatch
};
//# sourceMappingURL=faqs.js.map