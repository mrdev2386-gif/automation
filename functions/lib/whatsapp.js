"use strict";
/**
 * WhatsApp Webhook & Production Functions
 * Handles WhatsApp message processing and queue management
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const whatsappWebhook = functions.https.onRequest(async (req, res) => {
    try {
        const { handleWebhookProduction } = require('./src/whatsapp/webhookProduction');
        return handleWebhookProduction(req, res);
    }
    catch (error) {
        console.error('Webhook error:', error);
        return res.sendStatus(200);
    }
});
const processMessageQueue = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    try {
        console.log('Processing message queue...');
        const { processPendingQueue } = require('./src/whatsapp/queueSender');
        const result = await processPendingQueue(100);
        console.log(`Queue processing result: ${JSON.stringify(result)}`);
        return null;
    }
    catch (error) {
        console.error('Queue processing error:', error);
        return null;
    }
});
module.exports = {
    whatsappWebhook,
    processMessageQueue
};
//# sourceMappingURL=whatsapp.js.map