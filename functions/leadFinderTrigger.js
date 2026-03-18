/**
 * Lead Finder Firestore Trigger
 * Automatically processes jobs when created in lead_finder_jobs collection
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * processLeadFinder - Firestore trigger
 * Triggers when a new document is created in lead_finder_jobs collection
 * Automatically starts processing the job
 */
const processLeadFinder = functions
    .region('us-central1')
    .firestore
    .document('lead_finder_jobs/{jobId}')
    .onCreate(async (snapshot, context) => {
        const jobId = context.params.jobId;
        const jobData = snapshot.data();

        console.log('🔥 PROCESS TRIGGERED:', jobId);
        console.log('📋 Job Data:', JSON.stringify(jobData, null, 2));

        try {
            // Validate job data
            if (!jobData) {
                console.error('❌ No data found in job document');
                return;
            }

            if (jobData.status !== 'queued') {
                console.log(`⏭️  Job ${jobId} status is ${jobData.status}, skipping processing`);
                return;
            }

            console.log(`✅ Starting automated processing for job ${jobId}`);
            console.log(`📍 Country: ${jobData.country}, Niche: ${jobData.niche}`);

            // Import lead finder service
            const { startAutomatedLeadFinder } = require('./src/services/leadFinderService');

            // Start automated lead finder
            const result = await startAutomatedLeadFinder(
                jobData.userId,
                jobData.country,
                jobData.niche,
                jobData.limit || 500
            );

            console.log(`✅ Job ${jobId} processing initiated successfully`);
            console.log(`📊 Result:`, JSON.stringify(result, null, 2));

            // Log activity
            await db.collection('activity_logs').add({
                userId: jobData.userId,
                action: 'LEAD_FINDER_TRIGGER_SUCCESS',
                message: `Job ${jobId} triggered and processing started`,
                metadata: {
                    jobId,
                    country: jobData.country,
                    niche: jobData.niche,
                    websitesDiscovered: result.websitesDiscovered || 0
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error(`❌ PROCESS ERROR for job ${jobId}:`, error);
            console.error('Stack:', error.stack);

            // Update job status to failed
            try {
                await snapshot.ref.update({
                    status: 'failed',
                    error: error.message,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // Log error
                await db.collection('activity_logs').add({
                    userId: jobData.userId,
                    action: 'LEAD_FINDER_TRIGGER_ERROR',
                    message: `Job ${jobId} trigger failed: ${error.message}`,
                    metadata: {
                        jobId,
                        error: error.message,
                        stack: error.stack
                    },
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
            } catch (updateError) {
                console.error('Failed to update job status:', updateError);
            }
        }
    });

module.exports = {
    processLeadFinder
};
