"use strict";
/**
 * WhatsApp Webhook - Enhanced AI Assistant Engine
 * Handles incoming WhatsApp messages with FAQ matching and lead capture
 *
 * UPDATES:
 * - PART 1: Semantic FAQ matching with OpenAI embeddings
 * - PART 2: Quick reply suggestion system
 * - PART 3: Auto welcome suggestion
 */
const { getFirestore, admin } = require('../config/firebase');
const { getClientByPhoneNumberId } = require('../services/clientService');
const { sendTextMessage, sendInteractiveButtons } = require('./sender');
const { detectIntent } = require('../ai/intent');
const OpenAI = require('openai');
const { sanitizeInput, normalizePhoneNumber, extractEmail, extractPhone } = require('../utils/helpers');
// ============================================================================
// CONFIGURATION
// ============================================================================
const SEMANTIC_SIMILARITY_THRESHOLD = 0.82; // Minimum similarity for match
const MAX_SUGGESTIONS = 3; // Maximum quick replies to send
const EMBEDDING_MODEL = 'text-embedding-3-small';
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Get OpenAI client instance
 * @returns {Object} OpenAI client
 */
const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
    }
    return new OpenAI({ apiKey });
};
/**
 * Generate embedding for a text using OpenAI
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
const generateEmbedding = async (text) => {
    try {
        const client = getOpenAIClient();
        const response = await client.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text
        });
        return response.data[0].embedding;
    }
    catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
};
/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vec1 - First vector
 * @param {number[]} vec2 - Second vector
 * @returns {number} - Similarity score (-1 to 1)
 */
const cosineSimilarity = (vec1, vec2) => {
    if (vec1.length !== vec2.length) {
        throw new Error('Vectors must have same dimension');
    }
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    if (norm1 === 0 || norm2 === 0) {
        return 0;
    }
    return dotProduct / (norm1 * norm2);
};
/**
 * Get client config including secrets
 * @param {string} clientUserId - Client user ID
 * @returns {Promise<Object>} - Client configuration
 */
const getClientConfig = async (clientUserId) => {
    try {
        const db = getFirestore();
        const configDoc = await db.collection('client_configs').doc(clientUserId).get();
        if (!configDoc.exists) {
            return null;
        }
        return configDoc.data();
    }
    catch (error) {
        console.error('Error getting client config:', error);
        return null;
    }
};
/**
 * Get or generate embedding for FAQ question
 * @param {Object} faq - FAQ document data
 * @returns {Promise<number[]>} - Embedding vector
 */
const getFAQEmbedding = async (faq) => {
    // Use cached embedding if available and not stale
    if (faq.embedding && faq.embedding.length > 0) {
        const cacheAge = faq.updatedAt ?
            (Date.now() - faq.updatedAt.toDate().getTime()) :
            Infinity;
        // Cache valid for 7 days
        if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
            console.log(`Using cached embedding for FAQ: "${faq.question}"`);
            return faq.embedding;
        }
    }
    // Generate new embedding
    console.log(`Generating new embedding for FAQ: "${faq.question}"`);
    const embedding = await generateEmbedding(faq.question);
    return embedding;
};
/**
 * Find matching FAQ from client's knowledge base using semantic similarity
 * @param {string} clientUserId - Client user ID
 * @param {string} message - User message
 * @param {Object} config - Client configuration
 * @returns {Promise<Object|null>} - Matching FAQ with similarity score or null
 */
