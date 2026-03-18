export namespace TOOL_FEATURES {
    namespace lead_finder {
        let whatsapp: boolean;
    }
    namespace whatsapp_ai_assistant {
        let whatsapp_1: boolean;
        export { whatsapp_1 as whatsapp };
    }
    namespace ai_lead_agent {
        let whatsapp_2: boolean;
        export { whatsapp_2 as whatsapp };
    }
    namespace hotel_automation {
        let whatsapp_3: boolean;
        export { whatsapp_3 as whatsapp };
    }
    namespace restaurant_automation {
        let whatsapp_4: boolean;
        export { whatsapp_4 as whatsapp };
    }
    namespace saas_automation {
        let whatsapp_5: boolean;
        export { whatsapp_5 as whatsapp };
    }
    namespace whatsapp_automation {
        let whatsapp_6: boolean;
        export { whatsapp_6 as whatsapp };
    }
    namespace crm {
        let whatsapp_7: boolean;
        export { whatsapp_7 as whatsapp };
    }
    namespace analytics {
        let whatsapp_8: boolean;
        export { whatsapp_8 as whatsapp };
    }
    namespace reporting {
        let whatsapp_9: boolean;
        export { whatsapp_9 as whatsapp };
    }
}
export const VALID_TOOLS: string[];
/**
 * Check if user has any tools that require WhatsApp
 * @param {Array<string>} assignedTools - Array of tool IDs assigned to user
 * @returns {boolean} - True if WhatsApp should be enabled
 */
export function checkWhatsAppRequirement(assignedTools?: Array<string>): boolean;
/**
 * Validate that all tools are in the allowed list
 * @param {Array<string>} tools - Array of tool IDs to validate
 * @returns {boolean} - True if all tools are valid
 */
export function validateTools(tools?: Array<string>): boolean;
//# sourceMappingURL=toolFeatures.d.ts.map