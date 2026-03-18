"use strict";
/**
 * Webhook Management Module
 * Handles incoming webhooks from Meta (WhatsApp)
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
/**
 * whatsappWebhook - Production WhatsApp Webhook Handler
 */
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
module.exports = {
    whatsappWebhook
};
//# sourceMappingURL=webhooks.js.map