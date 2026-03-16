/**
 * Utility Helpers
 * Common helper functions used across the application
 * 
 * PHASE 2: Added validateBookingStep for universal booking engine
 */

/**
 * PHASE 2: Validate booking step input based on category and current step
 * Ensures booking flow is robust and handles invalid input gracefully
 * @param {string} category - Business category (restaurant, spa, salon, etc.)
 * @param {string} step - Current booking step
 * @param {string} userInput - User's input text
 * @returns {Object} - Validation result { valid: boolean, value: any, error?: string }
 */
const validateBookingStep = (category, step, userInput) => {
    if (!userInput || typeof userInput !== 'string') {
        return { valid: false, value: null, error: 'Please provide a valid input' };
    }

    const sanitized = sanitizeInput(userInput);
    const lowerInput = sanitized.toLowerCase().trim();

    // Handle escape/cancel keywords at any step
    const cancelKeywords = ['cancel', 'stop', 'quit', 'nevermind', 'never mind', 'exit', 'back'];
    if (cancelKeywords.some(kw => lowerInput === kw || lowerInput.startsWith(kw + ' '))) {
        return { valid: false, value: null, error: 'cancelled', cancelled: true };
    }

    switch (step) {
        case 'start':
        case 'awaiting_date':
            // Validate date
            const date = extractDate(sanitized);
            if (date) {
                // Check if date is in the future
                const bookingDate = new Date(date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (bookingDate < today) {
                    return { valid: false, value: null, error: 'Please provide a future date' };
                }
                return { valid: true, value: date };
            }
            // Check for help or menu keywords
            if (lowerInput.includes('help') || lowerInput.includes('menu')) {
                return { valid: false, value: null, error: 'help_requested' };
            }
            return { valid: false, value: null, error: 'Please provide a valid date (e.g., 2024-12-25 or December 25)' };

        case 'awaiting_time':
            // Validate time
            const time = extractTime(sanitized);
            if (time) {
                return { valid: true, value: time };
            }
            // Check for help keyword
            if (lowerInput.includes('help')) {
                return { valid: false, value: null, error: 'help_requested' };
            }
            return { valid: false, value: null, error: 'Please provide a valid time (e.g., 7:00 PM or 19:00)' };

        case 'awaiting_guests':
            // Validate guest count
            const guests = extractGuestCount(sanitized);
            if (guests && guests >= 1 && guests <= 20) {
                return { valid: true, value: guests };
            }
            // Check for help keyword
            if (lowerInput.includes('help')) {
                return { valid: false, value: null, error: 'help_requested' };
            }
            return { valid: false, value: null, error: 'Please provide a number between 1 and 20' };

        case 'confirming':
            // Handle confirmation
            const confirmKeywords = ['yes', 'yep', 'yeah', 'confirm', 'ok', 'okay', 'sure', 'correct', 'perfect'];
            const denyKeywords = ['no', 'nope', 'cancel', 'change', 'wrong'];

            if (confirmKeywords.some(kw => lowerInput === kw || lowerInput.startsWith(kw))) {
                return { valid: true, value: 'confirm' };
            }
            if (denyKeywords.some(kw => lowerInput === kw || lowerInput.startsWith(kw))) {
                return { valid: true, value: 'deny' };
            }
            return { valid: false, value: null, error: 'Please confirm with yes or no' };

        default:
            // Unknown step - reset
            return { valid: false, value: null, error: 'Session expired. Please start again.' };
    }
};

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Phone number in any format
 * @returns {string} - Phone number in E.164 format
 */
const normalizePhoneNumber = (phone) => {
    if (!phone) return null;

    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Add + if not present and starts with country code
    if (!cleaned.startsWith('+') && cleaned.length >= 10) {
        cleaned = '+' + cleaned;
    }

    return cleaned;
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number in E.164 format
 * @returns {string} - Formatted phone number
 */
const formatPhoneForDisplay = (phone) => {
    if (!phone) return '';

    // Remove + prefix for display
    const cleaned = phone.replace(/^\+/, '');

    // Add formatting for common formats
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    return phone;
};

/**
 * Extract date from various formats
 * @param {string} dateString - Date string in various formats
 * @returns {string|null} - Date in YYYY-MM-DD format or null
 */
const extractDate = (dateString) => {
    if (!dateString) return null;

    // Try parsing common date formats
    const formats = [
        // YYYY-MM-DD
        /^(\d{4})-(\d{2})-(\d{2})$/,
        // MM/DD/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        // DD/MM/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        // Month DD, YYYY
        /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
    ];

    // Try ISO format first
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        return dateString;
    }

    // Try MM/DD/YYYY
    const usMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
        const [, month, day, year] = usMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try to parse with Date object
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    return null;
};

/**
 * Extract time from various formats
 * @param {string} timeString - Time string in various formats
 * @returns {string|null} - Time in HH:MM format or null
 */
const extractTime = (timeString) => {
    if (!timeString) return null;

    // Try HH:MM format
    const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
        const [, hour, minute] = timeMatch;
        return `${hour.padStart(2, '0')}:${minute}`;
    }

    // Try HH:MM AM/PM format
    const ampmMatch = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (ampmMatch) {
        let [, hour, minute, ampm] = ampmMatch;
        hour = parseInt(hour, 10);

        if (ampm) {
            ampm = ampm.toUpperCase();
            if (ampm === 'PM' && hour !== 12) hour += 12;
            if (ampm === 'AM' && hour === 12) hour = 0;
        }

        return `${hour.toString().padStart(2, '0')}:${minute}`;
    }

    // Try to parse with Date object
    const parsed = new Date(timeString);
    if (!isNaN(parsed.getTime())) {
        const hours = parsed.getHours().toString().padStart(2, '0');
        const minutes = parsed.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    return null;
};

/**
 * Extract number of guests from text
 * @param {string} text - User's text
 * @returns {number|null} - Number of guests or null
 */
const extractGuestCount = (text) => {
    if (!text) return null;

    // Look for number patterns
    const numberMatch = text.match(/(\d+)/);
    if (numberMatch) {
        const num = parseInt(numberMatch[1], 10);
        // Reasonable guest count (1-20)
        if (num >= 1 && num <= 20) {
            return num;
        }
    }

    // Common text patterns
    const textPatterns = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    };

    const lowerText = text.toLowerCase();
    for (const [word, count] of Object.entries(textPatterns)) {
        if (lowerText.includes(word)) {
            return count;
        }
    }

    return null;
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid email
 */
const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Extract email from text
 * @param {string} text - Text to search
 * @returns {string|null} - Extracted email or null
 */
const extractEmail = (text) => {
    if (!text) return null;
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    const match = text.match(emailRegex);
    return match ? match[0] : null;
};

/**
 * Extract phone number from text
 * @param {string} text - Text to search
 * @returns {string|null} - Extracted phone or null
 */
const extractPhone = (text) => {
    if (!text) return null;
    // Match various phone formats
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/;
    const match = text.match(phoneRegex);
    if (match) {
        // Clean up and normalize
        let phone = match[0].replace(/[^\d+]/g, '');
        if (phone.length >= 10) {
            return normalizePhoneNumber(phone);
        }
    }
    return null;
};

/**
 * Sanitize user input to prevent injection
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
    if (!input) return '';
    // Remove control characters and trim
    return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
};

/**
 * Generate a simple booking reference
 * @returns {string} - Booking reference
 */
const generateBookingReference = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

module.exports = {
    normalizePhoneNumber,
    formatPhoneForDisplay,
    extractDate,
    extractTime,
    extractGuestCount,
    isValidEmail,
    extractEmail,
    extractPhone,
    sanitizeInput,
    generateBookingReference,
    validateBookingStep, // PHASE 2: Universal booking validation
};
