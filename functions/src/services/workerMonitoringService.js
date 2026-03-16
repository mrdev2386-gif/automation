/**
 * Worker Monitoring Service
 * Tracks worker health with heartbeat system
 */

const admin = require('firebase-admin');
const db = admin.firestore();

const HEARTBEAT_INTERVAL = 60 * 1000; // 60 seconds
const HEARTBEAT_TIMEOUT = 3 * 60 * 1000; // 3 minutes

let workerId = null;
let heartbeatTimer = null;
let activeJobs = 0;

/**
 * Initialize worker monitoring
 */
const initializeWorkerMonitoring = () => {
    workerId = `worker_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`🔍 Worker monitoring initialized: ${workerId}`);
    startHeartbeat();
};

/**
 * Start heartbeat updates
 */
const startHeartbeat = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);

    heartbeatTimer = setInterval(async () => {
        try {
            await db.collection('worker_status').doc(workerId).set({
                worker_id: workerId,
                active_jobs: activeJobs,
                last_heartbeat: admin.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            }, { merge: true });
        } catch (error) {
            console.error('Heartbeat update failed:', error);
        }
    }, HEARTBEAT_INTERVAL);
};

/**
 * Stop heartbeat
 */
const stopHeartbeat = async () => {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }

    if (workerId) {
        try {
            await db.collection('worker_status').doc(workerId).update({
                status: 'stopped',
                stopped_at: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error stopping heartbeat:', error);
        }
    }
};

/**
 * Increment active jobs
 */
const incrementActiveJobs = () => {
    activeJobs++;
};

/**
 * Decrement active jobs
 */
const decrementActiveJobs = () => {
    if (activeJobs > 0) activeJobs--;
};

/**
 * Check for dead workers
 */
const checkDeadWorkers = async () => {
    try {
        const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT);
        const deadWorkers = await db.collection('worker_status')
            .where('last_heartbeat', '<', threshold)
            .where('status', '==', 'active')
            .get();

        for (const doc of deadWorkers.docs) {
            await doc.ref.update({
                status: 'dead',
                died_at: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`💀 Marked worker as dead: ${doc.id}`);
        }

        return deadWorkers.size;
    } catch (error) {
        console.error('Error checking dead workers:', error);
        return 0;
    }
};

module.exports = {
    initializeWorkerMonitoring,
    stopHeartbeat,
    incrementActiveJobs,
    decrementActiveJobs,
    checkDeadWorkers
};
