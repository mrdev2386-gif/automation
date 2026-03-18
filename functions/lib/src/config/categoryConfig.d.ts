export namespace categoryConfig {
    namespace clinic {
        let bookingEnabled: boolean;
        let menuEnabled: boolean;
        let defaultIntent: string;
        let bookingLabel: string;
        let defaultReplyTone: string;
    }
    namespace salon {
        let bookingEnabled_1: boolean;
        export { bookingEnabled_1 as bookingEnabled };
        let menuEnabled_1: boolean;
        export { menuEnabled_1 as menuEnabled };
        let defaultIntent_1: string;
        export { defaultIntent_1 as defaultIntent };
        let bookingLabel_1: string;
        export { bookingLabel_1 as bookingLabel };
        let defaultReplyTone_1: string;
        export { defaultReplyTone_1 as defaultReplyTone };
    }
    namespace gym {
        let bookingEnabled_2: boolean;
        export { bookingEnabled_2 as bookingEnabled };
        let menuEnabled_2: boolean;
        export { menuEnabled_2 as menuEnabled };
        let defaultIntent_2: string;
        export { defaultIntent_2 as defaultIntent };
        let bookingLabel_2: string;
        export { bookingLabel_2 as bookingLabel };
        let defaultReplyTone_2: string;
        export { defaultReplyTone_2 as defaultReplyTone };
    }
    namespace coaching {
        let bookingEnabled_3: boolean;
        export { bookingEnabled_3 as bookingEnabled };
        let menuEnabled_3: boolean;
        export { menuEnabled_3 as menuEnabled };
        let defaultIntent_3: string;
        export { defaultIntent_3 as defaultIntent };
        let bookingLabel_3: string;
        export { bookingLabel_3 as bookingLabel };
        let defaultReplyTone_3: string;
        export { defaultReplyTone_3 as defaultReplyTone };
    }
    namespace real_estate {
        let bookingEnabled_4: boolean;
        export { bookingEnabled_4 as bookingEnabled };
        let menuEnabled_4: boolean;
        export { menuEnabled_4 as menuEnabled };
        let defaultIntent_4: string;
        export { defaultIntent_4 as defaultIntent };
        let bookingLabel_4: string;
        export { bookingLabel_4 as bookingLabel };
        let defaultReplyTone_4: string;
        export { defaultReplyTone_4 as defaultReplyTone };
    }
    namespace restaurant {
        let bookingEnabled_5: boolean;
        export { bookingEnabled_5 as bookingEnabled };
        let menuEnabled_5: boolean;
        export { menuEnabled_5 as menuEnabled };
        let defaultIntent_5: string;
        export { defaultIntent_5 as defaultIntent };
        let bookingLabel_5: string;
        export { bookingLabel_5 as bookingLabel };
        let defaultReplyTone_5: string;
        export { defaultReplyTone_5 as defaultReplyTone };
    }
    namespace pathology_lab {
        let bookingEnabled_6: boolean;
        export { bookingEnabled_6 as bookingEnabled };
        let menuEnabled_6: boolean;
        export { menuEnabled_6 as menuEnabled };
        let defaultIntent_6: string;
        export { defaultIntent_6 as defaultIntent };
        let bookingLabel_6: string;
        export { bookingLabel_6 as bookingLabel };
        let defaultReplyTone_6: string;
        export { defaultReplyTone_6 as defaultReplyTone };
    }
    namespace spa_wellness {
        let bookingEnabled_7: boolean;
        export { bookingEnabled_7 as bookingEnabled };
        let menuEnabled_7: boolean;
        export { menuEnabled_7 as menuEnabled };
        let defaultIntent_7: string;
        export { defaultIntent_7 as defaultIntent };
        let bookingLabel_7: string;
        export { bookingLabel_7 as bookingLabel };
        let defaultReplyTone_7: string;
        export { defaultReplyTone_7 as defaultReplyTone };
    }
    namespace car_service {
        let bookingEnabled_8: boolean;
        export { bookingEnabled_8 as bookingEnabled };
        let menuEnabled_8: boolean;
        export { menuEnabled_8 as menuEnabled };
        let defaultIntent_8: string;
        export { defaultIntent_8 as defaultIntent };
        let bookingLabel_8: string;
        export { bookingLabel_8 as bookingLabel };
        let defaultReplyTone_8: string;
        export { defaultReplyTone_8 as defaultReplyTone };
    }
    namespace home_services {
        let bookingEnabled_9: boolean;
        export { bookingEnabled_9 as bookingEnabled };
        let menuEnabled_9: boolean;
        export { menuEnabled_9 as menuEnabled };
        let defaultIntent_9: string;
        export { defaultIntent_9 as defaultIntent };
        let bookingLabel_9: string;
        export { bookingLabel_9 as bookingLabel };
        let defaultReplyTone_9: string;
        export { defaultReplyTone_9 as defaultReplyTone };
    }
    namespace travel_agency {
        let bookingEnabled_10: boolean;
        export { bookingEnabled_10 as bookingEnabled };
        let menuEnabled_10: boolean;
        export { menuEnabled_10 as menuEnabled };
        let defaultIntent_10: string;
        export { defaultIntent_10 as defaultIntent };
        let bookingLabel_10: string;
        export { bookingLabel_10 as bookingLabel };
        let defaultReplyTone_10: string;
        export { defaultReplyTone_10 as defaultReplyTone };
    }
    namespace insurance_agency {
        let bookingEnabled_11: boolean;
        export { bookingEnabled_11 as bookingEnabled };
        let menuEnabled_11: boolean;
        export { menuEnabled_11 as menuEnabled };
        let defaultIntent_11: string;
        export { defaultIntent_11 as defaultIntent };
        let bookingLabel_11: string;
        export { bookingLabel_11 as bookingLabel };
        let defaultReplyTone_11: string;
        export { defaultReplyTone_11 as defaultReplyTone };
    }
    namespace interior_designer {
        let bookingEnabled_12: boolean;
        export { bookingEnabled_12 as bookingEnabled };
        let menuEnabled_12: boolean;
        export { menuEnabled_12 as menuEnabled };
        let defaultIntent_12: string;
        export { defaultIntent_12 as defaultIntent };
        let bookingLabel_12: string;
        export { bookingLabel_12 as bookingLabel };
        let defaultReplyTone_12: string;
        export { defaultReplyTone_12 as defaultReplyTone };
    }
    namespace banquet_hall {
        let bookingEnabled_13: boolean;
        export { bookingEnabled_13 as bookingEnabled };
        let menuEnabled_13: boolean;
        export { menuEnabled_13 as menuEnabled };
        let defaultIntent_13: string;
        export { defaultIntent_13 as defaultIntent };
        let bookingLabel_13: string;
        export { bookingLabel_13 as bookingLabel };
        let defaultReplyTone_13: string;
        export { defaultReplyTone_13 as defaultReplyTone };
    }
}
export namespace DEFAULT_CONFIG {
    let bookingEnabled_14: boolean;
    export { bookingEnabled_14 as bookingEnabled };
    let menuEnabled_14: boolean;
    export { menuEnabled_14 as menuEnabled };
    let defaultIntent_14: string;
    export { defaultIntent_14 as defaultIntent };
    let bookingLabel_14: string;
    export { bookingLabel_14 as bookingLabel };
    let defaultReplyTone_14: string;
    export { defaultReplyTone_14 as defaultReplyTone };
}
/**
 * Normalize category to lowercase snake_case
 * @param {string} category - Raw category input
 * @returns {string} - Normalized category
 */
