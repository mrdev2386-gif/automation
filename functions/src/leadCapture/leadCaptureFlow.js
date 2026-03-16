/**
 * Smart Lead Capture Flow
 * Universal lead capture system for multi-industry WhatsApp bot
 * 
 * Supports: Restaurant, Hotel, SaaS/Service businesses
 * 
 * Flow:
 * 1. Greet user
 * 2. Ask name
 * 3. Ask phone/email
 * 4. Ask business requirement (dynamic per client)
 * 5. Store lead in Firestore under correct client
 * 6. Offer human handoff option
 */

const { getFirestore, admin } = require('../config/firebase');
const { sendTextMessage } = require('../whatsapp/sender');
const { sanitizeInput } = require('../utils/helpers');

// ============================================================================
// Lead Capture State Machine Steps
// ============================================================================
const LEAD_STEPS = {
    START: 'start',
    AWAITING_NAME: 'awaiting_name',
    AWAITING_CONTACT: 'awaiting_contact',
    AWAITING_REQUIREMENT: 'awaiting_requirement',
    COMPLETED: 'completed',
    HUMAN_HANDOFF: 'human_handoff'
};

// ============================================================================
// Industry-Specific Question Templates
// ============================================================================
const INDUSTRY_QUESTIONS = {
    restaurant: [
        { key: 'partySize', question: 'How many people will be dining?', required: true },
        { key: 'preferredDate', question: 'What date would you prefer? (e.g., 2024-12-25)', required: true },
        { key: 'preferredTime', question: 'What time works best for you? (e.g., 7:00 PM)', required: true }
    ],
    hotel: [
        { key: 'checkInDate', question: 'What is your check-in date? (e.g., 2024-12-25)', required: true },
        { key: 'checkOutDate', question: 'What is your check-out date? (e.g., 2024-12-27)', required: true },
        { key: 'numberOfGuests', question: 'How many guests will be staying?', required: true }
    ],
    saas: [
        { key: 'requirement', question: 'Please tell us about your requirements. What are you looking to achieve? (Feel free to provide as much detail as you\'d like)', required: true, openText: true },
        { key: 'budget', question: 'What is your approximate monthly budget? (Optional - type "skip" to skip)', required: false }
    ],
    service: [
        { key: 'requirement', question: 'What service do you need? Please describe your requirements.', required: true, openText: true },
        { key: 'budget', question: 'What is your budget range? (Optional)', required: false },
        { key: 'timeline', question: 'What is your preferred timeline? (Optional)', required: false }
    ],
    spa: [
        { key: 'serviceType', question: 'What type of service are you interested in?', required: true },
        { key: 'preferredDate', question: 'What date would you prefer?', required: true },
        { key: 'numberOfPeople', question: 'How many people will be joining?', required: true }
    ],
    salon: [
        { key: 'serviceType', question: 'What service would you like?', required: true },
        { key: 'preferredDate', question: 'What date works for you?', required: true },
        { key: 'preferredTime', question: 'What time would you prefer?', required: true }
    ],
    clinic: [
        { key: 'appointmentType', question: 'What type of appointment do you need?', required: true },
        { key: 'preferredDate', question: 'What date would you prefer?', required: true },
        { key: 'symptoms', question: 'Please briefly describe your concern (optional)', required: false }
    ],
    gym: [
        { key: 'membershipType', question: 'What type of membership are you interested in?', required: true },
        { key: 'goals', question: 'What are your fitness goals?', required: true },
        { key: 'startDate', question: 'When would you like to start?', required: true }
    ]
};

// ============================================================================
// Get Client Bot Configuration
// ============================================================================
/**
 * Get bot configuration for a client
 * @param {string} clientId - Client ID
 * @returns {Promise<Object|null>} - Bot config or null
 */
