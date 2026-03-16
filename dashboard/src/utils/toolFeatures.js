/**
 * Tool Feature Flags
 * Centralized configuration for tool features
 */

export const TOOL_FEATURES = {
    lead_finder: { whatsapp: true },
    whatsapp_ai_assistant: { whatsapp: true },
    ai_lead_agent: { whatsapp: true },
    hotel_automation: { whatsapp: true },
    restaurant_automation: { whatsapp: true },
    saas_automation: { whatsapp: true },
    whatsapp_automation: { whatsapp: true },
    crm: { whatsapp: false },
    analytics: { whatsapp: false },
    reporting: { whatsapp: false }
};

/**
 * Check if user has any tools that require WhatsApp
 * @param {Array<string>} assignedTools - Array of tool IDs assigned to user
 * @returns {boolean} - True if WhatsApp should be enabled
 */
export function checkWhatsAppRequirement(assignedTools = []) {
    return assignedTools.some(tool => TOOL_FEATURES[tool]?.whatsapp === true);
}
