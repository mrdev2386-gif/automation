"use strict";
/**
 * AI Lead Agent Module
 * Handles automated lead generation, qualification, and pipeline management
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const { logActivity } = require('./auth');
/**
 * startAILeadCampaign - Initialize AI lead generation campaign
 */
const startAILeadCampaign = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    try {
        const userId = context.auth.uid;
        const { campaignId, name, country, niche, leadLimit, minScore } = data;
        if (!campaignId || !name || !country || !niche) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists)
            throw new functions.https.HttpsError('not-found', 'User not found');
        const userData = userDoc.data();
        if (!userData.assignedAutomations || !userData.assignedAutomations.includes('ai_lead_agent')) {
            throw new functions.https.HttpsError('permission-denied', 'AI Lead Agent not assigned');
        }
        await db.collection('ai_lead_campaigns').doc(campaignId).collection('leads').doc('_init').set({
            initialized: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        await logActivity(userId, 'AI_CAMPAIGN_STARTED', { campaignId, country, niche, leadLimit });
        const queueRef = db.collection('lead_finder_queue').doc();
        await queueRef.set({
            userId,
            type: 'ai_lead_campaign',
            campaignId,
            country,
            niche,
            limit: leadLimit,
            minScore,
            status: 'pending',
            progress: {
                websitesDiscovered: 0,
                websitesScanned: 0,
                emailsFound: 0,
                leadsQualified: 0,
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await db.collection('lead_finder_queue').doc(queueRef.id).set({
            campaignId: campaignId,
            userId: userId,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return { success: true, campaignId, message: 'Campaign started successfully' };
    }
    catch (error) {
        console.error('Error starting AI campaign:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to start campaign');
    }
});
/**
 * generateAIEmailDraft - Generate personalized cold email using AI
 */
const generateAIEmailDraft = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    try {
        const { businessName, website, niche } = data;
        if (!businessName || !website || !niche)
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        const emailTemplate = {
            subject: `Partner with ${businessName} - ${niche} Solutions`,
            body: `Hi there,\n\nI hope this email finds you well. I came across ${businessName} and was impressed by your work in the ${niche} industry.\n\nI wanted to reach out because I believe we could create significant value together. We specialize in helping ${niche} companies just like yours scale their operations and reach new markets.\n\nBest regards,\n[Your Name]`
        };
        return emailTemplate;
    }
    catch (error) {
        console.error('Error generating email draft:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to generate email');
    }
});
/**
 * generateAIWhatsappMessage - Generate WhatsApp follow-up message
 */
const generateAIWhatsappMessage = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    try {
        const { businessName, niche } = data;
        if (!businessName || !niche)
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        const whatsappTemplate = {
            message: `Hi ${businessName} 👋\n\nI noticed you work in the ${niche} space. We've been helping businesses like yours achieve amazing results in growth and efficiency.\n\nWould you be open to a quick 15-min call to explore how we could add value to your business? \n\nLet me know! 😊\n\n[Your Name]`
        };
        return whatsappTemplate;
    }
    catch (error) {
        console.error('Error generating WhatsApp message:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to generate message');
    }
});
/**
 * qualifyAILead - Score and qualify a lead based on criteria
 */
const qualifyAILead = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    try {
        const { campaignId, leadId, lead } = data;
        if (!campaignId || !leadId || !lead)
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        let score = lead.score || 0;
        const premiumDomains = ['.com', '.io', '.co', '.biz'];
        const domain = lead.email?.split('@')[1] || '';
        if (premiumDomains.some(d => domain.endsWith(d)))
            score += 2;
        const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        if (freeDomains.includes(domain))
            score -= 2;
        let qualificationStatus = 'cold';
        if (score >= 15)
            qualificationStatus = 'hot';
        else if (score >= 12)
            qualificationStatus = 'warm';
        await db.collection('ai_lead_campaigns').doc(campaignId).collection('leads').doc(leadId).update({
            score: Math.min(score, 20),
            qualificationStatus,
            qualifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            stage: qualificationStatus === 'hot' ? 'qualified' : 'new'
        });
        return { leadId, score: Math.min(score, 20), qualificationStatus, qualified: qualificationStatus !== 'cold' };
    }
    catch (error) {
        console.error('Error qualifying lead:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to qualify lead');
    }
});
/**
 * updateLeadPipelineStage - Move lead between pipeline stages
 */
const updateLeadPipelineStage = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    try {
        const userId = context.auth.uid;
        const { campaignId, leadId, newStage } = data;
        if (!campaignId || !leadId || !newStage)
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        const campaignDoc = await db.collection('ai_lead_campaigns').doc(campaignId).get();
        if (!campaignDoc.exists || campaignDoc.data().userId !== userId)
            throw new functions.https.HttpsError('permission-denied', 'Campaign not found');
        const validStages = ['new', 'qualified', 'contacted', 'responded', 'converted'];
        if (!validStages.includes(newStage))
            throw new functions.https.HttpsError('invalid-argument', 'Invalid stage');
        await db.collection('ai_lead_campaigns').doc(campaignId).collection('leads').doc(leadId).update({
            stage: newStage,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, leadId, newStage };
    }
    catch (error) {
        console.error('Error updating lead stage:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to update lead');
    }
});
module.exports = {
    startAILeadCampaign,
    generateAIEmailDraft,
    generateAIWhatsappMessage,
    qualifyAILead,
    updateLeadPipelineStage
};
//# sourceMappingURL=aiLeads.js.map