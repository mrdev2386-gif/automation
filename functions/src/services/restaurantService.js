/**
 * Restaurant Service
 * Handles multi-tenant restaurant detection and management
 * CRITICAL: Every operation must include restaurantId for tenant isolation
 * 
 * PHASE 1: Database Hardening
 * - Category normalization (lowercase snake_case)
 * - Status field (active/suspended)
 * - OwnerId for multi-tenant support
 * - Features object for custom overrides
 * - BookingType field
 * - CreatedAt/UpdatedAt timestamps
 */

const { getFirestore, admin } = require('../config/firebase');
const { normalizeCategory, getCategoryConfig, getSupportedCategories } = require('../config/categoryConfig');

/**
 * Validate and normalize restaurant data before create/update
 * @param {Object} restaurantData - Raw restaurant data
 * @returns {Object} - Normalized restaurant data
 */
const normalizeRestaurantData = (restaurantData) => {
    const normalized = { ...restaurantData };

    // Normalize category
    if (normalized.category) {
        normalized.category = normalizeCategory(normalized.category);
    } else {
        // Default to restaurant for backward compatibility
        normalized.category = 'restaurant';
    }

    // Validate category is supported
    const supportedCategories = getSupportedCategories();
    if (!supportedCategories.includes(normalized.category)) {
        console.warn(`Category "${normalized.category}" not in supported list, using "restaurant"`);
        normalized.category = 'restaurant';
    }

    // Set default status if not provided
    if (!normalized.status) {
        normalized.status = 'active';
    }

    // Validate status
    const validStatuses = ['active', 'suspended'];
    if (!validStatuses.includes(normalized.status)) {
        normalized.status = 'active';
    }

    // Set default bookingType from category config if not provided
    if (!normalized.bookingType) {
        const config = getCategoryConfig(normalized.category);
        normalized.bookingType = config.bookingLabel;
    }

    // Ensure features object exists (for PHASE 3 - feature flag override)
    if (!normalized.features) {
        const config = getCategoryConfig(normalized.category);
        normalized.features = {
            bookingEnabled: config.bookingEnabled,
            menuEnabled: config.menuEnabled
        };
    }

    // PHASE 10: Founder mode - add plan fields if not present
    if (!normalized.plan) {
        normalized.plan = 'starter'; // starter/pro/premium
    }

    // trialEndsAt can be null (no trial) or a timestamp
    if (normalized.trialEndsAt && typeof normalized.trialEndsAt.toDate === 'function') {
        // It's a Firestore timestamp, keep as is
    } else if (normalized.trialEndsAt) {
        // It's a string or number, convert to Firestore timestamp
        normalized.trialEndsAt = admin.firestore.Timestamp.fromDate(new Date(normalized.trialEndsAt));
    }

    return normalized;
};

/**
 * Get restaurant/client by WhatsApp phone number ID
 * This is the core function that identifies which client a message belongs to
 * UPDATED: Uses collectionGroup for TRUE multi-tenant isolation
 * @param {string} phoneNumberId - The WhatsApp phone number ID
 * @returns {Promise<Object|null>} - Client data or null if not found
 */