const findMatchingFAQ = async (clientUserId, message, config) => {
    try {
        const db = getFirestore();
        // Check if semantic matching is enabled (default to true if not set)
        const semanticEnabled = config.semanticFaqEnabled !== false;
        const threshold = config.semanticThreshold || SEMANTIC_SIMILARITY_THRESHOLD;
        // Get all active FAQs for this client
        const faqsSnapshot = await db.collection('faq_knowledge')
            .where('clientUserId', '==', clientUserId)
            .where('isActive', '==', true)
            .get();
        if (faqsSnapshot.empty) {
            return null;
        }
        const faqs = faqsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        const normalizedMessage = message.toLowerCase().trim();
        // First, try exact match
        for (const faq of faqs) {
            if (faq.question.toLowerCase().trim() === normalizedMessage) {
                console.log(`Found exact FAQ match for: "${message}"`);
                return { ...faq, similarity: 1.0, matchType: 'exact' };
            }
        }
        // Then try contains match (keyword matching)
        for (const faq of faqs) {
            const questionLower = faq.question.toLowerCase();
            // Check if key words from the question appear in the message
            const questionWords = questionLower.split(/\s+/).filter(w => w.length > 3);
            const matchCount = questionWords.filter(word => normalizedMessage.includes(word)).length;
            if (matchCount >= Math.min(2, questionWords.length)) {
                console.log(`Found partial FAQ match for: "${message}"`);
                return { ...faq, similarity: 0.85, matchType: 'keyword' };
            }
        }
        // PART 1: Semantic matching with embeddings
        if (semanticEnabled) {
            console.log(`Attempting semantic FAQ matching for: "${message}"`);
            try {
                // Generate embedding for user message
                const messageEmbedding = await generateEmbedding(message);
                let bestMatch = null;
                let bestScore = 0;
                // Calculate similarity for each FAQ
                for (const faq of faqs) {
                    const faqEmbedding = await getFAQEmbedding(faq);
                    const similarity = cosineSimilarity(messageEmbedding, faqEmbedding);
                    console.log(`FAQ: "${faq.question}" - Similarity: ${similarity.toFixed(4)}`);
                    if (similarity > bestScore) {
                        bestScore = similarity;
                        bestMatch = { ...faq, similarity, matchType: 'semantic' };
                    }
                }
                // Check if best match meets threshold
                if (bestScore >= threshold) {
                    console.log(`Found semantic FAQ match: "${bestMatch.question}" with score ${bestScore.toFixed(4)}`);
                    return bestMatch;
                }
                else {
                    console.log(`No semantic FAQ match above threshold ${threshold}. Best score: ${bestScore.toFixed(4)}`);
                }
            }
            catch (semanticError) {
                console.error('Semantic matching error:', semanticError);
                // Continue with fallback order if semantic matching fails
            }
        }
        return null;
    }
    catch (error) {
        console.error('Error finding matching FAQ:', error);
        return null;
    }
};
/**
 * Check if user is in lead capture mode
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User phone number
 * @returns {Promise<Object|null>} - Lead capture state or null
 */
const getLeadCaptureState = async (clientUserId, phoneNumber) => {
    try {
        const db = getFirestore();
        const stateDoc = await db.collection('lead_capture_states')
            .where('clientUserId', '==', clientUserId)
            .where('phoneNumber', '==', phoneNumber)
            .where('completed', '==', false)
            .limit(1)
            .get();
        if (stateDoc.empty) {
            return null;
        }
        return {
            id: stateDoc.docs[0].id,
            ...stateDoc.docs[0].data()
        };
    }
    catch (error) {
        console.error('Error getting lead capture state:', error);
        return null;
    }
};
// ============================================================================
// PART 2: QUICK REPLY SUGGESTION SYSTEM
// ============================================================================
/**
 * Get suggestions for a specific intent
 * @param {string} clientUserId - Client user ID
 * @param {string} triggerIntent - Intent to match
 * @returns {Promise<Array>} - Array of suggestion strings
 */
const getSuggestionsForIntent = async (clientUserId, triggerIntent) => {
    try {
        const db = getFirestore();
        // Get active suggestions for this intent, filtered by client
        const snapshot = await db.collection('assistant_suggestions')
            .where('clientUserId', '==', clientUserId)
            .where('triggerIntent', '==', triggerIntent)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        if (snapshot.empty) {
            return [];
        }
        const suggestionData = snapshot.docs[0].data();
        return suggestionData.suggestions || [];
    }
    catch (error) {
        console.error('Error getting suggestions:', error);
        return [];
    }
};
/**
 * Send suggestions after a response
 * @param {string} to - Recipient phone number
 * @param {string} intent - Detected intent
 * @param {Object} credentials - WhatsApp credentials
 * @returns {Promise<boolean>} - Whether suggestions were sent
 */
const sendSuggestions = async (to, intent, clientUserId, credentials) => {
    try {
        // Map intents to suggestion triggers
        const intentToTrigger = {
            'greeting': 'greeting',
            'menu_request': 'menu',
            'table_booking': 'booking',
            'timing_query': 'timing',
            'location_query': 'location',
            'fallback': 'general'
        };
        const trigger = intentToTrigger[intent] || 'general';
        const suggestions = await getSuggestionsForIntent(clientUserId, trigger);
        if (suggestions && suggestions.length > 0) {
            // Limit to max suggestions
            const limitedSuggestions = suggestions.slice(0, MAX_SUGGESTIONS);
            console.log(`Sending ${limitedSuggestions.length} suggestions for intent: ${intent}`);
            const result = await sendInteractiveButtons(to, 'Quick replies:', limitedSuggestions, credentials);
            return !!result;
        }
        return false;
    }
    catch (error) {
        console.error('Error sending suggestions:', error);
        return false;
    }
};
// ============================================================================
// PART 3: AUTO WELCOME SUGGESTION SYSTEM
// ============================================================================
/**
 * Check if this is a new conversation (no messages in last 24 hours)
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User phone number
 * @returns {Promise<boolean>} - Whether this is a new conversation
 */
