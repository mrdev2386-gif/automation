/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Phone number in any format
 * @returns {string} - Phone number in E.164 format
 */
export function normalizePhoneNumber(phone: string): string;
/**
 * Format phone number for display
 * @param {string} phone - Phone number in E.164 format
 * @returns {string} - Formatted phone number
 */
export function formatPhoneForDisplay(phone: string): string;
/**
 * Extract date from various formats
 * @param {string} dateString - Date string in various formats
 * @returns {string|null} - Date in YYYY-MM-DD format or null
 */
export function extractDate(dateString: string): string | null;
/**
 * Extract time from various formats
 * @param {string} timeString - Time string in various formats
 * @returns {string|null} - Time in HH:MM format or null
 */
export function extractTime(timeString: string): string | null;
/**
 * Extract number of guests from text
 * @param {string} text - User's text
 * @returns {number|null} - Number of guests or null
 */
export function extractGuestCount(text: string): number | null;
/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid email
 */
export function isValidEmail(email: string): boolean;
/**
 * Extract email from text
 * @param {string} text - Text to search
 * @returns {string|null} - Extracted email or null
 */
export function extractEmail(text: string): string | null;
/**
 * Extract phone number from text
 * @param {string} text - Text to search
 * @returns {string|null} - Extracted phone or null
 */
export function extractPhone(text: string): string | null;
/**
 * Sanitize user input to prevent injection
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input: string): string;
/**
 * Generate a simple booking reference
 * @returns {string} - Booking reference
 */
export function generateBookingReference(): string;
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
export function validateBookingStep(category: string, step: string, userInput: string): Object;
//# sourceMappingURL=helpers.d.ts.map