const getClientBotConfig = async (clientId) => {
    try {
        const db = getFirestore();
        const doc = await db.collection('clients').doc(clientId).get();
        
        if (!doc.exists) {
            console.error(`Client ${clientId} not found`);
            return null;
        }

        const clientData = doc.data();
        
        // Return bot config with defaults
        return {
            botEnabled: clientData.botConfig?.botEnabled ?? true,
            industryType: clientData.industryType || 'restaurant',
            customQuestions: clientData.botConfig?.customQuestions || [],
            greetingMessage: clientData.botConfig?.greetingMessage || null,
            completionMessage: clientData.botConfig?.completionMessage || null,
            clientName: clientData.profile?.name || 'our business',
            whatsappNumberId: clientData.whatsappNumberId || null
        };
    } catch (error) {
        console.error('Error getting client bot config:', error);
        return null;
    }
};

// ============================================================================
// Get Questions for Industry
// ============================================================================
/**
 * Get questions based on industry type and custom questions
 * @param {string} industryType - Industry type
 * @param {Array} customQuestions - Custom questions from client config
 * @returns {Array} - Array of questions
 */
const getQuestionsForIndustry = (industryType, customQuestions = []) => {
    // If custom questions are provided, use them
    if (customQuestions && customQuestions.length > 0) {
        return customQuestions;
    }

    // Otherwise, use default questions for industry
    return INDUSTRY_QUESTIONS[industryType] || INDUSTRY_QUESTIONS.saas;
};

// ============================================================================
// Build Greeting Message
// ============================================================================
/**
 * Build greeting message based on client config
 * @param {Object} botConfig - Bot configuration
 * @returns {string} - Greeting message
 */
const buildGreetingMessage = (botConfig) => {
    if (botConfig.greetingMessage) {
        return botConfig.greetingMessage;
    }

    // Default greeting based on industry
    const greetings = {
        restaurant: `👋 Welcome! I'm here to help you with your dining reservation at ${botConfig.clientName}.`,
        hotel: `👋 Welcome to ${botConfig.clientName}! I'm here to help you with your booking.`,
        saas: `👋 Hi! Thanks for your interest in ${botConfig.clientName}. I'd love to learn more about your needs.`,
        service: `👋 Hello! Welcome to ${botConfig.clientName}. How can we help you today?`,
        spa: `👋 Welcome to ${botConfig.clientName}! Let's help you book a relaxing experience.`,
        salon: `👋 Hi! Welcome to ${botConfig.clientName}. Let's get you scheduled!`,
        clinic: `👋 Welcome to ${botConfig.clientName}. I'm here to help you schedule an appointment.`,
        gym: `👋 Welcome to ${botConfig.clientName}! Let's get you started on your fitness journey.`
    };

    return greetings[botConfig.industryType] || greetings.saas;
};

// ============================================================================
// Build Completion Message
// ============================================================================
/**
 * Build completion message based on client config
 * @param {Object} botConfig - Bot configuration
 * @param {Object} leadData - Captured lead data
 * @returns {string} - Completion message
 */
const buildCompletionMessage = (botConfig, leadData) => {
    if (botConfig.completionMessage) {
        return botConfig.completionMessage;
    }

    // Default completion message
    return `✅ Thank you, ${leadData.name}! We've received your information and will get back to you shortly.\n\n` +
           `📋 Your reference ID: ${leadData.leadId?.slice(0, 8).toUpperCase()}\n\n` +
           `💬 Type HUMAN anytime if you'd like to speak with our team directly.`;
};

// ============================================================================
// Create Lead in Firestore
// ============================================================================
/**
 * Create lead in Firestore under client
 * @param {string} clientId - Client ID
 * @param {Object} leadData - Lead data
 * @returns {Promise<string>} - Lead ID
 */