export function normalizeCategory(category: string): string;
/**
 * Get configuration for a specific business category
 * @param {string} category - Business category (e.g., clinic, salon)
 * @returns {Object} Configuration object
 */
export function getCategoryConfig(category: string): Object;
/**
 * Get booking label for a category
 * @param {string} category - Business category
 * @returns {string} Label for booking (e.g., 'appointment', 'table')
 */
export function getBookingLabel(category: string): string;
/**
 * Check if booking is enabled for a category
 * @param {string} category - Business category
 * @returns {boolean} - Whether booking is enabled
 */
export function isBookingEnabled(category: string): boolean;
/**
 * Check if menu is enabled for a category
 * @param {string} category - Business category
 * @returns {boolean} - Whether menu is enabled
 */
export function isMenuEnabled(category: string): boolean;
/**
 * Get default reply tone for a category
 * @param {string} category - Business category
 * @returns {string} - Reply tone (professional, friendly, etc.)
 */
export function getDefaultReplyTone(category: string): string;
/**
 * Get all supported categories
 * @returns {Array<string>} - Array of supported category names
 */
export function getSupportedCategories(): Array<string>;
/**
 * Get category display name (human-readable)
 * @param {string} category - Category in snake_case
 * @returns {string} - Human readable name
 */
export function getCategoryDisplayName(category: string): string;
//# sourceMappingURL=categoryConfig.d.ts.map