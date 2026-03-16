/**
 * AI Intent Detection Module
 * Uses OpenAI for lightweight intent detection
 * 
 * PHASE 6: Fixed module structure and category-aware responses
 * 
 * Supported intents:
 * - menu_request: User wants to see the menu
 * - table_booking: User wants to book (adapted to category)
 * - timing_query: User asks about restaurant hours
 * - location_query: User asks about address/address
 * - greeting: User says hello/hi
 * - fallback: Could not understand the message
 */

const OpenAI = require('openai');

// ============================================================================
// FIX 4: OpenAI Safety Guard - Configuration
// ============================================================================
const OPENAI_TIMEOUT_MS = 8000; // 8 second timeout
const MAX_TOKENS = 150; // Maximum tokens for response (≤150 as required)

// Intent definitions for the AI
const INTENT_PROMPT = `You are a business WhatsApp bot assistant. Classify the user's message into one of these intents:
- menu_request: User wants to see the menu, pricing, or brochure
- table_booking: User wants to make a reservation, booking, appointment, or schedule a visit
- timing_query: User asks about opening/closing hours
- location_query: User asks about address or directions
- greeting: User says hello, hi, hey, good morning, etc.
- fallback: Message is unclear or doesn't fit above categories

Respond ONLY with valid JSON in this format:
{"intent": "intent_name"}

Examples:
- "Can I see your menu?" -> {"intent": "menu_request"}
- "I want to book an appointment" -> {"intent": "table_booking"}
- "What time do you close?" -> {"intent": "timing_query"}
- "Where are you located?" -> {"intent": "location_query"}
- "Hi there!" -> {"intent": "greeting"}
- "Hello" -> {"intent": "greeting"}
`;

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
 * Detect intent from user message
 * 
 * PHASE 6: Added timeout handling and robust error handling
 * If OpenAI fails, returns fallback intent to prevent webhook failure
 * 
 * @param {string} message - User's message text
 * @returns {Promise<Object>} - Intent detection result
 */
const detectIntent = async (message) => {
    // ============================================================================
    // FIX 4: Safety - Handle empty or invalid input
    // ============================================================================
    if (!message || typeof message !== 'string' || message.trim() === '') {
        console.warn('Empty or invalid message received, returning fallback intent');
        return { intent: 'fallback', confidence: 0 };
    }

    try {
        const client = getOpenAIClient();

        // ============================================================================
        // FIX 4: Safety - Use AbortController for timeout handling
        // ============================================================================
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, OPENAI_TIMEOUT_MS);

        const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: INTENT_PROMPT },
                { role: 'user', content: message }
            ],
            temperature: 0.3,
            max_tokens: MAX_TOKENS, // FIX 4: Limit tokens to ≤150
            response_format: { type: 'json_object' },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const response = completion.choices[0]?.message?.content;

        if (!response) {
            console.warn('No response from OpenAI');
            return { intent: 'fallback', confidence: 0 };
        }

        const parsed = JSON.parse(response);
        console.log(`Intent detected: ${parsed.intent} for message: "${message}"`);

        return {
            intent: parsed.intent || 'fallback',
            confidence: 1,
        };
    } catch (error) {
        // ============================================================================
        // FIX 4: Robust error handling - Never throw, always return fallback
        // ============================================================================
        console.error('Error detecting intent:', error.message);

        // Check if it was an abort (timeout)
        if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
            console.warn('OpenAI request timed out, returning fallback intent');
        }

        // Return fallback intent - never allow webhook to fail due to AI
        return { intent: 'fallback', confidence: 0 };
    }
};

/**
 * PHASE 6: Category-aware response generator
 * @param {string} tone - Response tone (professional, friendly, relaxed, motivational)
 * @param {Object} responses - Response templates
 * @param {Object} params - Parameters for response
 * @returns {string} - Formatted response
 */
const generateTonedResponse = (tone, responses, params = {}) => {
    const template = responses[tone] || responses.professional;

    if (typeof template === 'function') {
        return template(params);
    }

    // Simple string replacement
    let response = template;
    Object.keys(params).forEach(key => {
        response = response.split(`{${key}}`).join(params[key]);
    });

    return response;
};

/**
 * Generate response based on intent (category-aware)
 * PHASE 6: Now uses category for dynamic responses
 * 
 * @param {string} intent - Detected intent
 * @param {Object} restaurantData - Restaurant configuration
 * @returns {string} - Generated response text
 */
