/**
 * Send lead to webhook with retry logic
 */
export function sendToWebhook(webhookUrl: any, leadData: any, retryCount?: number): Promise<{
    success: boolean;
    response: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    response?: undefined;
}>;
/**
 * Process webhook for lead
 */
export function processLeadWebhook(userId: any, leadData: any): Promise<void>;
/**
 * Send Lead Finder job completion webhook
 * Sends batch notification when job completes
 */
export function sendLeadFinderWebhook(webhookUrl: any, jobData: any, retryCount?: number): Promise<{
    success: boolean;
    response: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    response?: undefined;
}>;
//# sourceMappingURL=webhookService.d.ts.map