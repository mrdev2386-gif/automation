"use strict";
/**
 * Browser Pool Service
 * Manages a pool of Puppeteer browsers for reuse across jobs
 * Improves performance by avoiding repeated browser launches
 */
const puppeteer = require('puppeteer');
const MAX_BROWSERS = 2;
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
let browserPool = [];
let idleTimers = new Map();
/**
 * Initialize browser pool
 */
const initializeBrowserPool = async () => {
    console.log('🔧 Initializing browser pool...');
    browserPool = [];
    idleTimers.clear();
};
/**
 * Get browser from pool or create new one
 */
const getBrowser = async (launchOptions = {}) => {
    // Find available browser
    for (let i = 0; i < browserPool.length; i++) {
        const browserInfo = browserPool[i];
        if (!browserInfo.inUse) {
            browserInfo.inUse = true;
            clearIdleTimer(i);
            console.log(`♻️  Reusing browser ${i}`);
            return { browser: browserInfo.browser, poolIndex: i };
        }
    }
    // Create new browser if pool not full
    if (browserPool.length < MAX_BROWSERS) {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                ...((launchOptions.args || []))
            ]
        });
        const poolIndex = browserPool.length;
        browserPool.push({ browser, inUse: true });
        console.log(`🆕 Created browser ${poolIndex} (pool: ${browserPool.length}/${MAX_BROWSERS})`);
        return { browser, poolIndex };
    }
    // Wait for available browser
    console.log('⏳ Waiting for available browser...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getBrowser(launchOptions);
};
/**
 * Release browser back to pool
 */
const releaseBrowser = (poolIndex) => {
    if (poolIndex >= 0 && poolIndex < browserPool.length) {
        browserPool[poolIndex].inUse = false;
        startIdleTimer(poolIndex);
        console.log(`✅ Released browser ${poolIndex}`);
    }
};
/**
 * Start idle timer for browser
 */
const startIdleTimer = (poolIndex) => {
    clearIdleTimer(poolIndex);
    const timer = setTimeout(async () => {
        if (!browserPool[poolIndex].inUse) {
            try {
                await browserPool[poolIndex].browser.close();
                browserPool.splice(poolIndex, 1);
                idleTimers.delete(poolIndex);
                console.log(`🗑️  Closed idle browser ${poolIndex}`);
            }
            catch (error) {
                console.error('Error closing idle browser:', error);
            }
        }
    }, IDLE_TIMEOUT);
    idleTimers.set(poolIndex, timer);
};
/**
 * Clear idle timer
 */
const clearIdleTimer = (poolIndex) => {
    if (idleTimers.has(poolIndex)) {
        clearTimeout(idleTimers.get(poolIndex));
        idleTimers.delete(poolIndex);
    }
};
/**
 * Close all browsers in pool
 */
const closeAllBrowsers = async () => {
    for (const timer of idleTimers.values()) {
        clearTimeout(timer);
    }
    idleTimers.clear();
    for (const browserInfo of browserPool) {
        try {
            await browserInfo.browser.close();
        }
        catch (error) {
            console.error('Error closing browser:', error);
        }
    }
    browserPool = [];
    console.log('🛑 Closed all browsers');
};
module.exports = {
    initializeBrowserPool,
    getBrowser,
    releaseBrowser,
    closeAllBrowsers
};
//# sourceMappingURL=browserPoolService.js.map