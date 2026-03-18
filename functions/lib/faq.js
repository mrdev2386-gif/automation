"use strict";
/**
 * FAQ Knowledge Base Management
 * Handles FAQ CRUD operations and semantic embeddings
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const db = admin.firestore();
const sanitizeInput = (input) => {
    if (typeof input !== 'string')
        return '';
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .substring(0, 10000);
};
module.exports = {
    sanitizeInput
};
//# sourceMappingURL=faq.js.map