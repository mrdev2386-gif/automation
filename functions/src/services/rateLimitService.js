/**
 * Production Hardening - Rate Limiting Service
 * Per-client and per-phone rate limiting for protection against abuse
 * 
 * Features:
 * - Per-client message rate limits
 * - Per-phone message rate limits  
 * - OpenAI call limits per client
 * - Daily token caps per client
 * - Firestore-backed for distributed environments
 */

const { getFirestore, admin } = require('../config/firebase');

const RATE_LIMIT_COLLECTION = 'rate_limits';
const USAGE_COUNTERS_COLLECTION = 'usage_counters';

// Rate limit configurations
const RATE_LIMITS = {
    // Inbound message limits
    inbound: {
        perPhonePerMinute: 10,      // Max 10 messages per phone per minute
        perClientPerMinute: 100      // Max 100 messages per client per minute
    },
    // Outbound (WhatsApp send) limits
    outbound: {
        perClientPerMinute: 50,     // Max 50 sends per client per minute
        perPhonePerMinute: 5        // Max 5 sends to same phone per minute
    },
    // OpenAI limits
    openai: {
        callsPerClientPerMinute: 20, // Max 20 OpenAI calls per client per minute
        dailyTokenCap: 100000,       // Max 100k tokens per client per day
        maxTokensPerResponse: 500     // Max tokens in AI response
    }
};

/**
 * Check if inbound message is allowed for a phone
 * @param {string} phoneNumber - User's phone number
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
 */
const checkInboundRateLimit = async (phoneNumber, clientUserId) => {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    try {
        const db = getFirestore();

        // Check per-phone limit
        const phoneKey = `phone:${phoneNumber}`;
        const phoneLimitDoc = await db.collection(RATE_LIMIT_COLLECTION).doc(phoneKey).get();

        let phoneCount = 0;
        let phoneResetAt = new Date(now + windowMs);

        if (phoneLimitDoc.exists) {
            const data = phoneLimitDoc.data();
            if (now - data.windowStart < windowMs) {
                phoneCount = data.count;
                phoneResetAt = new Date(data.windowStart + windowMs);
            }
        }

        if (phoneCount >= RATE_LIMITS.inbound.perPhonePerMinute) {
            return {
                allowed: false,
                reason: 'per_phone_limit',
                remaining: 0,
                resetAt: phoneResetAt
            };
        }

        // Check per-client limit
        if (clientUserId) {
            const clientKey = `client:${clientUserId}:inbound`;
            const clientLimitDoc = await db.collection(RATE_LIMIT_COLLECTION).doc(clientKey).get();

            let clientCount = 0;
            let clientResetAt = new Date(now + windowMs);

            if (clientLimitDoc.exists) {
                const data = clientLimitDoc.data();
                if (now - data.windowStart < windowMs) {
                    clientCount = data.count;
                    clientResetAt = new Date(data.windowStart + windowMs);
                }
            }

            if (clientCount >= RATE_LIMITS.inbound.perClientPerMinute) {
                return {
                    allowed: false,
                    reason: 'per_client_limit',
                    remaining: 0,
                    resetAt: clientResetAt
                };
            }
        }

        return {
            allowed: true,
            remaining: RATE_LIMITS.inbound.perPhonePerMinute - phoneCount - 1,
            resetAt: phoneResetAt
        };
    } catch (error) {
        console.error('Error checking rate limit:', error);
        // Fail open
        return { allowed: true, remaining: 10, resetAt: new Date(now + windowMs) };
    }
};

/**
 * Record an inbound message (increment counters)
 * @param {string} phoneNumber - User's phone number  
 * @param {string} clientUserId - Client user ID
 */
const recordInboundMessage = async (phoneNumber, clientUserId) => {
    const now = Date.now();
    const windowMs = 60000;

    try {
        const db = getFirestore();

        // Update phone counter
        const phoneKey = `phone:${phoneNumber}`;
        await db.collection(RATE_LIMIT_COLLECTION).doc(phoneKey).set({
            count: admin.firestore.FieldValue.increment(1),
            windowStart: now,
            expiresAt: new Date(now + windowMs * 2)
        }, { merge: true });

        // Update client counter
        if (clientUserId) {
            const clientKey = `client:${clientUserId}:inbound`;
            await db.collection(RATE_LIMIT_COLLECTION).doc(clientKey).set({
                count: admin.firestore.FieldValue.increment(1),
                windowStart: now,
                expiresAt: new Date(now + windowMs * 2)
            }, { merge: true });
        }
    } catch (error) {
        console.error('Error recording inbound message:', error);
    }
};

