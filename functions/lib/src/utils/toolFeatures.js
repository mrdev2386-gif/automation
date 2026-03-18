"use strict";
/**
 * Tool Feature Flags - Server Side
 * Centralized configuration for tool features and validation
 */
const TOOL_FEATURES = {
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
const VALID_TOOLS = Object.keys(TOOL_FEATURES);
/**
 * Check if user has any tools that require WhatsApp
 * @param {Array<string>} assignedTools - Array of tool IDs assigned to user
 * @returns {boolean} - True if WhatsApp should be enabled
 */
function checkWhatsAppRequirement(assignedTools = []) {
    return assignedTools.some(tool => TOOL_FEATURES[tool]?.whatsapp === true);
}
/**
 * Validate that all tools are in the allowed list
 * @param {Array<string>} tools - Array of tool IDs to validate
 * @returns {boolean} - True if all tools are valid
 */
function validateTools(tools = []) {
    return tools.every(tool => VALID_TOOLS.includes(tool));
}
module.exports = {
    TOOL_FEATURES,
    VALID_TOOLS,
    checkWhatsAppRequirement,
    validateTools
};
//# sourceMappingURL=toolFeatures.js.map