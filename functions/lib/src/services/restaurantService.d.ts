/**
 * Get restaurant/client by WhatsApp phone number ID
 * This is the core function that identifies which client a message belongs to
 * UPDATED: Uses collectionGroup for TRUE multi-tenant isolation
 * @param {string} phoneNumberId - The WhatsApp phone number ID
 * @returns {Promise<Object|null>} - Client data or null if not found
 */
export function getRestaurantByPhoneNumberId(phoneNumberId: string): Promise<Object | null>;
/**
 * Get restaurant/client by WhatsApp phone number (E.164 format)
 * @param {string} whatsappNumber - WhatsApp number in E.164 format
 * @returns {Promise<Object|null>} - Client data or null if not found
 */
export function getRestaurantByWhatsAppNumber(whatsappNumber: string): Promise<Object | null>;
/**
 * Get restaurant by ID
 * @param {string} restaurantId - Firestore document ID
 * @returns {Promise<Object|null>} - Restaurant data or null if not found
 */
export function getRestaurantById(restaurantId: string): Promise<Object | null>;
/**
 * Create a new restaurant
 * PHASE 1: Normalizes category and sets defaults
 * @param {Object} restaurantData - Restaurant data
 * @returns {Promise<string>} - Created restaurant ID
 */
export function createRestaurant(restaurantData: Object): Promise<string>;
/**
 * Update restaurant data
 * PHASE 1: Normalizes category on update
 * @param {string} restaurantId - Restaurant ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export function updateRestaurant(restaurantId: string, updateData: Object): Promise<void>;
/**
 * Get all restaurants (for admin purposes)
 * @returns {Promise<Array>} - Array of restaurant data
 */
export function getAllRestaurants(): Promise<any[]>;
/**
 * Get restaurant by owner ID (for multi-tenant)
 * @param {string} ownerId - Owner user ID
 * @returns {Promise<Array>} - Array of restaurant data
 */
export function getRestaurantsByOwner(ownerId: string): Promise<any[]>;
/**
 * Check if whatsappNumberId is already in use (for validation)
 * @param {string} whatsappNumberId - WhatsApp Number ID
 * @param {string} excludeRestaurantId - Restaurant ID to exclude (for updates)
 * @returns {Promise<boolean>} - True if already in use
 */
export function isWhatsappNumberIdInUse(whatsappNumberId: string, excludeRestaurantId?: string): Promise<boolean>;
/**
 * Validate and normalize restaurant data before create/update
 * @param {Object} restaurantData - Raw restaurant data
 * @returns {Object} - Normalized restaurant data
 */
export function normalizeRestaurantData(restaurantData: Object): Object;
//# sourceMappingURL=restaurantService.d.ts.map