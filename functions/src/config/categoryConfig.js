/**
 * Business Category Configuration
 * Master configuration for all supported business categories
 * 
 * PHASE 2: Enterprise-ready category system
 * - All 14 target categories supported
 * - Feature flags per category
 * - Booking labels per category
 * - Reply tone customization
 */

const categoryConfig = {
    // Healthcare
    clinic: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'appointment',
        bookingLabel: 'appointment',
        defaultReplyTone: 'professional'
    },

    // Beauty & Wellness
    salon: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'appointment',
        bookingLabel: 'appointment',
        defaultReplyTone: 'friendly'
    },

    // Fitness
    gym: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'appointment',
        bookingLabel: 'appointment',
        defaultReplyTone: 'motivational'
    },

    // Education
    coaching: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'demo_class',
        bookingLabel: 'demo class',
        defaultReplyTone: 'professional'
    },

    // Real Estate
    real_estate: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'site_visit',
        bookingLabel: 'site visit',
        defaultReplyTone: 'professional'
    },

    // Food & Beverage
    restaurant: {
        bookingEnabled: true,
        menuEnabled: true,
        defaultIntent: 'table_booking',
        bookingLabel: 'table',
        defaultReplyTone: 'friendly'
    },

    // Healthcare - Labs
    pathology_lab: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'test_booking',
        bookingLabel: 'test booking',
        defaultReplyTone: 'professional'
    },

    // Beauty & Wellness
    spa_wellness: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'session_booking',
        bookingLabel: 'session booking',
        defaultReplyTone: 'relaxed'
    },

    // Automotive
    car_service: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'service_booking',
        bookingLabel: 'service booking',
        defaultReplyTone: 'professional'
    },

    // Home Services
    home_services: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'service_booking',
        bookingLabel: 'service booking',
        defaultReplyTone: 'professional'
    },

    // Travel
    travel_agency: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'booking_inquiry',
        bookingLabel: 'booking inquiry',
        defaultReplyTone: 'friendly'
    },

    // Insurance
    insurance_agency: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'consultation',
        bookingLabel: 'consultation',
        defaultReplyTone: 'professional'
    },

    // Interior Design
    interior_designer: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'consultation',
        bookingLabel: 'consultation',
        defaultReplyTone: 'professional'
    },

    // Events & Venues
    banquet_hall: {
        bookingEnabled: true,
        menuEnabled: false,
        defaultIntent: 'event_booking',
        bookingLabel: 'event booking',
        defaultReplyTone: 'professional'
    }
};

// Safe defaults for unknown categories
const DEFAULT_CONFIG = {
    bookingEnabled: true,
    menuEnabled: false,
    defaultIntent: 'inquiry',
    bookingLabel: 'booking',
    defaultReplyTone: 'friendly'
};

/**
 * Normalize category to lowercase snake_case
 * @param {string} category - Raw category input
 * @returns {string} - Normalized category
 */
const normalizeCategory = (category) => {
    if (!category || typeof category !== 'string') {
        return 'restaurant'; // Safe default
    }
    return category.toLowerCase().trim();
};

/**
 * Get configuration for a specific business category
 * @param {string} category - Business category (e.g., clinic, salon)
 * @returns {Object} Configuration object
 */
const getCategoryConfig = (category) => {
    const normalizedCategory = normalizeCategory(category);

    if (!categoryConfig[normalizedCategory]) {
        console.warn(`Unknown category: ${category} (normalized: ${normalizedCategory}). Using defaults.`);
        return DEFAULT_CONFIG;
    }

    return categoryConfig[normalizedCategory];
};

/**
 * Get booking label for a category
 * @param {string} category - Business category
 * @returns {string} Label for booking (e.g., 'appointment', 'table')
 */
const getBookingLabel = (category) => {
    const config = getCategoryConfig(category);
    return config.bookingLabel;
};

/**
 * Check if booking is enabled for a category
 * @param {string} category - Business category
 * @returns {boolean} - Whether booking is enabled
 */
const isBookingEnabled = (category) => {
    const config = getCategoryConfig(category);
    return config.bookingEnabled === true;
};

/**
 * Check if menu is enabled for a category
 * @param {string} category - Business category
 * @returns {boolean} - Whether menu is enabled
 */
const isMenuEnabled = (category) => {
    const config = getCategoryConfig(category);
    return config.menuEnabled === true;
};

/**
 * Get default reply tone for a category
 * @param {string} category - Business category
 * @returns {string} - Reply tone (professional, friendly, etc.)
 */
const getDefaultReplyTone = (category) => {
    const config = getCategoryConfig(category);
    return config.defaultReplyTone || 'friendly';
};

/**
 * Get all supported categories
 * @returns {Array<string>} - Array of supported category names
 */
const getSupportedCategories = () => {
    return Object.keys(categoryConfig);
};

/**
 * Get category display name (human-readable)
 * @param {string} category - Category in snake_case
 * @returns {string} - Human readable name
 */
const getCategoryDisplayName = (category) => {
    const displayNames = {
        clinic: 'Clinic',
        salon: 'Salon',
        gym: 'Gym',
        coaching: 'Coaching Institute',
        real_estate: 'Real Estate',
        restaurant: 'Restaurant',
        pathology_lab: 'Pathology Lab',
        spa_wellness: 'Spa & Wellness',
        car_service: 'Car Service',
        home_services: 'Home Services',
        travel_agency: 'Travel Agency',
        insurance_agency: 'Insurance Agency',
        interior_designer: 'Interior Designer',
        banquet_hall: 'Banquet Hall'
    };

    return displayNames[category] || category;
};

module.exports = {
    categoryConfig,
    DEFAULT_CONFIG,
    normalizeCategory,
    getCategoryConfig,
    getBookingLabel,
    isBookingEnabled,
    isMenuEnabled,
    getDefaultReplyTone,
    getSupportedCategories,
    getCategoryDisplayName
};