/**
 * Check if outbound send is allowed
 * @param {string} to - Recipient phone number
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
const checkOutboundRateLimit = async (to, clientUserId) => {
    const now = Date.now();
    const windowMs = 60000;

    try {
        const db = getFirestore();

        // Check per-phone outbound limit
        const phoneKey = `outbound:phone:${to}`;
        const phoneDoc = await db.collection(RATE_LIMIT_COLLECTION).doc(phoneKey).get();

        if (phoneDoc.exists) {
            const data = phoneDoc.data();
            if (now - data.windowStart < windowMs && data.count >= RATE_LIMITS.outbound.perPhonePerMinute) {
                return { allowed: false, reason: 'phone_outbound_limit' };
            }
        }

        // Check per-client outbound limit
        if (clientUserId) {
            const clientKey = `outbound:client:${clientUserId}`;
            const clientDoc = await db.collection(RATE_LIMIT_COLLECTION).doc(clientKey).get();

            if (clientDoc.exists) {
                const data = clientDoc.data();
                if (now - data.windowStart < windowMs && data.count >= RATE_LIMITS.outbound.perClientPerMinute) {
                    return { allowed: false, reason: 'client_outbound_limit' };
                }
            }
        }

        return { allowed: true };
    } catch (error) {
        console.error('Error checking outbound rate limit:', error);
        return { allowed: true };
    }
};

/**
 * Record an outbound send
 * @param {string} to - Recipient phone
 * @param {string} clientUserId - Client user ID
 */
const recordOutboundSend = async (to, clientUserId) => {
    const now = Date.now();
    const windowMs = 60000;

    try {
        const db = getFirestore();

        // Update phone counter
        const phoneKey = `outbound:phone:${to}`;
        await db.collection(RATE_LIMIT_COLLECTION).doc(phoneKey).set({
            count: admin.firestore.FieldValue.increment(1),
            windowStart: now,
            expiresAt: new Date(now + windowMs * 2)
        }, { merge: true });

        // Update client counter
        if (clientUserId) {
            const clientKey = `outbound:client:${clientUserId}`;
            await db.collection(RATE_LIMIT_COLLECTION).doc(clientKey).set({
                count: admin.firestore.FieldValue.increment(1),
                windowStart: now,
                expiresAt: new Date(now + windowMs * 2)
            }, { merge: true });
        }
    } catch (error) {
        console.error('Error recording outbound send:', error);
    }
};

/**
 * Check if OpenAI call is allowed for client
 * @param {string} clientUserId - Client user ID
 * @param {number} estimatedTokens - Estimated tokens for this call
 * @returns {Promise<{allowed: boolean, reason?: string, remainingTokens?: number}>}
 */