const generateResponseByIntent = (intent, restaurantData) => {
    const category = restaurantData.category || 'restaurant';
    const bookingLabel = restaurantData.bookingType || category.replace('_', ' ');
    const tone = restaurantData.defaultReplyTone || 'friendly';
    const name = restaurantData.name || 'us';

    // ============================================================================
    // PHASE 6: Category-aware response templates by tone
    // ============================================================================

    const responses = {
        // Menu request - varies by if menu is enabled
        menu_request: {
            professional: () => {
                if (restaurantData.menuUrl) {
                    return `Here's our information: ${restaurantData.menuUrl}\n\nWould you like to proceed?`;
                }
                return "I'd be happy to share more details with you. What specific information are you looking for?";
            },
            friendly: () => {
                if (restaurantData.menuUrl) {
                    return `Here's what you asked for! 👉 ${restaurantData.menuUrl}\n\nLet me know if you need anything else!`;
                }
                return `Hi! What would you like to know more about? I'm happy to help!`;
            },
            relaxed: () => {
                if (restaurantData.menuUrl) {
                    return `Here's your link: ${restaurantData.menuUrl}\n\nTake your time! 😊`;
                }
                return `No problem! What would you like to explore?`;
            },
            motivational: () => {
                if (restaurantData.menuUrl) {
                    return `Check this out! 🔥 ${restaurantData.menuUrl}\n\nReady to take the next step?`;
                }
                return `Let's get you the info you need! What are you looking for?`;
            }
        },

        // Booking request - category-aware wording
        table_booking: {
            professional: () => `Great! I'd love to help you book a ${bookingLabel}. Please provide:\n1. Date (e.g., 2024-12-25)\n2. Time (e.g., 7:00 PM)\n3. Any additional details`,
            friendly: () => `Awesome! 🎉 Let's get you booked for a ${bookingLabel}!\n\nWhen would you like to come in?`,
            relaxed: () => `Take your time! 🧘 What's a good date for your ${bookingLabel}?`,
            motivational: () => `Let's make it happen! 💪 When works best for your ${bookingLabel}?`
        },

        // Timing query
        timing_query: {
            professional: () => {
                const timing = restaurantData.timing || 'Please contact us for current hours';
                return `Our working hours:\n${timing}`;
            },
            friendly: () => {
                const timing = restaurantData.timing || 'Drop us a message!';
                return `We're open:\n${timing}\n\nHope to see you soon!`;
            },
            relaxed: () => {
                const timing = restaurantData.timing || 'Just message us!';
                return `Our hours are:\n${timing}\n\nWhenever works for you! 😊`;
            },
            motivational: () => {
                const timing = restaurantData.timing || 'Get in touch!';
                return `⏰ We're here:\n${timing}\n\nTime to visit us!`;
            }
        },

        // Location query
        location_query: {
            professional: () => {
                if (restaurantData.address) {
                    return `Our location:\n${restaurantData.address}\n\n${restaurantData.mapUrl ? `Map: ${restaurantData.mapUrl}` : ''}`;
                }
                return "I'd be happy to share our location. Please contact us for directions.";
            },
            friendly: () => {
                if (restaurantData.address) {
                    return `Here's where to find us! 📍\n${restaurantData.address}\n\n${restaurantData.mapUrl ? `Map: ${restaurantData.mapUrl}` : ''}\n\nSee you soon!`;
                }
                return `We're easy to find! Drop us a message and we'll send you the location.`;
            },
            relaxed: () => {
                if (restaurantData.address) {
                    return `We're here: 📍\n${restaurantData.address}\n\n${restaurantData.mapUrl ? `Direct link: ${restaurantData.mapUrl}` : ''}`;
                }
                return `Just message us and we'll share exactly where we are!`;
            },
            motivational: () => {
                if (restaurantData.address) {
                    return `Come find us! 🚀\n${restaurantData.address}\n\n${restaurantData.mapUrl ? `导航: ${restaurantData.mapUrl}` : ''}`;
                }
                return `Let's connect! Message us and we'll point you in the right direction!`;
            }
        },

        // Greeting
        greeting: {
            professional: () => `Hello! Welcome to ${name}! 👋\n\nHow can I help you today? You can:\n- Get more info\n- Book a ${bookingLabel}\n- Ask about hours\n- Get directions`,
            friendly: () => `Hey there! 🎉 Welcome to ${name}!\n\nSo happy you're here! What can I do for you today? 😊`,
            relaxed: () => `Hi there! ✨ Welcome to ${name}\n\nNo rush - just let me know how I can help!`,
            motivational: () => `Hey! 🚀 Welcome to ${name}!\n\nLet's get you sorted! What do you need?`
        },

        // Fallback
        fallback: {
            professional: () => `I'm not sure I understood that. Could you rephrase?\n\nI can help you with:\n- Providing information\n- Booking a ${bookingLabel}\n- Working hours\n- Location and directions`,
            friendly: () => `Oops! 😅 Didn't quite catch that.\n\nI can help you:\n📅 Book a ${bookingLabel}\n⏰ Check our hours\n📍 Find us\n💬 Just chat!\n\nWhat would you like?`,
            relaxed: () => `Hmm, let's try that again! 🌸\n\nI'm here to help with bookings, hours, or directions. What do you need?`,
            motivational: () => `Let's try that again! 💪\n\nI can help you:\n✅ Book a ${bookingLabel}\n✅ Get info\n✅ Find us\n✅ Check hours\n\nWhat do you need?`
        }
    };

    // Get the intent-specific responses
    const intentResponses = responses[intent] || responses.fallback;

    // Generate the response with the appropriate tone
    return generateTonedResponse(tone, intentResponses);
};

// ============================================================================
// FIX 4: Proper module exports - moved outside function
// ============================================================================
module.exports = {
    detectIntent,
    generateResponseByIntent,
    getOpenAIClient,
};
