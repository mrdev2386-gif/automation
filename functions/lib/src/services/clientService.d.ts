/**
 * Get client by ID
 * @param {string} clientId - Client ID
 * @returns {Promise<Object|null>} - Client data or null
 */
export function getClientById(clientId: string): Promise<Object | null>;
/**
 * Get client by WhatsApp Phone Number ID
 * @param {string} phoneNumberId - WhatsApp Phone Number ID
 * @returns {Promise<Object|null>} - Client data or null
 */
export function getClientByPhoneNumberId(phoneNumberId: string): Promise<Object | null>;
/**
 * Get client by WhatsApp Number
 * @param {string} whatsappNumber - WhatsApp number (E.164 format)
 * @returns {Promise<Object|null>} - Client data or null
 */
export function getClientByWhatsAppNumber(whatsappNumber: string): Promise<Object | null>;
/**
 * Create a new client
 * @param {Object} clientData - Client data
 * @returns {Promise<string>} - Client ID
 */
export function createClient(clientData: Object): Promise<string>;
/**
 * Update client
 * @param {string} clientId - Client ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export function updateClient(clientId: string, updates: Object): Promise<void>;
/**
 * Update client bot configuration
 * @param {string} clientId - Client ID
 * @param {Object} botConfig - Bot configuration
 * @returns {Promise<void>}
 */
export function updateClientBotConfig(clientId: string, botConfig: Object): Promise<void>;
/**
 * Get all leads for a client
 * @param {string} clientId - Client ID
 * @param {number} limit - Maximum number of leads to return
 * @returns {Promise<Array>} - Array of leads
 */
export function getClientLeads(clientId: string, limit?: number): Promise<any[]>;
/**
 * Get lead by ID
 * @param {string} clientId - Client ID
 * @param {string} leadId - Lead ID
 * @returns {Promise<Object|null>} - Lead data or null
 */
export function getLeadById(clientId: string, leadId: string): Promise<Object | null>;
/**
 * Update lead status
 * @param {string} clientId - Client ID
 * @param {string} leadId - Lead ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
export function updateLeadStatus(clientId: string, leadId: string, status: string): Promise<void>;
/**
 * Get client statistics
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} - Client statistics
 */
export function getClientStats(clientId: string): Promise<Object>;
//# sourceMappingURL=clientService.d.ts.map