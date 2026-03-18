"use strict";
/**
 * Production Hardening - FAQ Semantic Safety Guard
 * Prevents false semantic matches with confidence thresholds
 *
 * Features:
 * - Configurable confidence thresholds per client
 * - Confirmation fallback for borderline matches
 * - Strict no-match zone
 * - Multi-stage matching (exact → keyword → semantic)
 */
const { getFirestore, admin } = require('../config/firebase');
// Default safety thresholds
const DEFAULT_THRESHOLDS = {
    // Minimum similarity to consider a match
    minimumMatch: 0.75,
    // Confirmation zone: between minimumMatch and this + 0.03
    // Messages in this range trigger confirmation
    confirmationZone: 0.03,
    // Grace zone for high confidence matches
    highConfidence: 0.90
};
// Fallback responses
const FALLBACK_RESPONSES = [
    "I'm not quite sure I understood that. Could you rephrase?",
    "I don't have information about that. Would you like to speak with our team?",
    "That's outside my knowledge. Let me connect you with someone who can help.",
    "I'm not certain I can help with that. Would you like to speak with a team member?"
];
const CONFIRMATION_PROMPTS = [
    "Did you mean: \"{faqAnswer}\"?",
    "I found something similar: \"{faqAnswer}\" - is this what you're looking for?",
    "Based on your question, here's what I found: \"{faqAnswer}\" - does this help?"
];
/**
 * Get client-specific thresholds
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<Object>} - Threshold configuration
 */
const getClientThresholds = async (clientUserId) => {
    try {
        const db = getFirestore();
        const configDoc = await db.collection('client_configs').doc(clientUserId).get();
        if (configDoc.exists && configDoc.data().faqConfidenceThreshold) {
            const custom = configDoc.data().faqConfidenceThreshold;
            return {
                minimumMatch: custom.minimumMatch || DEFAULT_THRESHOLDS.minimumMatch,
                confirmationZone: custom.confirmationZone || DEFAULT_THRESHOLDS.confirmationZone,
                highConfidence: custom.highConfidence || DEFAULT_THRESHOLDS.highConfidence
            };
        }
        return DEFAULT_THRESHOLDS;
    }
    catch (error) {
        console.error('Error getting client thresholds:', error);
        return DEFAULT_THRESHOLDS;
    }
};
/**
 * Categorize a match based on similarity score and thresholds
 * @param {number} similarity - Similarity score (0-1)
 * @param {Object} thresholds - Client thresholds
 * @returns {Object} - Match categorization
 */
const categorizeMatch = (similarity, thresholds) => {
    const { minimumMatch, confirmationZone, highConfidence } = thresholds;
    // High confidence - definitely a match
    if (similarity >= highConfidence) {
        return {
            category: 'high_confidence',
            shouldUse: true,
            needsConfirmation: false,
            message: 'High confidence match - using answer directly'
        };
    }
    // Confirmation zone - borderline, needs user confirmation
    if (similarity >= minimumMatch && similarity < minimumMatch + confirmationZone) {
        return {
            category: 'confirmation_zone',
            shouldUse: false, // Don't auto-use
            needsConfirmation: true,
            message: 'Borderline match - requires user confirmation'
        };
    }
    // Below minimum - no match
    if (similarity < minimumMatch) {
        return {
            category: 'no_match',
            shouldUse: false,
            needsConfirmation: false,
            message: 'Below threshold - not using'
        };
    }
    // Regular match zone (minimumMatch + confirmationZone to highConfidence)
    return {
        category: 'good_match',
        shouldUse: true,
        needsConfirmation: false,
        message: 'Good match - using answer'
    };
};
/**
 * Get confirmation prompt with FAQ answer
 * @param {string} faqAnswer - The matched FAQ answer
 * @returns {string} - Confirmation prompt
 */
