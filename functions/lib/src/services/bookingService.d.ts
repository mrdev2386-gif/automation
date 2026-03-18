/**
 * Create a new booking / lead
 * PHASE 1: Now includes category, restaurantId, customerPhone
 * UPDATED: Support for True Multi-Tenant Isolation (user-scoped clients)
 * @param {Object} bookingData - Booking data including restaurantId and optional ownerId
 * @returns {Promise<string>} - Created booking ID
 */
export function createBooking(bookingData: Object): Promise<string>;
/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object|null>} - Booking data or null
 */
export function getBookingById(bookingId: string): Promise<Object | null>;
/**
 * Get all bookings for a restaurant (tenant isolation)
 * @param {string} restaurantId - Restaurant ID
 * @param {number} limit - Number of bookings to retrieve
 * @returns {Promise<Array>} - Array of booking data
 */
export function getBookingsByRestaurant(restaurantId: string, limit?: number): Promise<any[]>;
/**
 * Get bookings by customer phone and restaurant
 * @param {string} customerPhone - Customer phone number
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<Array>} - Array of booking data
 */
export function getBookingsByCustomer(customerPhone: string, restaurantId: string): Promise<any[]>;
/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
export function updateBookingStatus(bookingId: string, status: string): Promise<void>;
/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<void>}
 */
export function cancelBooking(bookingId: string): Promise<void>;
/**
 * Get bookings by date for a restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of booking data
 */
export function getBookingsByDate(restaurantId: string, date: string): Promise<any[]>;
/**
 * Get bookings by category for a restaurant
 * Useful for multi-category businesses
 * @param {string} restaurantId - Restaurant ID
 * @param {string} category - Category filter
 * @returns {Promise<Array>} - Array of booking data
 */
export function getBookingsByCategory(restaurantId: string, category: string): Promise<any[]>;
//# sourceMappingURL=bookingService.d.ts.map