const isNewConversation = async (clientUserId, phoneNumber) => {
    try {
        const db = getFirestore();
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // Check for any existing messages
        const snapshot = await db.collection('chat_logs')
            .where('clientUserId', '==', clientUserId)
            .where('phone', '==', phoneNumber)
            .where('timestamp', '>=', twentyFourHoursAgo)
            .limit(1)
            .get();
        return snapshot.empty;
    }
    catch (error) {
        console.error('Error checking new conversation:', error);
        return false;
    }
};
/**
 * Send welcome message and suggestions
 * @param {string} to - Recipient phone number
 * @param {Object} config - Client configuration
 * @param {Object} credentials - WhatsApp credentials
 */
const sendWelcomeMessage = async (to, config, credentials) => {
    try {
        // Check if welcome is enabled
        if (!config.welcomeEnabled) {
            console.log('Welcome message is disabled for this client');
            return false;
        }
        const welcomeMessage = config.welcomeMessage || 'Hello! Welcome! How can I help you today?';
        const welcomeSuggestions = config.welcomeSuggestions || [];
        console.log(`Sending welcome message to ${to}`);
        // Send welcome text first
        await sendTextMessage(to, welcomeMessage, credentials);
        // Then send suggestions if available
        if (welcomeSuggestions.length > 0) {
            const limitedSuggestions = welcomeSuggestions.slice(0, MAX_SUGGESTIONS);
            await sendInteractiveButtons(to, 'Quick options:', limitedSuggestions, credentials);
        }
        return true;
    }
    catch (error) {
        console.error('Error sending welcome message:', error);
        return false;
    }
};
/**
 * Update lead capture state
 * @param {string} stateId - Lead capture state ID
 * @param {Object} updates - Updates to apply
 */
