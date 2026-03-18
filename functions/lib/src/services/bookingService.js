"use strict";
/**
 * Booking Service
 * Handles booking/reservation management for all business types
 * CRITICAL: Every operation MUST include restaurantId for tenant isolation
 *
 * PHASE 1: Updated to include category in booking documents
 * PHASE 5: Universalized booking flow for all business types
 */
const { getFirestore, admin } = require('../config/firebase');
const { normalizeCategory } = require('../config/categoryConfig');
/**
 * Create a new booking / lead
 * PHASE 1: Now includes category, restaurantId, customerPhone
 * UPDATED: Support for True Multi-Tenant Isolation (user-scoped clients)
 * @param {Object} bookingData - Booking data including restaurantId and optional ownerId
 * @returns {Promise<string>} - Created booking ID
 */
const createBooking = async (bookingData) => {
    try {
        const db = getFirestore();
        const { ownerId, restaurantId, ...rest } = bookingData;
        // PHASE 1: Ensure required fields
        const bookingPayload = {
            ...rest,
            // Category is required for universal booking flow
            category: rest.category || normalizeCategory(rest.category) || 'restaurant',
            // restaurantId is required for tenant isolation
            restaurantId: restaurantId,
            // customerPhone is required for customer identification
            customerPhone: rest.customerPhone,
            status: rest.status || 'confirmed', // pending, confirmed, cancelled
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        let docRef;
        if (ownerId && restaurantId) {
            // NEW: True Multi-Tenant Path
            console.log(`Creating multi-tenant lead for owner: ${ownerId}, client: ${restaurantId}`);
            docRef = await db.collection('users').doc(ownerId)
                .collection('clients').doc(restaurantId)
                .collection('leads').add(bookingPayload);
        }
        else {
            // LEGACY: Global bookings collection
            console.log(`Creating legacy booking for restaurant: ${restaurantId}`);
            docRef = await db.collection('bookings').add(bookingPayload);
        }
        console.log(`Booking created with ID: ${docRef.id}, category: ${bookingPayload.category}, path: ${docRef.path}`);
        return docRef.id;
    }
    catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
};
/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object|null>} - Booking data or null
 */
const getBookingById = async (bookingId) => {
    try {
        const db = getFirestore();
        const doc = await db.collection('bookings').doc(bookingId).get();
        if (!doc.exists) {
            return null;
        }
        return {
            id: doc.id,
            ...doc.data(),
        };
    }
    catch (error) {
        console.error('Error getting booking:', error);
        throw error;
    }
};
/**
 * Get all bookings for a restaurant (tenant isolation)
 * @param {string} restaurantId - Restaurant ID
 * @param {number} limit - Number of bookings to retrieve
 * @returns {Promise<Array>} - Array of booking data
 */
const getBookingsByRestaurant = async (restaurantId, limit = 50) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('bookings')
            .where('restaurantId', '==', restaurantId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    }
    catch (error) {
        console.error('Error getting bookings by restaurant:', error);
        throw error;
    }
};
/**
 * Get bookings by customer phone and restaurant
 * @param {string} customerPhone - Customer phone number
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<Array>} - Array of booking data
 */
const getBookingsByCustomer = async (customerPhone, restaurantId) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('bookings')
            .where('customerPhone', '==', customerPhone)
            .where('restaurantId', '==', restaurantId)
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    }
    catch (error) {
        console.error('Error getting bookings by customer:', error);
        throw error;
    }
};
/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
const updateBookingStatus = async (bookingId, status) => {
    try {
        const db = getFirestore();
        await db.collection('bookings').doc(bookingId).update({
            status: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Booking ${bookingId} status updated to: ${status}`);
    }
    catch (error) {
        console.error('Error updating booking status:', error);
        throw error;
    }
};
/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<void>}
 */
const cancelBooking = async (bookingId) => {
    return updateBookingStatus(bookingId, 'cancelled');
};
/**
 * Get bookings by date for a restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of booking data
 */
const getBookingsByDate = async (restaurantId, date) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('bookings')
            .where('restaurantId', '==', restaurantId)
            .where('date', '==', date)
            .orderBy('time', 'asc')
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    }
    catch (error) {
        console.error('Error getting bookings by date:', error);
        throw error;
    }
};
/**
 * Get bookings by category for a restaurant
 * Useful for multi-category businesses
 * @param {string} restaurantId - Restaurant ID
 * @param {string} category - Category filter
 * @returns {Promise<Array>} - Array of booking data
 */
const getBookingsByCategory = async (restaurantId, category) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('bookings')
            .where('restaurantId', '==', restaurantId)
            .where('category', '==', normalizeCategory(category))
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    }
    catch (error) {
        console.error('Error getting bookings by category:', error);
        throw error;
    }
};
module.exports = {
    createBooking,
    getBookingById,
    getBookingsByRestaurant,
    getBookingsByCustomer,
    updateBookingStatus,
    cancelBooking,
    getBookingsByDate,
    getBookingsByCategory,
};
//# sourceMappingURL=bookingService.js.map