const getConfirmationPrompt = (faqAnswer) => {
    const template = CONFIRMATION_PROMPTS[Math.floor(Math.random() * CONFIRMATION_PROMPTS.length)];
    // Truncate answer if too long
    const truncatedAnswer = faqAnswer.length > 100
        ? faqAnswer.substring(0, 97) + '...'
        : faqAnswer;
    return template.replace('{faqAnswer}', truncatedAnswer);
};
/**
 * Get a fallback response
 * @returns {string} - Random fallback message
 */
const getFallbackResponse = () => {
    return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
};
/**
 * Safe FAQ matching with all safety guards
 * This should be used instead of direct semantic matching
 *
 * @param {string} clientUserId - Client user ID
 * @param {string} message - User message
 * @param {Object} faqs - Array of FAQ objects with embeddings
 * @returns {Promise<Object>} - Match result with safety checks
 */
const safeFaqMatch = async (clientUserId, message, faqs) => {
    // Get client-specific thresholds
    const thresholds = await getClientThresholds(clientUserId);
    // Stage 1: Try exact match
    const normalizedMessage = message.toLowerCase().trim();
    for (const faq of faqs) {
        if (faq.question.toLowerCase().trim() === normalizedMessage) {
            console.log(`FAQ safety: Exact match found for "${message}"`);
            return {
                found: true,
                faq: faq,
                similarity: 1.0,
                category: 'exact',
                useAnswer: true,
                needsConfirmation: false
            };
        }
    }
    // Stage 2: Try keyword match
    for (const faq of faqs) {
        const questionLower = faq.question.toLowerCase();
        const questionWords = questionLower.split(/\s+/).filter(w => w.length > 3);
        const matchCount = questionWords.filter(word => normalizedMessage.includes(word)).length;
        if (matchCount >= Math.min(2, questionWords.length)) {
            console.log(`FAQ safety: Keyword match found for "${message}"`);
            return {
                found: true,
                faq: faq,
                similarity: 0.85,
                category: 'keyword',
                useAnswer: true,
                needsConfirmation: false
            };
        }
    }
    // Stage 3: Semantic matching with safety guard
    // This is where we need the embedding similarity check
    // The actual semantic matching should be done by the caller with these thresholds
    // For now, return that no safe match was found
    return {
        found: false,
        category: 'no_safe_match',
        useAnswer: false,
        needsConfirmation: false,
        fallback: getFallbackResponse()
    };
};
/**
 * Evaluate a semantic match with safety guards
 * @param {number} similarity - The similarity score
 * @param {Object} faq - The matched FAQ
 * @param {Object} thresholds - Client thresholds
 * @returns {Object} - Evaluation result
 */
const evaluateSemanticMatch = (similarity, faq, thresholds) => {
    const evaluation = categorizeMatch(similarity, thresholds);
    return {
        ...evaluation,
        faq: faq,
        similarity: similarity,
        confirmationPrompt: evaluation.needsConfirmation
            ? getConfirmationPrompt(faq.answer)
            : null,
        fallback: evaluation.category === 'no_match' ? getFallbackResponse() : null
    };
};
/**
 * Create a confirmation buttons payload for borderline matches
 * @param {string} faqAnswer - The matched FAQ answer
 * @returns {Object} - Interactive buttons payload
 */
const createConfirmationButtons = (faqAnswer) => {
    const truncatedAnswer = faqAnswer.length > 50
        ? faqAnswer.substring(0, 47) + '...'
        : faqAnswer;
    return {
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: `I found this: "${truncatedAnswer}" - is this what you need?`
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'faq_yes',
                            title: 'Yes ✅'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'faq_no',
                            title: 'No, help me'
                        }
                    }
                ]
            }
        }
    };
};
module.exports = {
    getClientThresholds,
    categorizeMatch,
    getConfirmationPrompt,
    getFallbackResponse,
    safeFaqMatch,
    evaluateSemanticMatch,
    createConfirmationButtons,
    DEFAULT_THRESHOLDS,
    FALLBACK_RESPONSES,
    CONFIRMATION_PROMPTS
};
//# sourceMappingURL=faqSafetyGuard.js.map