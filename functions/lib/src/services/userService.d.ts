/**
 * Get or create user by phone number and restaurant
 * PHASE 1: Now tracks lastConversationAt and conversationCount
 * @param {string} phoneNumber - User's phone number
 * @param {string} restaurantId - Restaurant ID (tenant)
 * @returns {Promise<Object>} - User data
 */
export function getOrCreateUser(phoneNumber: string, restaurantId: string): Promise<Object>;
/**
 * Update user state (e.g., booking flow state)
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export function updateUser(userId: string, updateData: Object): Promise<void>;
/**
 * Set booking state for user (for multi-step booking flow)
 * @param {string} userId - User ID
 * @param {Object} bookingState - Booking state object
 * @returns {Promise<void>}
 */
export function setBookingState(userId: string, bookingState: Object): Promise<void>;
/**
 * Clear booking state
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export function clearBookingState(userId: string): Promise<void>;
/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - User data or null
 */
export function getUserById(userId: string): Promise<Object | null>;
/**
 * Get all users for a restaurant (tenant isolation)
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<Array>} - Array of user data
 */
export function getUsersByRestaurant(restaurantId: string): Promise<any[]>;
//# sourceMappingURL=userService.d.ts.map