const checkOpenAIRateLimit = async (clientUserId, estimatedTokens = 0) => {
    const now = Date.now();
    const windowMs = 60000;
    const dayMs = 24 * 60 * 60 * 1000;

    try {
        const db = getFirestore();

        // Check per-minute call limit
        const callKey = `openai:calls:${clientUserId}`;
        const callDoc = await db.collection(RATE_LIMIT_COLLECTION).doc(callKey).get();

        if (callDoc.exists) {
            const data = callDoc.data();
            if (now - data.windowStart < windowMs && data.count >= RATE_LIMITS.openai.callsPerClientPerMinute) {
                return { allowed: false, reason: 'openai_call_limit' };
            }
        }

        // Check daily token limit
        const usageKey = `openai:usage:${clientUserId}`;
        const usageDoc = await db.collection(USAGE_COUNTERS_COLLECTION).doc(usageKey).get();

        if (usageDoc.exists) {
            const data = usageDoc.data();
            const resetAt = data.resetAt?.toDate?.() || new Date(now + dayMs);

            // Check if we need to reset (new day)
            if (now > resetAt.getTime()) {
                // Reset counter
                await db.collection(USAGE_COUNTERS_COLLECTION).doc(usageKey).set({
                    tokensUsed: estimatedTokens,
                    resetAt: new Date(now + dayMs),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                return { allowed: true, remainingTokens: RATE_LIMITS.openai.dailyTokenCap - estimatedTokens };
            }

            // Check if adding these tokens would exceed limit
            const currentUsage = data.tokensUsed || 0;
            if (currentUsage + estimatedTokens > RATE_LIMITS.openai.dailyTokenCap) {
                return {
                    allowed: false,
                    reason: 'openai_token_limit',
                    remainingTokens: RATE_LIMITS.openai.dailyTokenCap - currentUsage
                };
            }

            return {
                allowed: true,
                remainingTokens: RATE_LIMITS.openai.dailyTokenCap - currentUsage - estimatedTokens
            };
        }

        // First time - initialize counter
        await db.collection(USAGE_COUNTERS_COLLECTION).doc(usageKey).set({
            tokensUsed: estimatedTokens,
            resetAt: new Date(now + dayMs),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            allowed: true,
            remainingTokens: RATE_LIMITS.openai.dailyTokenCap - estimatedTokens
        };
    } catch (error) {
        console.error('Error checking OpenAI rate limit:', error);
        return { allowed: true };
    }
};

/**
 * Record OpenAI token usage
 * @param {string} clientUserId - Client user ID
 * @param {number} tokensUsed - Number of tokens used
 */
const recordOpenAIUsage = async (clientUserId, tokensUsed) => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    try {
        const db = getFirestore();

        // Update call counter
        const callKey = `openai:calls:${clientUserId}`;
        await db.collection(RATE_LIMIT_COLLECTION).doc(callKey).set({
            count: admin.firestore.FieldValue.increment(1),
            windowStart: now,
            expiresAt: new Date(now + 120000) // 2 minutes
        }, { merge: true });

        // Update token usage
        const usageKey = `openai:usage:${clientUserId}`;
        const usageDoc = await db.collection(USAGE_COUNTERS_COLLECTION).doc(usageKey).get();

        if (usageDoc.exists) {
            const data = usageDoc.data();
            const resetAt = data.resetAt?.toDate?.() || new Date(now + dayMs);

            if (now < resetAt.getTime()) {
                // Add to existing usage
                await db.collection(USAGE_COUNTERS_COLLECTION).doc(usageKey).update({
                    tokensUsed: admin.firestore.FieldValue.increment(tokensUsed),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    } catch (error) {
        console.error('Error recording OpenAI usage:', error);
    }
};

/**
 * Get current usage for a client
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<Object>} - Usage stats
 */
const getClientUsageStats = async (clientUserId) => {
    try {
        const db = getFirestore();

        const [callDoc, usageDoc] = await Promise.all([
            db.collection(RATE_LIMIT_COLLECTION).doc(`openai:calls:${clientUserId}`).get(),
            db.collection(USAGE_COUNTERS_COLLECTION).doc(`openai:usage:${clientUserId}`).get()
        ]);

        const now = Date.now();

        return {
            callsThisMinute: callDoc.exists ? callDoc.data().count : 0,
            tokensUsedToday: usageDoc.exists ? usageDoc.data().tokensUsed : 0,
            tokenLimit: RATE_LIMITS.openai.dailyTokenCap,
            resetAt: usageDoc.exists && usageDoc.data().resetAt ?
                usageDoc.data().resetAt.toDate().toISOString() :
                new Date(now + 24 * 60 * 60 * 1000).toISOString()
        };
    } catch (error) {
        console.error('Error getting client usage stats:', error);
        return {
            callsThisMinute: 0,
            tokensUsedToday: 0,
            tokenLimit: RATE_LIMITS.openai.dailyTokenCap,
            error: error.message
        };
    }
};

/**
 * Clean up expired rate limit entries
 * @returns {Promise<number>} - Number cleaned up
 */
const cleanupExpiredRateLimits = async () => {
    try {
        const db = getFirestore();
        const now = new Date();

        const snapshot = await db.collection(RATE_LIMIT_COLLECTION)
            .where('expiresAt', '<', now)
            .limit(500)
            .get();

        if (snapshot.empty) return 0;

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        return snapshot.size;
    } catch (error) {
        console.error('Error cleaning up rate limits:', error);
        return 0;
    }
};

module.exports = {
    checkInboundRateLimit,
    recordInboundMessage,
    checkOutboundRateLimit,
    recordOutboundSend,
    checkOpenAIRateLimit,
    recordOpenAIUsage,
    getClientUsageStats,
    cleanupExpiredRateLimits,
    RATE_LIMITS
};
