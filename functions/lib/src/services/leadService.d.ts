/**
 * Create a new lead
 */
export function createLead(leadData: any): Promise<{
    id: string;
    clientUserId: any;
    name: string;
    email: any;
    phone: any;
    source: any;
    status: string;
    score: number;
    automationId: any;
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
    metadata: any;
}>;
/**
 * Check for duplicate lead (by email or phone for same client)
 */
export function checkDuplicate(clientUserId: any, email: any, phone: any): Promise<{
    isDuplicate: boolean;
    existingLead: admin.firestore.DocumentData;
} | {
    isDuplicate: boolean;
    existingLead?: undefined;
}>;
/**
 * Trigger lead automation (WhatsApp messages)
 */
export function triggerLeadAutomation(lead: any, userId: any): Promise<{
    triggered: boolean;
    reason: string;
    messageId?: undefined;
} | {
    triggered: boolean;
    messageId: any;
    reason?: undefined;
}>;
/**
 * Validate phone number format
 */
export function isValidPhone(phone: any): boolean;
/**
 * Validate email format
 */
export function isValidEmail(email: any): boolean;
/**
 * Validate lead source
 */
export function isValidSource(source: any): boolean;
/**
 * Normalize phone number to E.164 format
 */
export function normalizePhone(phone: any): any;
/**
 * Sanitize input string
 */
export function sanitizeString(str: any): string;
/**
 * Check rate limiting for lead capture
 */
export function checkLeadRateLimit(clientUserId: any, ip?: null): Promise<{
    allowed: boolean;
    reason?: undefined;
} | {
    allowed: boolean;
    reason: string;
}>;
/**
 * Log lead event
 */
export function logLeadEvent(leadId: any, clientUserId: any, type: any, metadata?: {}): Promise<void>;
export const MAX_BULK_UPLOAD: 500;
export const LEAD_SOURCES: string[];
export const LEAD_STATUSES: string[];
import admin = require("firebase-admin");
//# sourceMappingURL=leadService.d.ts.map