const createLead = async (clientId, leadData) => {
    try {
        const db = getFirestore();
        
        // Validate required fields
        if (!leadData.name) {
            throw new Error('Lead name is required');
        }
        
        if (!leadData.phone && !leadData.email) {
            throw new Error('Lead must have either phone or email');
        }
        
        // Check for duplicate lead (same phone number in last 24 hours)
        if (leadData.phone) {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const existingLeads = await db.collection('clients')
                .doc(clientId)
                .collection('leads')
                .where('phone', '==', leadData.phone)
                .where('createdAt', '>', oneDayAgo)
                .limit(1)
                .get();

            if (!existingLeads.empty) {
                console.log(`Duplicate lead detected for ${leadData.phone} in last 24 hours`);
                return existingLeads.docs[0].id;
            }
        }

        // Prepare lead document
        const leadDocument = {
            name: leadData.name,
            email: leadData.email || null,
            phone: leadData.phone || null,
            industryType: leadData.industryType || 'saas',
            source: 'whatsapp',
            clientId: clientId,
            needsHuman: leadData.needsHuman || false,
            status: 'new',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Add industry-specific fields
        // For SaaS: requirement (required), budget (optional)
        if (leadData.requirement) {
            leadDocument.requirement = leadData.requirement;
        }
        if (leadData.budget) {
            leadDocument.budget = leadData.budget;
        }
        
        // For Restaurant: partySize, preferredDate, preferredTime
        if (leadData.partySize) {
            leadDocument.partySize = leadData.partySize;
        }
        if (leadData.preferredDate) {
            leadDocument.preferredDate = leadData.preferredDate;
        }
        if (leadData.preferredTime) {
            leadDocument.preferredTime = leadData.preferredTime;
        }
        
        // For Hotel: checkInDate, checkOutDate, numberOfGuests
        if (leadData.checkInDate) {
            leadDocument.checkInDate = leadData.checkInDate;
        }
        if (leadData.checkOutDate) {
            leadDocument.checkOutDate = leadData.checkOutDate;
        }
        if (leadData.numberOfGuests) {
            leadDocument.numberOfGuests = leadData.numberOfGuests;
        }
        
        // For Service: serviceNeeded, timeline
        if (leadData.serviceNeeded) {
            leadDocument.serviceNeeded = leadData.serviceNeeded;
        }
        if (leadData.timeline) {
            leadDocument.timeline = leadData.timeline;
        }
        
        // For other industries: store any additional fields
        Object.keys(leadData).forEach(key => {
            if (!leadDocument.hasOwnProperty(key) && 
                !['leadId', 'clientId', 'industryType', 'source', 'needsHuman'].includes(key)) {
                leadDocument[key] = leadData[key];
            }
        });

        // Create new lead
        const leadRef = await db.collection('clients')
            .doc(clientId)
            .collection('leads')
            .add(leadDocument);

        console.log(`Lead created: ${leadRef.id} for client: ${clientId} (${leadData.industryType})`);
        return leadRef.id;
    } catch (error) {
        console.error('Error creating lead:', error);
        throw error;
    }
};

// ============================================================================
// Get or Create Lead Capture State
// ============================================================================
/**
 * Get or create lead capture state for user
 * @param {string} phoneNumber - User phone number
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} - Lead capture state
 */
const getOrCreateLeadState = async (phoneNumber, clientId) => {
    try {
        const db = getFirestore();
        
        // Try to find existing state
        const snapshot = await db.collection('leadCaptureStates')
            .where('phoneNumber', '==', phoneNumber)
            .where('clientId', '==', clientId)
            .where('completed', '==', false)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        }

        // Create new state
        const newState = {
            phoneNumber: phoneNumber,
            clientId: clientId,
            step: LEAD_STEPS.START,
            data: {},
            currentQuestionIndex: 0,
            completed: false,
            needsHuman: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('leadCaptureStates').add(newState);
        
        return {
            id: docRef.id,
            ...newState
        };
    } catch (error) {
        console.error('Error getting or creating lead state:', error);
        throw error;
    }
};

// ============================================================================
// Update Lead Capture State
// ============================================================================
/**
 * Update lead capture state
 * @param {string} stateId - State ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
const updateLeadState = async (stateId, updates) => {
    try {
        const db = getFirestore();
        await db.collection('leadCaptureStates').doc(stateId).update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating lead state:', error);
        throw error;
    }
};

// ============================================================================
// Clear Lead Capture State
// ============================================================================
/**
 * Clear lead capture state (mark as completed)
 * @param {string} stateId - State ID
 * @returns {Promise<void>}
 */
const clearLeadState = async (stateId) => {
    try {
        const db = getFirestore();
        await db.collection('leadCaptureStates').doc(stateId).update({
            completed: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error clearing lead state:', error);
        throw error;
    }
};

// ============================================================================
// Validate Email
// ============================================================================
/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// ============================================================================
// Validate Phone Number
// ============================================================================
/**
 * Validate phone number format
 * @param {string} phone - Phone to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's between 10-15 digits
    return cleaned.length >= 10 && cleaned.length <= 15;
};

// ============================================================================
// Main Lead Capture Flow Handler
// ============================================================================
/**
 * Handle lead capture flow
 * @param {string} phoneNumber - User phone number
 * @param {string} clientId - Client ID
 * @param {string} messageText - User message
 * @returns {Promise<string>} - Response text
 */
const handleLeadCaptureFlow = async (phoneNumber, clientId, messageText) => {
    try {
        const sanitizedText = sanitizeInput(messageText);
        
        // Check for human handoff request
        if (sanitizedText.toLowerCase() === 'human') {
            const state = await getOrCreateLeadState(phoneNumber, clientId);
            await updateLeadState(state.id, {
                needsHuman: true,
                step: LEAD_STEPS.HUMAN_HANDOFF
            });
            
            return `🤝 I've notified our team. Someone will reach out to you shortly!\n\n` +
                   `In the meantime, feel free to share any additional details.`;
        }

        // Get bot configuration
        const botConfig = await getClientBotConfig(clientId);
        
        if (!botConfig) {
            return `Sorry, we're experiencing technical difficulties. Please try again later.`;
        }

        if (!botConfig.botEnabled) {
            return `Thank you for your message. Our team will get back to you shortly.`;
        }

        // Get or create lead state
        const state = await getOrCreateLeadState(phoneNumber, clientId);
        
        // If already marked for human handoff, don't process
        if (state.needsHuman) {
            return `Our team has been notified and will respond soon. Thank you for your patience!`;
        }

        // Get questions for this industry
        const questions = getQuestionsForIndustry(botConfig.industryType, botConfig.customQuestions);
        
        let responseText = '';
        let newStep = state.step;
        let newData = { ...state.data };
        let currentQuestionIndex = state.currentQuestionIndex || 0;

        // State machine
        switch (state.step) {
            case LEAD_STEPS.START:
                // Send greeting and ask for name
                responseText = buildGreetingMessage(botConfig) + '\n\n' +
                              `To get started, may I have your name?`;
                newStep = LEAD_STEPS.AWAITING_NAME;
                break;

            case LEAD_STEPS.AWAITING_NAME:
                // Validate and store name
                if (sanitizedText.length < 2) {
                    responseText = `Please provide your full name.`;
                } else {
                    newData.name = sanitizedText;
                    newStep = LEAD_STEPS.AWAITING_CONTACT;
                    responseText = `Nice to meet you, ${sanitizedText}! 📧\n\n` +
                                  `Could you please share your email address or phone number?`;
                }
                break;

            case LEAD_STEPS.AWAITING_CONTACT:
                // Validate and store contact info
                const isEmail = isValidEmail(sanitizedText);
                const isPhone = isValidPhone(sanitizedText);
                
                if (!isEmail && !isPhone) {
                    responseText = `Please provide a valid email address or phone number.`;
                } else {
                    if (isEmail) {
                        newData.email = sanitizedText;
                        // For SaaS, we need both email and phone
                        if (botConfig.industryType === 'saas' && !newData.phone) {
                            responseText = `Great! 📱\n\nNow, could you please share your phone number?`;
                            // Stay in AWAITING_CONTACT to get phone
                        } else {
                            // Move to requirements
                            if (!newData.phone) {
                                newData.phone = phoneNumber;
                            }
                            newStep = LEAD_STEPS.AWAITING_REQUIREMENT;
                            currentQuestionIndex = 0;
                            
                            // Ask first industry-specific question
                            if (questions.length > 0) {
                                responseText = `Great! 📋\n\n${questions[0].question}`;
                            } else {
                                // No questions, complete immediately
                                newStep = LEAD_STEPS.COMPLETED;
                                const leadId = await createLead(clientId, newData);
                                newData.leadId = leadId;
                                responseText = buildCompletionMessage(botConfig, newData);
                                await clearLeadState(state.id);
                            }
                        }
                    } else {
                        newData.phone = sanitizedText;
                        // For SaaS, we need both email and phone
                        if (botConfig.industryType === 'saas' && !newData.email) {
                            responseText = `Great! 📧\n\nNow, could you please share your email address?`;
                            // Stay in AWAITING_CONTACT to get email
                        } else {
                            // Move to requirements
                            newStep = LEAD_STEPS.AWAITING_REQUIREMENT;
                            currentQuestionIndex = 0;
                            
                            // Ask first industry-specific question
                            if (questions.length > 0) {
                                responseText = `Great! 📋\n\n${questions[0].question}`;
                            } else {
                                // No questions, complete immediately
                                newStep = LEAD_STEPS.COMPLETED;
                                const leadId = await createLead(clientId, newData);
                                newData.leadId = leadId;
                                responseText = buildCompletionMessage(botConfig, newData);
                                await clearLeadState(state.id);
                            }
                        }
                    }
                }
                break;

            case LEAD_STEPS.AWAITING_REQUIREMENT:
                // Store answer to current question
                const currentQuestion = questions[currentQuestionIndex];
                
                // Check if user wants to skip optional question
                if (!currentQuestion.required && sanitizedText.toLowerCase() === 'skip') {
                    // Skip this question
                    currentQuestionIndex++;
                    
                    if (currentQuestionIndex < questions.length) {
                        // Ask next question
                        responseText = questions[currentQuestionIndex].question;
                    } else {
                        // All questions answered, create lead
                        newStep = LEAD_STEPS.COMPLETED;
                        
                        // Add industryType to lead data
                        newData.industryType = botConfig.industryType;
                        newData.needsHuman = false;
                        
                        const leadId = await createLead(clientId, newData);
                        newData.leadId = leadId;
                        responseText = buildCompletionMessage(botConfig, newData);
                        await clearLeadState(state.id);
                    }
                } else {
                    // Validate required fields
                    if (currentQuestion.required && sanitizedText.trim().length < 2) {
                        responseText = `This field is required. Please provide a valid response.\n\n${currentQuestion.question}`;
                        break;
                    }
                    
                    // Special validation for requirement field (SaaS)
                    if (currentQuestion.key === 'requirement' && currentQuestion.required) {
                        if (sanitizedText.trim().length < 10) {
                            responseText = `Please provide more details about your requirements (at least 10 characters).\n\n${currentQuestion.question}`;
                            break;
                        }
                    }
                    
                    // Store the answer
                    newData[currentQuestion.key] = sanitizedText;
                    
                    // Move to next question or complete
                    currentQuestionIndex++;
                    
                    if (currentQuestionIndex < questions.length) {
                        // Ask next question
                        responseText = questions[currentQuestionIndex].question;
                    } else {
                        // All questions answered, create lead
                        newStep = LEAD_STEPS.COMPLETED;
                        
                        // Add industryType to lead data
                        newData.industryType = botConfig.industryType;
                        newData.needsHuman = false;
                        
                        const leadId = await createLead(clientId, newData);
                        newData.leadId = leadId;
                        responseText = buildCompletionMessage(botConfig, newData);
                        await clearLeadState(state.id);
                    }
                }
                break;

            case LEAD_STEPS.COMPLETED:
                // Already completed, offer human handoff
                responseText = `Your information has already been submitted. ✅\n\n` +
                              `Type HUMAN if you'd like to speak with our team.`;
                break;

            case LEAD_STEPS.HUMAN_HANDOFF:
                // Already requested human, acknowledge
                responseText = `Our team will be with you shortly. Thank you for your patience!`;
                break;

            default:
                // Unknown state, reset
                newStep = LEAD_STEPS.START;
                responseText = buildGreetingMessage(botConfig) + '\n\n' +
                              `To get started, may I have your name?`;
        }

        // Update state
        await updateLeadState(state.id, {
            step: newStep,
            data: newData,
            currentQuestionIndex: currentQuestionIndex
        });

        return responseText;

    } catch (error) {
        console.error('Error in lead capture flow:', error);
        return `Sorry, something went wrong. Please try again or type HUMAN to speak with our team.`;
    }
};

module.exports = {
    handleLeadCaptureFlow,
    getClientBotConfig,
    getQuestionsForIndustry,
    createLead,
    getOrCreateLeadState,
    updateLeadState,
    clearLeadState,
    LEAD_STEPS,
    INDUSTRY_QUESTIONS
};
