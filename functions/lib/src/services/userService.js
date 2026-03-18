"use strict";
/**
 * User Service
 * Manages user state for multi-step conversations (e.g., booking flow)
 * CRITICAL: Every operation MUST include restaurantId for tenant isolation
 *
 * PHASE 1: Added conversation tracking (lastConversationAt, conversationCount)
 */
const { getFirestore, admin } = require('../config/firebase');
/**
 * Get or create user by phone number and restaurant
 * PHASE 1: Now tracks lastConversationAt and conversationCount
 * @param {string} phoneNumber - User's phone number
 * @param {string} restaurantId - Restaurant ID (tenant)
 * @returns {Promise<Object>} - User data
 */
const getOrCreateUser = async (phoneNumber, restaurantId) => {
    try {
        const db = getFirestore();
        // Try to find existing user
        const snapshot = await db.collection('users')
            .where('phone', '==', phoneNumber)
            .where('restaurantId', '==', restaurantId)
            .limit(1)
            .get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const userData = doc.data();
            // PHASE 1: Update conversation tracking on existing user
            const now = admin.firestore.FieldValue.serverTimestamp();
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            // Check if this is a new month - reset monthly count if needed
            const lastConversationMonth = userData.lastConversationAt
                ? new Date(userData.lastConversationAt._seconds * 1000).toISOString().slice(0, 7)
                : null;
            const monthlyCountUpdate = (lastConversationMonth !== currentMonth)
                ? { conversationCount: 1, conversationCountMonthly: 1 }
                : {};
            // Update conversation tracking
            await db.collection('users').doc(doc.id).update({
                lastConversationAt: now,
                lastSeen: now,
                ...monthlyCountUpdate,
                // Increment total conversation count
                ...(userData.conversationCount
                    ? { conversationCount: userData.conversationCount + 1 }
                    : { conversationCount: 1 })
            });
            return {
                id: doc.id,
                ...userData,
                lastConversationAt: now,
                conversationCount: (userData.conversationCount || 0) + 1,
            };
        }
        // Create new user if not found
        const newUser = {
            phone: phoneNumber,
            restaurantId: restaurantId,
            lastSeen: admin.firestore.FieldValue.serverTimestamp(),
            lastConversationAt: admin.firestore.FieldValue.serverTimestamp(),
            bookingState: null, // null or object with booking details
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            // PHASE 1: Conversation tracking
            conversationCount: 1,
            conversationCountMonthly: 1,
        };
        const docRef = await db.collection('users').add(newUser);
        console.log(`New user created: ${docRef.id} for restaurant: ${restaurantId}`);
        return {
            id: docRef.id,
            ...newUser,
        };
    }
    catch (error) {
        console.error('Error getting or creating user:', error);
        throw error;
    }
};
/**
 * Update user state (e.g., booking flow state)
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
const updateUser = async (userId, updateData) => {
    try {
        const db = getFirestore();
        await db.collection('users').doc(userId).update({
            ...updateData,
            lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`User ${userId} updated`);
    }
    catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};
/**
 * Set booking state for user (for multi-step booking flow)
 * @param {string} userId - User ID
 * @param {Object} bookingState - Booking state object
 * @returns {Promise<void>}
 */
const setBookingState = async (userId, bookingState) => {
    try {
        const db = getFirestore();
        await db.collection('users').doc(userId).update({
            bookingState: bookingState,
            lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Booking state set for user ${userId}:`, bookingState);
    }
    catch (error) {
        console.error('Error setting booking state:', error);
        throw error;
    }
};
/**
 * Clear booking state
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const clearBookingState = async (userId) => {
    try {
        const db = getFirestore();
        await db.collection('users').doc(userId).update({
            bookingState: null,
            lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Booking state cleared for user ${userId}`);
    }
    catch (error) {
        console.error('Error clearing booking state:', error);
        throw error;
    }
};
/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - User data or null
 */
const getUserById = async (userId) => {
    try {
        const db = getFirestore();
        const doc = await db.collection('users').doc(userId).get();
        if (!doc.exists) {
            return null;
        }
        return {
            id: doc.id,
            ...doc.data(),
        };
    }
    catch (error) {
        console.error('Error getting user by ID:', error);
        throw error;
    }
};
/**
 * Get all users for a restaurant (tenant isolation)
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<Array>} - Array of user data
 */
const getUsersByRestaurant = async (restaurantId) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('users')
            .where('restaurantId', '==', restaurantId)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    }
    catch (error) {
        console.error('Error getting users by restaurant:', error);
        throw error;
    }
};
module.exports = {
    getOrCreateUser,
    updateUser,
    setBookingState,
    clearBookingState,
    getUserById,
    getUsersByRestaurant,
};
//# sourceMappingURL=userService.js.map