/**
 * Add scraping job to Firestore queue
 * @param {Object} jobData - Job data
 * @returns {Promise<string>} - Queue document ID
 */
export function addScrapingJob(jobData: Object): Promise<string>;
/**
 * Get pending jobs from queue
 * @param {number} limit - Maximum jobs to fetch
 * @returns {Promise<Array>} - Array of pending jobs
 */
export function getPendingJobs(limit?: number): Promise<any[]>;
/**
 * Update job status
 * @param {string} queueId - Queue document ID
 * @param {string} status - New status (pending|processing|completed|failed)
 * @param {Object} updates - Additional updates
 */
export function updateJobStatus(queueId: string, status: string, updates?: Object): Promise<void>;
/**
 * Get queue statistics
 * @returns {Promise<Object>} - Queue stats
 */
export function getQueueStats(): Promise<Object>;
/**
 * Get user's active jobs count
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Count of active jobs
 */
export function getUserActiveJobsCount(userId: string): Promise<number>;
/**
 * Get job details from queue
 * @param {string} jobId - Job ID
 * @returns {Promise<Object|null>} - Job details or null
 */
export function getJobDetails(jobId: string): Promise<Object | null>;
/**
 * Cancel job
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} - Result
 */
export function cancelJob(jobId: string): Promise<Object>;
/**
 * Clean up old completed jobs (older than 7 days)
 * @returns {Promise<number>} - Number of jobs deleted
 */
export function cleanupOldJobs(): Promise<number>;
/**
 * Initialize queue (no-op for Firestore, kept for compatibility)
 */
export function initializeQueue(): Promise<boolean>;
/**
 * Get queue (no-op for Firestore, kept for compatibility)
 */
export function getQueue(): Promise<{
    type: string;
}>;
/**
 * Close queue (no-op for Firestore, kept for compatibility)
 */
export function closeQueue(): Promise<void>;
//# sourceMappingURL=leadFinderQueueService.d.ts.map