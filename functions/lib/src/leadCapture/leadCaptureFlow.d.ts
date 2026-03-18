/**
 * Handle lead capture flow
 * @param {string} phoneNumber - User phone number
 * @param {string} clientId - Client ID
 * @param {string} messageText - User message
 * @returns {Promise<string>} - Response text
 */
export function handleLeadCaptureFlow(phoneNumber: string, clientId: string, messageText: string): Promise<string>;
/**
 * Get bot configuration for a client
 * @param {string} clientId - Client ID
 * @returns {Promise<Object|null>} - Bot config or null
 */
export function getClientBotConfig(clientId: string): Promise<Object | null>;
/**
 * Get questions based on industry type and custom questions
 * @param {string} industryType - Industry type
 * @param {Array} customQuestions - Custom questions from client config
 * @returns {Array} - Array of questions
 */
export function getQuestionsForIndustry(industryType: string, customQuestions?: any[]): any[];
/**
 * Create lead in Firestore under client
 * @param {string} clientId - Client ID
 * @param {Object} leadData - Lead data
 * @returns {Promise<string>} - Lead ID
 */
export function createLead(clientId: string, leadData: Object): Promise<string>;
/**
 * Get or create lead capture state for user
 * @param {string} phoneNumber - User phone number
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} - Lead capture state
 */
export function getOrCreateLeadState(phoneNumber: string, clientId: string): Promise<Object>;
/**
 * Update lead capture state
 * @param {string} stateId - State ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export function updateLeadState(stateId: string, updates: Object): Promise<void>;
/**
 * Clear lead capture state (mark as completed)
 * @param {string} stateId - State ID
 * @returns {Promise<void>}
 */
export function clearLeadState(stateId: string): Promise<void>;
export namespace LEAD_STEPS {
    let START: string;
    let AWAITING_NAME: string;
    let AWAITING_CONTACT: string;
    let AWAITING_REQUIREMENT: string;
    let COMPLETED: string;
    let HUMAN_HANDOFF: string;
}
export namespace INDUSTRY_QUESTIONS {
    let restaurant: {
        key: string;
        question: string;
        required: boolean;
    }[];
    let hotel: {
        key: string;
        question: string;
        required: boolean;
    }[];
    let saas: ({
        key: string;
        question: string;
        required: boolean;
        openText: boolean;
    } | {
        key: string;
        question: string;
        required: boolean;
        openText?: undefined;
    })[];
    let service: ({
        key: string;
        question: string;
        required: boolean;
        openText: boolean;
    } | {
        key: string;
        question: string;
        required: boolean;
        openText?: undefined;
    })[];
    let spa: {
        key: string;
        question: string;
        required: boolean;
    }[];
    let salon: {
        key: string;
        question: string;
        required: boolean;
    }[];
    let clinic: {
        key: string;
        question: string;
        required: boolean;
    }[];
    let gym: {
        key: string;
        question: string;
        required: boolean;
    }[];
}
//# sourceMappingURL=leadCaptureFlow.d.ts.map