const updateLeadCaptureState = async (stateId, updates) => {
    try {
        const db = getFirestore();
        await db.collection('lead_capture_states').doc(stateId).update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    catch (error) {
        console.error('Error updating lead capture state:', error);
    }
};
/**
 * Complete lead capture and create lead
 * @param {Object} stateData - Lead capture state data
 * @param {string} clientUserId - Client user ID
 */
const completeLeadCapture = async (stateData, clientUserId) => {
    try {
        const db = getFirestore();
        // Validate we have minimum required data
        if (!stateData.name || !stateData.phone) {
            console.warn('Incomplete lead data, cannot create lead');
            return null;
        }
        // Check for duplicates
        const existingLead = await db.collection('leads')
            .where('clientUserId', '==', clientUserId)
            .where('phone', '==', stateData.phone)
            .limit(1)
            .get();
        if (!existingLead.empty) {
            console.log(`Lead already exists for phone: ${stateData.phone}`);
            return existingLead.docs[0].id;
        }
        // Create lead
        const leadRef = await db.collection('leads').add({
            clientUserId,
            name: stateData.name,
            phone: stateData.phone,
            email: stateData.email || null,
            source: 'whatsapp_chat',
            status: 'new',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Mark capture state as completed
        await db.collection('lead_capture_states').doc(stateData.id).update({
            completed: true,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            leadId: leadRef.id
        });
        console.log(`Lead created: ${leadRef.id}`);
        return leadRef.id;
    }
    catch (error) {
        console.error('Error completing lead capture:', error);
        return null;
    }
};
/**
 * Start lead capture flow
 * @param {string} clientUserId - Client user ID
 * @param {string} phoneNumber - User phone number
 */
const startLeadCapture = async (clientUserId, phoneNumber) => {
    try {
        const db = getFirestore();
        await db.collection('lead_capture_states').add({
            clientUserId,
            phoneNumber,
            step: 'name',
            name: null,
            email: null,
            completed: false,
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return true;
    }
    catch (error) {
        console.error('Error starting lead capture:', error);
        return false;
    }
};
/**
 * Handle lead capture conversation flow
 * @param {Object} stateData - Current capture state
 * @param {string} message - User's message
 * @returns {Object} - Response and updated state
 */
const handleLeadCaptureFlow = async (stateData, message) => {
    const sanitizedMessage = sanitizeInput(message);
    let responseText = '';
    let updates = {};
    switch (stateData.step) {
        case 'name':
            // Store name and ask for phone
            updates = {
                step: 'phone',
                name: sanitizedMessage
            };
            responseText = `Nice to meet you, ${sanitizedMessage}! 📱\n\nCould you please share your phone number so we can stay in touch?`;
            break;
        case 'phone':
            // Try to extract phone or confirm
            const extractedPhone = extractPhone(sanitizedMessage);
            if (extractedPhone) {
                updates = {
                    step: 'email',
                    phone: extractedPhone
                };
                responseText = `Got it! 📱 ${extractedPhone}\n\nWould you also like to share your email address? (optional - just reply with your email or say "skip" to continue)`;
            }
            else {
                responseText = `I couldn't quite get that. 📱\n\nCould you please share your phone number?`;
            }
            break;
        case 'email':
            // Try to extract email or skip
            if (sanitizedMessage.toLowerCase() === 'skip' || sanitizedMessage.toLowerCase() === 'no') {
                updates = {
                    step: 'confirm',
                    email: null
                };
                responseText = `No problem! 📝\n\nLet me confirm your details:\n\n📌 Name: ${stateData.name}\n📌 Phone: ${stateData.phone}\n\nShall I save these as your contact info? (yes/no)`;
            }
            else {
                const extractedEmail = extractEmail(sanitizedMessage);
                if (extractedEmail) {
                    updates = {
                        step: 'confirm',
                        email: extractedEmail
                    };
                    responseText = `Got it! ✉️ ${extractedEmail}\n\nLet me confirm your details:\n\n📌 Name: ${stateData.name}\n📌 Phone: ${stateData.phone}\n📌 Email: ${extractedEmail}\n\nShall I save these as your contact info? (yes/no)`;
                }
                else {
                    responseText = `I didn't catch a valid email. ✉️\n\nPlease enter your email or say "skip" to continue without it.`;
                }
            }
            break;
        case 'confirm':
            if (sanitizedMessage.toLowerCase() === 'yes' || sanitizedMessage.toLowerCase() === 'yep' || sanitizedMessage.toLowerCase() === 'sure') {
                // Complete lead capture
                updates = {
                    step: 'completed',
                    completed: true
                };
                responseText = `Perfect! ✅\n\nThank you for sharing your information. We'll be in touch soon!\n\nIs there anything else I can help you with?`;
            }
            else {
                // Restart
                updates = {
                    step: 'name',
                    name: null,
                    phone: null,
                    email: null
                };
                responseText = `No problem! Let's start over. 🙏\n\nWhat should I call you?`;
            }
            break;
        default:
            responseText = `I'm not sure what happened. Let's try again.\n\nWhat should I call you?`;
            updates = {
                step: 'name',
                name: null,
                phone: null,
                email: null
            };
    }
    return { responseText, updates };
};
// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================
/**
 * Process WhatsApp message with AI assistant logic
 * Priority: FAQ match → Lead capture → Intent detection → OpenAI fallback
 *
 * UPDATES:
 * - PART 1: Semantic FAQ matching with config threshold
 * - PART 2: Quick reply suggestions after response
 * - PART 3: Auto welcome message for new conversations
 *
 * @param {string} phoneNumberId - WhatsApp phone number ID
 * @param {string} from - Sender phone number
 * @param {string} messageText - Message text
 * @param {string} messageId - WhatsApp message ID
 * @returns {Object} - Processing result
 */
const processAIAssistantMessage = async (phoneNumberId, from, messageText, messageId) => {
    try {
        console.log(`\n🤖 Processing AI Assistant message: "${messageText}"`);
        // Step 1: Identify client by phoneNumberId
        const client = await getClientByPhoneNumberId(phoneNumberId);
        if (!client) {
            console.warn(`No client found for phoneNumberId: ${phoneNumberId}`);
            return { success: false, error: 'Client not found' };
        }
        const clientUserId = client.ownerId;
        console.log(`Client identified: ${clientUserId}`);
        // Step 2: Get client config to check if assistant is enabled
        const config = await getClientConfig(clientUserId);
        if (!config || !config.assistantEnabled) {
            console.log('AI Assistant is disabled for this client');
            return { success: false, error: 'Assistant disabled' };
        }
        // Step 3: Save incoming message to chat_logs
        const db = getFirestore();
        await db.collection('chat_logs').add({
            clientUserId,
            phone: from,
            message: messageText,
            direction: 'inbound',
            intent: null,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        // PART 3: Check for new conversation and send welcome message
        const isNew = await isNewConversation(clientUserId, from);
        if (isNew && config.welcomeEnabled) {
            console.log(`New conversation detected for ${from}, sending welcome message`);
            const credentials = {
                whatsappToken: client.whatsappToken,
                whatsappNumberId: client.whatsappNumberId
            };
            await sendWelcomeMessage(from, config, credentials);
            // Don't process the user's first message as a regular message
            // Just acknowledge and wait for their response
            return {
                success: true,
                response: null, // Welcome already sent
                welcomeSent: true
            };
        }
        // Step 4: Check if user is in lead capture mode
        const leadCaptureState = await getLeadCaptureState(clientUserId, from);
        if (leadCaptureState) {
            console.log(`User in lead capture mode, step: ${leadCaptureState.step}`);
            const { responseText, updates } = await handleLeadCaptureFlow(leadCaptureState, messageText);
            // Update state
            await updateLeadCaptureState(leadCaptureState.id, updates);
            // If completed, create lead
            if (updates.completed) {
                await completeLeadCapture(leadCaptureState, clientUserId);
            }
            return { success: true, response: responseText };
        }
        // Step 5: Try to find matching FAQ (with semantic matching)
        const matchingFAQ = await findMatchingFAQ(clientUserId, messageText, config);
        if (matchingFAQ) {
            console.log(`Found FAQ match (${matchingFAQ.matchType}), returning answer`);
            return {
                success: true,
                response: matchingFAQ.answer,
                matchedIntent: 'faq',
                matchType: matchingFAQ.matchType
            };
        }
        // Step 6: Detect intent using AI
        const intentResult = await detectIntent(messageText);
        console.log(`Detected intent: ${intentResult.intent}`);
        let responseText = '';
        // Handle different intents
        switch (intentResult.intent) {
            case 'greeting':
                responseText = `Hello! 👋 Welcome! How can I help you today?`;
                break;
            case 'menu_request':
                // Check if menu URL is configured
                if (config.menuUrl) {
                    responseText = `Here's our information: ${config.menuUrl}\n\nLet me know if you need anything else!`;
                }
                else {
                    responseText = `I'd be happy to help! What specific information are you looking for?`;
                }
                break;
            case 'table_booking':
                // Start lead capture for booking inquiries
                await startLeadCapture(clientUserId, from);
                responseText = `I'd love to help you with that! 📋\n\nTo get started, what should I call you?`;
                break;
            case 'timing_query':
                responseText = config.timing || `Our hours vary. Please contact us for current information.`;
                break;
            case 'location_query':
                responseText = config.address || `Please contact us for our location.`;
                break;
            case 'fallback':
            default:
                // Use OpenAI for general conversation
                if (config.openaiApiKey) {
                    try {
                        const openai = getOpenAIClient();
                        const completion = await openai.chat.completions.create({
                            model: 'gpt-3.5-turbo',
                            messages: [
                                {
                                    role: 'system',
                                    content: config.aiPrompt || 'You are a helpful business assistant for WhatsApp. Keep responses brief and friendly.'
                                },
                                { role: 'user', content: messageText }
                            ],
                            max_tokens: 150
                        });
                        responseText = completion.choices[0]?.message?.content ||
                            "I'm here to help! Could you please rephrase your question?";
                    }
                    catch (openaiError) {
                        console.error('OpenAI error:', openaiError);
                        responseText = "I'm here to help! Could you please rephrase your question?";
                    }
                }
                else {
                    responseText = "I'm not quite sure I understood that. Could you try asking differently?";
                }
                break;
        }
        // Step 7: Save outgoing message to chat_logs
        await db.collection('chat_logs').add({
            clientUserId,
            phone: from,
            message: responseText,
            direction: 'outbound',
            intent: intentResult.intent,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            success: true,
            response: responseText,
            matchedIntent: intentResult.intent
        };
    }
    catch (error) {
        console.error('Error processing AI assistant message:', error);
        return { success: false, error: error.message };
    }
};
// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
    processAIAssistantMessage,
    findMatchingFAQ,
    handleLeadCaptureFlow
};
//# sourceMappingURL=aiAssistant.js.map