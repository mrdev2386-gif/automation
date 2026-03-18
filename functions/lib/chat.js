"use strict";
/**
 * Chat and Contact Management Module
 * Handles chat logs and contact lists
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
/**
 * getChatLogs - Get chat logs for the authenticated client
 */
const getChatLogs = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }
        let query = db.collection('chat_logs').where('clientUserId', '==', userId);
        if (data.phone)
            query = query.where('phone', '==', data.phone);
        if (data.direction)
            query = query.where('direction', '==', data.direction);
        query = query.orderBy('timestamp', 'desc');
        const limit = data.limit || 100;
        query = query.limit(Math.min(limit, 500));
        const logsSnapshot = await query.get();
        const logs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { logs };
    }
    catch (error) {
        console.error('Error fetching chat logs:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch chat logs');
    }
});
/**
 * getChatContacts - Get unique contacts for the authenticated client
 */
const getChatContacts = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().isActive) {
            throw new functions.https.HttpsError('permission-denied', 'User account is disabled');
        }
        const logsSnapshot = await db.collection('chat_logs')
            .where('clientUserId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(1000)
            .get();
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
        const contacts = Array.from(contactsMap.values());
        contacts.sort((a, b) => {
            const timeA = a.lastTimestamp?.toDate?.() || new Date(0);
            const timeB = b.lastTimestamp?.toDate?.() || new Date(0);
            return timeB - timeA;
        });
        return { contacts };
    }
    catch (error) {
        console.error('Error fetching chat contacts:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch chat contacts');
    }
});
module.exports = {
    getChatLogs,
    getChatContacts
};
//# sourceMappingURL=chat.js.map