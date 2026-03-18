"use strict";
/**
 * Production Hardening - OpenAI Cost Protection Module
 * Protects against runaway AI costs with per-client limits
 *
 * Features:
 * - Token counting and limits
 * - Daily caps per client
 * - Graceful fallback responses
 * - Usage tracking
 */
const { getFirestore, admin } = require('../config/firebase');
const USAGE_COUNTERS_COLLECTION = 'usage_counters';
// Cost protection settings
const COST_PROTECTION = {
    // Default limits (can be overridden per client)
    defaultDailyTokenLimit: 100000,
    defaultMaxResponseTokens: 500,
    maxTokensPerEmbedding: 8000, // For embedding calls
    // Token estimation (rough estimates for cost control)
    avgTokensPerWord: 1.3,
    // Fallback message when limits hit
    fallbackMessage: "I apologize, but I'm currently experiencing high demand. Let me connect you with our team who can assist you right away.",
    // Cost tracking
    costPer1kTokens: 0.002, // For GPT-4o mini
};
/**
 * Estimate tokens from text (rough approximation)
 * @param {string} text - Text to estimate
 * @returns {number} - Estimated token count
 */
const estimateTokens = (text) => {
    if (!text)
        return 0;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount * COST_PROTECTION.avgTokensPerWord);
};
/**
 * Check if client can make an OpenAI call
 * @param {string} clientUserId - Client user ID
 * @param {number} estimatedTokens - Estimated tokens for this operation
 * @returns {Promise<{allowed: boolean, reason?: string, remaining?: number}>}
 */
const checkOpenAICapacity = async (clientUserId, estimatedTokens = 1000) => {
    try {
        const db = getFirestore();
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        // Get client's custom limits if set
        const clientConfig = await db.collection('client_configs').doc(clientUserId).get();
        const dailyLimit = clientConfig.exists && clientConfig.data().openaiDailyTokenLimit
            ? clientConfig.data().openaiDailyTokenLimit
            : COST_PROTECTION.defaultDailyTokenLimit;
        // Get current usage
        const usageDoc = await db.collection(USAGE_COUNTERS_COLLECTION)
            .doc(`openai:${clientUserId}`)
            .get();
        if (usageDoc.exists) {
            const data = usageDoc.data();
            const resetAt = data.resetAt?.toDate?.() || new Date(now + dayMs);
            // Check if reset needed (new day)
            if (now >= resetAt.getTime()) {
                // Reset for new day
                await db.collection(USAGE_COUNTERS_COLLECTION).doc(`openai:${clientUserId}`).set({
                    tokensUsed: estimatedTokens,
                    resetAt: new Date(now + dayMs),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                return {
                    allowed: true,
                    remaining: dailyLimit - estimatedTokens
                };
            }
            // Check if adding these tokens would exceed limit
            const currentUsage = data.tokensUsed || 0;
            if (currentUsage + estimatedTokens > dailyLimit) {
                return {
                    allowed: false,
                    reason: 'daily_limit_exceeded',
                    remaining: Math.max(0, dailyLimit - currentUsage)
                };
            }
            return {
                allowed: true,
                remaining: dailyLimit - currentUsage - estimatedTokens
            };
        }
        // First time - initialize
        await db.collection(USAGE_COUNTERS_COLLECTION).doc(`openai:${clientUserId}`).set({
            tokensUsed: estimatedTokens,
            resetAt: new Date(now + dayMs),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            allowed: true,
            remaining: dailyLimit - estimatedTokens
        };
    }
    catch (error) {
        console.error('Error checking OpenAI capacity:', error);
        // Fail open
        return { allowed: true };
    }
};
/**
 * Record actual OpenAI token usage after API call
 * @param {string} clientUserId - Client user ID
 * @param {number} tokensUsed - Actual tokens used
 */
const recordOpenAIUsage = async (clientUserId, tokensUsed) => {
    try {
        const db = getFirestore();
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const usageRef = db.collection(USAGE_COUNTERS_COLLECTION).doc(`openai:${clientUserId}`);
        // Use transaction to ensure accurate counting
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(usageRef);
            if (doc.exists) {
                const data = doc.data();
                const resetAt = data.resetAt?.toDate?.() || new Date(now + dayMs);
                if (now < resetAt.getTime()) {
                    // Add to existing usage
                    transaction.update(usageRef, {
                        tokensUsed: admin.firestore.FieldValue.increment(tokensUsed),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                else {
                    // Reset for new day
                    transaction.set(usageRef, {
                        tokensUsed: tokensUsed,
                        resetAt: new Date(now + dayMs),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            }
            else {
                // Initialize
                transaction.set(usageRef, {
                    tokensUsed: tokensUsed,
                    resetAt: new Date(now + dayMs),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        });
    }
    catch (error) {
        console.error('Error recording OpenAI usage:', error);
    }
};
/**
 * Get OpenAI usage for a client
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<Object>} - Usage statistics
 */
const getOpenAIUsage = async (clientUserId) => {
    try {
        const db = getFirestore();
        const usageDoc = await db.collection(USAGE_COUNTERS_COLLECTION)
            .doc(`openai:${clientUserId}`)
            .get();
        if (!usageDoc.exists) {
            return {
                tokensUsed: 0,
                limit: COST_PROTECTION.defaultDailyTokenLimit,
                resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
        }
        const data = usageDoc.data();
        return {
            tokensUsed: data.tokensUsed || 0,
            limit: COST_PROTECTION.defaultDailyTokenLimit,
            resetAt: data.resetAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            percentUsed: Math.round(((data.tokensUsed || 0) / COST_PROTECTION.defaultDailyTokenLimit) * 100)
        };
    }
    catch (error) {
        console.error('Error getting OpenAI usage:', error);
        return { error: error.message };
    }
};
/**
 * Get the fallback message when limits are hit
 * @param {string} customMessage - Optional custom fallback message
 * @returns {string} - Fallback message
 */
const getFallbackMessage = (customMessage = null) => {
    return customMessage || COST_PROTECTION.fallbackMessage;
};
/**
 * Estimate cost for tokens
 * @param {number} tokens - Number of tokens
 * @returns {number} - Estimated cost in USD
 */
const estimateCost = (tokens) => {
    return (tokens / 1000) * COST_PROTECTION.costPer1kTokens;
};
/**
 * Get max response tokens for a client
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<number>} - Max tokens allowed
 */
const getMaxResponseTokens = async (clientUserId) => {
    try {
        const db = getFirestore();
        const clientConfig = await db.collection('client_configs').doc(clientUserId).get();
        if (clientConfig.exists && clientConfig.data().openaiMaxResponseTokens) {
            return clientConfig.data().openaiMaxResponseTokens;
        }
        return COST_PROTECTION.defaultMaxResponseTokens;
    }
    catch (error) {
        return COST_PROTECTION.defaultMaxResponseTokens;
    }
};
/**
 * Check and cap tokens if needed
 * @param {number} requestedTokens - Tokens requested
 * @param {number} maxAllowed - Maximum allowed
 * @returns {number} - Capped token count
 */
const capTokens = (requestedTokens, maxAllowed) => {
    return Math.min(requestedTokens, maxAllowed);
};
module.exports = {
    checkOpenAICapacity,
    recordOpenAIUsage,
    getOpenAIUsage,
    getFallbackMessage,
    estimateCost,
    getMaxResponseTokens,
    capTokens,
    estimateTokens,
    COST_PROTECTION
};
//# sourceMappingURL=openaiProtection.js.map