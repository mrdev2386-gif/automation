"use strict";
/**
 * CRM Webhook Service
 * Sends leads to external CRM systems via webhooks
 */
const axios = require('axios');
const admin = require('firebase-admin');
const db = admin.firestore();
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
/**
 * Send lead to webhook with retry logic
 */
const sendToWebhook = async (webhookUrl, leadData, retryCount = 0) => {
    try {
        const payload = {
            email: leadData.email,
            website: leadData.website,
            business_name: leadData.businessName,
            country: leadData.country,
            niche: leadData.niche,
            lead_score: leadData.lead_score || 0,
            timestamp: Date.now()
        };
        const response = await axios.post(webhookUrl, payload, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`✅ Webhook sent: ${leadData.email}`);
        return { success: true, response: response.data };
    }
    catch (error) {
        console.error(`❌ Webhook failed (attempt ${retryCount + 1}):`, error.message);
        if (retryCount < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
            return sendToWebhook(webhookUrl, leadData, retryCount + 1);
        }
        return { success: false, error: error.message };
    }
};
/**
 * Send Lead Finder job completion webhook
 * Sends batch notification when job completes
 */
const sendLeadFinderWebhook = async (webhookUrl, jobData, retryCount = 0) => {
    try {
        const payload = {
            event: 'lead_finder_completed',
            userId: jobData.userId,
            jobId: jobData.jobId,
            leadsCollected: jobData.leadsCollected,
            websitesScanned: jobData.websitesScanned,
            emailsFound: jobData.emailsFound,
            country: jobData.country,
            niche: jobData.niche,
            timestamp: jobData.timestamp,
            leads: jobData.leads || [] // Preview of leads
        };
        const response = await axios.post(webhookUrl, payload, {
            timeout: 15000,
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`✅ Lead Finder webhook sent: ${jobData.leadsCollected} leads`);
        return { success: true, response: response.data };
    }
    catch (error) {
        console.error(`❌ Lead Finder webhook failed (attempt ${retryCount + 1}):`, error.message);
        if (retryCount < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
            return sendLeadFinderWebhook(webhookUrl, jobData, retryCount + 1);
        }
        return { success: false, error: error.message };
    }
};
/**
 * Process webhook for lead
 */
const processLeadWebhook = async (userId, leadData) => {
    try {
        const configDoc = await db.collection('lead_finder_config').doc(userId).get();
        if (!configDoc.exists)
            return;
        const config = configDoc.data();
        const webhookUrl = config.webhook_url;
        if (!webhookUrl || webhookUrl.trim() === '')
            return;
        await sendToWebhook(webhookUrl, leadData);
    }
    catch (error) {
        console.error('Error processing webhook:', error);
    }
};
module.exports = {
    sendToWebhook,
    processLeadWebhook,
    sendLeadFinderWebhook
};
//# sourceMappingURL=webhookService.js.map