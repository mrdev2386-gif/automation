"use strict";
/**
 * Lead Finder Queue Service - Firestore Edition
 * Replaces Redis/BullMQ with Firestore-based queue
 *
 * Benefits:
 * - Works in Cloud Functions (no external Redis needed)
 * - Scalable and reliable
 * - Easy to monitor and debug
 * - No additional dependencies
 */
const admin = require('firebase-admin');
const db = admin.firestore();
// ============================================================================
// QUEUE MANAGEMENT - Firestore Based
// ============================================================================
/**
 * Add scraping job to Firestore queue
 * @param {Object} jobData - Job data
 * @returns {Promise<string>} - Queue document ID
 */
const addScrapingJob = async (jobData) => {
    try {
        const { jobId, userId, websites, country, niche, campaignId } = jobData;
        // Validate required fields
        if (!jobId || !userId || !websites || !country || !niche) {
            throw new Error('Missing required job fields');
        }
        // Create queue entry
        const queueRef = db.collection('lead_finder_queue').doc();
        await queueRef.set({
            jobId,
            userId,
            campaignId: campaignId || null,
            country,
            niche,
            websites,
            status: 'pending',
            progress: {
                websitesScanned: 0,
                emailsFound: 0
            },
            error: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAt: null,
            completedAt: null
        });
        console.log(`📋 Job ${jobId} added to Firestore queue`);
        return queueRef.id;
    }
    catch (error) {
        console.error('Error adding job to queue:', error);
        throw error;
    }
};
/**
 * Get pending jobs from queue
 * @param {number} limit - Maximum jobs to fetch
 * @returns {Promise<Array>} - Array of pending jobs
 */
const getPendingJobs = async (limit = 5) => {
    try {
        const snapshot = await db.collection('lead_finder_queue')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'asc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
    catch (error) {
        console.error('Error fetching pending jobs:', error);
        return [];
    }
};
/**
 * Update job status
 * @param {string} queueId - Queue document ID
 * @param {string} status - New status (pending|processing|completed|failed)
 * @param {Object} updates - Additional updates
 */
const updateJobStatus = async (queueId, status, updates = {}) => {
    try {
        const updateData = {
            status,
            ...updates
        };
        // Add timestamp based on status
        if (status === 'processing') {
            updateData.processedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        else if (status === 'completed' || status === 'failed') {
            updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        await db.collection('lead_finder_queue').doc(queueId).update(updateData);
        console.log(`✅ Queue job ${queueId} status updated to ${status}`);
    }
    catch (error) {
        console.error('Error updating job status:', error);
        throw error;
    }
};
/**
 * Get queue statistics
 * @returns {Promise<Object>} - Queue stats
 */
const getQueueStats = async () => {
    try {
        const [pending, processing, completed, failed] = await Promise.all([
            db.collection('lead_finder_queue').where('status', '==', 'pending').count().get(),
            db.collection('lead_finder_queue').where('status', '==', 'processing').count().get(),
            db.collection('lead_finder_queue').where('status', '==', 'completed').count().get(),
            db.collection('lead_finder_queue').where('status', '==', 'failed').count().get()
        ]);
        return {
            pending: pending.data().count,
            processing: processing.data().count,
            completed: completed.data().count,
            failed: failed.data().count,
            total: pending.data().count + processing.data().count + completed.data().count + failed.data().count
        };
    }
    catch (error) {
        console.error('Error getting queue stats:', error);
        return {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            total: 0
        };
    }
};
/**
 * Get user's active jobs count
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Count of active jobs
 */
const getUserActiveJobsCount = async (userId) => {
    try {
        const snapshot = await db.collection('lead_finder_queue')
            .where('userId', '==', userId)
            .where('status', 'in', ['pending', 'processing'])
            .get();
        return snapshot.size;
    }
    catch (error) {
        console.error('Error getting user active jobs:', error);
        return 0;
    }
};
/**
 * Get job details from queue
 * @param {string} jobId - Job ID
 * @returns {Promise<Object|null>} - Job details or null
 */
const getJobDetails = async (jobId) => {
    try {
        const snapshot = await db.collection('lead_finder_queue')
            .where('jobId', '==', jobId)
            .limit(1)
            .get();
        if (snapshot.empty) {
            return null;
        }
        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    }
    catch (error) {
        console.error('Error getting job details:', error);
        return null;
    }
};
/**
 * Cancel job
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} - Result
 */
const cancelJob = async (jobId) => {
    try {
        const snapshot = await db.collection('lead_finder_queue')
            .where('jobId', '==', jobId)
            .limit(1)
            .get();
        if (snapshot.empty) {
            return { success: false, message: 'Job not found' };
        }
        const doc = snapshot.docs[0];
        // Only cancel if still pending
        if (doc.data().status === 'pending') {
            await doc.ref.update({
                status: 'cancelled',
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, message: 'Job cancelled' };
        }
        else {
            return { success: false, message: 'Job cannot be cancelled (already processing or completed)' };
        }
    }
    catch (error) {
        console.error('Error cancelling job:', error);
        return { success: false, message: error.message };
    }
};
/**
 * Clean up old completed jobs (older than 7 days)
 * @returns {Promise<number>} - Number of jobs deleted
 */
const cleanupOldJobs = async () => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const snapshot = await db.collection('lead_finder_queue')
            .where('status', 'in', ['completed', 'failed', 'cancelled'])
            .where('completedAt', '<', sevenDaysAgo)
            .limit(500)
            .get();
        if (snapshot.empty) {
            return 0;
        }
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`🧹 Cleaned up ${snapshot.size} old queue jobs`);
        return snapshot.size;
    }
    catch (error) {
        console.error('Error cleaning up old jobs:', error);
        return 0;
    }
};
/**
 * Initialize queue (no-op for Firestore, kept for compatibility)
 */
const initializeQueue = async () => {
    console.log('✅ Firestore queue ready (no initialization needed)');
    return true;
};
/**
 * Get queue (no-op for Firestore, kept for compatibility)
 */
const getQueue = async () => {
    return { type: 'firestore' };
};
/**
 * Close queue (no-op for Firestore, kept for compatibility)
 */
const closeQueue = async () => {
    console.log('✅ Firestore queue closed');
};
// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
    // Core queue operations
    addScrapingJob,
    getPendingJobs,
    updateJobStatus,
    getQueueStats,
    getUserActiveJobsCount,
    getJobDetails,
    cancelJob,
    cleanupOldJobs,
    // Compatibility functions (no-op)
    initializeQueue,
    getQueue,
    closeQueue
};
//# sourceMappingURL=leadFinderQueueService.js.map