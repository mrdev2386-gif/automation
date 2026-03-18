/**
 * Verify email address
 *
 * @param {string} email - Email address to verify
 * @param {object} options - Verification options
 * @param {boolean} options.allowPersonalEmails - Allow personal domains (default: false)
 * @param {boolean} options.checkMX - Check MX records (default: true)
 * @param {boolean} options.checkDisposable - Check disposable domains (default: true)
 *
 * @returns {object} Verification result
 */
export function verifyEmail(email: string, options?: {
    allowPersonalEmails: boolean;
    checkMX: boolean;
    checkDisposable: boolean;
}): object;
/**
 * Batch verify multiple emails
 */
export function verifyEmailBatch(emails: any, options?: {}): Promise<object[]>;
/**
 * Quick validation (format + disposable only, no DNS)
 * Useful for fast validation without network calls
 */
export function quickVerifyEmail(email: any, allowPersonalEmails?: boolean): {
    valid: boolean;
    email: any;
    reason: null;
};
/**
 * Step 1: Regex validation
 */
export function isValidEmailFormat(email: any): boolean;
/**
 * Step 2: Extract domain from email
 */
export function extractDomain(email: any): string | null;
/**
 * Step 3: Check if domain is disposable
 */
export function isDisposableDomain(domain: any): boolean;
/**
 * Step 4: Check if domain is personal (not business)
 */
export function isPersonalDomain(domain: any): boolean;
/**
 * Step 5: DNS MX record validation
 * Checks if domain has valid mail exchange records
 */
export function hasMXRecord(domain: any): Promise<boolean>;
export const DISPOSABLE_DOMAINS: Set<string>;
export const PERSONAL_DOMAINS: Set<string>;
//# sourceMappingURL=emailVerificationService.d.ts.map