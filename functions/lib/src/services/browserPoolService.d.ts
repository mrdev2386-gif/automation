/**
 * Initialize browser pool
 */
export function initializeBrowserPool(): Promise<void>;
/**
 * Get browser from pool or create new one
 */
export function getBrowser(launchOptions?: {}): Promise<{
    browser: any;
    poolIndex: number;
}>;
/**
 * Release browser back to pool
 */
export function releaseBrowser(poolIndex: any): void;
/**
 * Close all browsers in pool
 */
export function closeAllBrowsers(): Promise<void>;
//# sourceMappingURL=browserPoolService.d.ts.map