/**
 * Lead Service Functions
 * Frontend functions for lead management using Firebase Callable Functions
 */

import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './firebase';

/**
 * Get leads using the new callable function (secure, per-client isolation)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Leads with pagination info
 */
export const getMyLeads = async (options = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
        const { status, source, search, limit = 50, page = 1 } = options;

        const leadsCallable = httpsCallable(functions, 'getMyLeads');
        const result = await leadsCallable({ status, source, search, limit, page });

        return result.data || { leads: [], pagination: { page: 1, total: 0, totalPages: 0 } };
    } catch (error) {
        console.error('Error fetching leads:', error);
        return { leads: [], pagination: { page: 1, total: 0, totalPages: 0 } };
    }
};

/**
 * Upload leads in bulk (CSV or manual)
 * @param {Array} leads - Array of lead objects
 * @param {string} targetUserId - Optional target user ID (for admin)
 * @returns {Promise<Object>} - Upload results
 */
export const uploadLeadsBulk = async (leads, targetUserId = null) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
        const uploadCallable = httpsCallable(functions, 'uploadLeadsBulk');
        const result = await uploadCallable({ leads, targetUserId });

        return result.data;
    } catch (error) {
        console.error('Error uploading leads:', error);
        throw error;
    }
};

/**
 * Update lead status
 * @param {string} leadId - Lead ID
 * @param {string} status - New status
 * @param {number} score - Lead score (optional)
 * @returns {Promise<Object>} - Update result
 */
export const updateLeadStatus = async (leadId, status, score) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
        const updateCallable = httpsCallable(functions, 'updateLeadStatus');
        const result = await updateCallable({ leadId, status, score });

        return result.data;
    } catch (error) {
        console.error('Error updating lead:', error);
        throw error;
    }
};

/**
 * Get lead events
 * @param {string} leadId - Lead ID
 * @returns {Promise<Object>} - Lead events
 */
export const getLeadEvents = async (leadId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
        const eventsCallable = httpsCallable(functions, 'getLeadEvents');
        const result = await eventsCallable({ leadId });

        return result.data;
    } catch (error) {
        console.error('Error fetching lead events:', error);
        throw error;
    }
};

/**
 * Capture lead via Firebase callable function (CORS-free)
 * @param {Object} leadData - Lead data
 * @param {string} clientKey - Client key for authentication
 * @returns {Promise<Object>} - Result
 */
export const captureLead = async (leadData, clientKey) => {
    try {
        const captureLeadCallable = httpsCallable(functions, 'captureLeadCallable');
        const result = await captureLeadCallable({
            ...leadData,
            clientKey
        });
        
        return result.data;
    } catch (error) {
        console.error('Error capturing lead:', error);
        throw error;
    }
};