const getRestaurantByPhoneNumberId = async (phoneNumberId) => {
    try {
        const db = getFirestore();

        // 1. Search in new multi-tenant structure using collectionGroup
        const clientsSnapshot = await db.collectionGroup('clients')
            .where('whatsappNumberId', '==', phoneNumberId)
            .limit(1)
            .get();

        if (!clientsSnapshot.empty) {
            const doc = clientsSnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        // 2. Fallback to legacy 'restaurants' collection
        const restaurantsSnapshot = await db.collection('restaurants')
            .where('whatsappNumberId', '==', phoneNumberId)
            .limit(1)
            .get();

        if (!restaurantsSnapshot.empty) {
            const doc = restaurantsSnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        // 3. Fallback to legacy 'clients' global collection (if any)
        const globalClientsSnapshot = await db.collection('clients')
            .where('whatsappNumberId', '==', phoneNumberId)
            .limit(1)
            .get();

        if (!globalClientsSnapshot.empty) {
            const doc = globalClientsSnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        console.log(`No client found for phoneNumberId: ${phoneNumberId}`);
        return null;
    } catch (error) {
        console.error('Error getting client by phone number ID:', error);
        throw error;
    }
};

/**
 * Get restaurant/client by WhatsApp phone number (E.164 format)
 * @param {string} whatsappNumber - WhatsApp number in E.164 format
 * @returns {Promise<Object|null>} - Client data or null if not found
 */
const getRestaurantByWhatsAppNumber = async (whatsappNumber) => {
    try {
        const db = getFirestore();

        // 1. Search in new multi-tenant structure using collectionGroup
        const clientsSnapshot = await db.collectionGroup('clients')
            .where('whatsappNumber', '==', whatsappNumber)
            .limit(1)
            .get();

        if (!clientsSnapshot.empty) {
            const doc = clientsSnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        // 2. Fallback to legacy 'restaurants'
        const snapshot = await db.collection('restaurants')
            .where('whatsappNumber', '==', whatsappNumber)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        return null;
    } catch (error) {
        console.error('Error getting client by WhatsApp number:', error);
        throw error;
    }
};

/**
 * Get restaurant by ID
 * @param {string} restaurantId - Firestore document ID
 * @returns {Promise<Object|null>} - Restaurant data or null if not found
 */
const getRestaurantById = async (restaurantId) => {
    try {
        const db = getFirestore();
        const doc = await db.collection('restaurants').doc(restaurantId).get();

        if (!doc.exists) {
            console.log(`No restaurant found for id: ${restaurantId}`);
            return null;
        }

        const data = doc.data();

        // PHASE 1: Handle legacy records
        if (!data.category) {
            data.category = 'restaurant';
        }
        if (!data.status) {
            data.status = 'active';
        }

        return {
            id: doc.id,
            ...data,
        };
    } catch (error) {
        console.error('Error getting restaurant by ID:', error);
        throw error;
    }
};

/**
 * Create a new restaurant
 * PHASE 1: Normalizes category and sets defaults
 * @param {Object} restaurantData - Restaurant data
 * @returns {Promise<string>} - Created restaurant ID
 */
const createRestaurant = async (restaurantData) => {
    try {
        const db = getFirestore();

        // PHASE 1: Normalize data before saving
        const normalizedData = normalizeRestaurantData(restaurantData);

        // Add timestamps
        normalizedData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        normalizedData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        const docRef = await db.collection('restaurants').add(normalizedData);
        console.log(`Restaurant created with ID: ${docRef.id}, category: ${normalizedData.category}`);
        return docRef.id;
    } catch (error) {
        console.error('Error creating restaurant:', error);
        throw error;
    }
};

/**
 * Update restaurant data
 * PHASE 1: Normalizes category on update
 * @param {string} restaurantId - Restaurant ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
const updateRestaurant = async (restaurantId, updateData) => {
    try {
        const db = getFirestore();

        // PHASE 1: Normalize data if category is being updated
        const normalizedData = { ...updateData };
        if (updateData.category) {
            Object.assign(normalizedData, normalizeRestaurantData({ category: updateData.category }));
        }

        normalizedData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('restaurants').doc(restaurantId).update(normalizedData);
        console.log(`Restaurant ${restaurantId} updated`);
    } catch (error) {
        console.error('Error updating restaurant:', error);
        throw error;
    }
};

/**
 * Get all restaurants (for admin purposes)
 * @returns {Promise<Array>} - Array of restaurant data
 */
const getAllRestaurants = async () => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('restaurants').get();

        return snapshot.docs.map(doc => {
            const data = doc.data();

            // PHASE 1: Handle legacy records
            if (!data.category) {
                data.category = 'restaurant';
            }
            if (!data.status) {
                data.status = 'active';
            }

            return {
                id: doc.id,
                ...data,
            };
        });
    } catch (error) {
        console.error('Error getting all restaurants:', error);
        throw error;
    }
};

/**
 * Get restaurant by owner ID (for multi-tenant)
 * @param {string} ownerId - Owner user ID
 * @returns {Promise<Array>} - Array of restaurant data
 */
const getRestaurantsByOwner = async (ownerId) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('restaurants')
            .where('ownerId', '==', ownerId)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error getting restaurants by owner:', error);
        throw error;
    }
};

/**
 * Check if whatsappNumberId is already in use (for validation)
 * @param {string} whatsappNumberId - WhatsApp Number ID
 * @param {string} excludeRestaurantId - Restaurant ID to exclude (for updates)
 * @returns {Promise<boolean>} - True if already in use
 */
const isWhatsappNumberIdInUse = async (whatsappNumberId, excludeRestaurantId = null) => {
    try {
        const db = getFirestore();
        let query = db.collection('restaurants')
            .where('whatsappNumberId', '==', whatsappNumberId);

        const snapshot = await query.get();

        if (snapshot.empty) {
            return false;
        }

        // If we're excluding a specific restaurant, check if that's the only match
        if (excludeRestaurantId) {
            const matches = snapshot.docs.filter(doc => doc.id !== excludeRestaurantId);
            return matches.length > 0;
        }

        return true;
    } catch (error) {
        console.error('Error checking whatsappNumberId:', error);
        throw error;
    }
};

module.exports = {
    getRestaurantByPhoneNumberId,
    getRestaurantByWhatsAppNumber,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    getAllRestaurants,
    getRestaurantsByOwner,
    isWhatsappNumberIdInUse,
    normalizeRestaurantData
};
