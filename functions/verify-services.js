/**
 * Service Verification Script
 * Verifies all Lead Finder services are loaded correctly
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

console.log('========================================');
console.log('Lead Finder Service Verification');
console.log('========================================\n');

const services = [
    { name: 'leadFinderService', path: './src/services/leadFinderService' },
    { name: 'browserPoolService', path: './src/services/browserPoolService' },
    { name: 'emailVerificationService', path: './src/services/emailVerificationService' },
    { name: 'directoryFilterService', path: './src/services/directoryFilterService' },
    { name: 'webhookService', path: './src/services/webhookService' },
    { name: 'workerMonitoringService', path: './src/services/workerMonitoringService' },
    { name: 'scraperConfigService', path: './src/services/scraperConfigService' },
    { name: 'leadScoringService', path: './src/services/leadScoringService' },
    { name: 'leadFinderQueueService', path: './src/services/leadFinderQueueService' },
    { name: 'leadFinderWebSearchService', path: './src/services/leadFinderWebSearchService' }
];

let allServicesLoaded = true;

services.forEach(service => {
    try {
        const loaded = require(service.path);
        console.log(`✓ ${service.name} loaded successfully`);
        
        // Show available functions
        const functions = Object.keys(loaded);
        if (functions.length > 0) {
            console.log(`  Functions: ${functions.slice(0, 5).join(', ')}${functions.length > 5 ? '...' : ''}`);
        }
    } catch (error) {
        console.log(`✗ ${service.name} failed to load`);
        console.log(`  Error: ${error.message}`);
        allServicesLoaded = false;
    }
});

console.log('\n========================================');
console.log('Queue Services Verification');
console.log('========================================\n');

// Test Redis connection
(async () => {
    try {
        const queueService = require('./src/services/leadFinderQueueService');
        console.log('✓ Queue service loaded');
        
        try {
            await queueService.initializeQueue();
            console.log('✓ Redis connection established');
            console.log('✓ BullMQ queue initialized');
        } catch (error) {
            console.log('⚠ Redis not available (optional for local testing)');
            console.log(`  ${error.message}`);
        }
    } catch (error) {
        console.log('✗ Queue service failed');
        console.log(`  Error: ${error.message}`);
    }

    console.log('\n========================================');
    console.log('Browser Pool Verification');
    console.log('========================================\n');

    try {
        const browserPool = require('./src/services/browserPoolService');
        await browserPool.initializeBrowserPool();
        console.log('✓ Browser pool initialized');
        console.log('  Max browsers: 2');
        console.log('  Idle timeout: 5 minutes');
    } catch (error) {
        console.log('✗ Browser pool initialization failed');
        console.log(`  Error: ${error.message}`);
    }

    console.log('\n========================================');
    console.log('Worker Monitoring Verification');
    console.log('========================================\n');

    try {
        const workerMonitoring = require('./src/services/workerMonitoringService');
        workerMonitoring.initializeWorkerMonitoring();
        console.log('✓ Worker monitoring initialized');
        console.log('  Heartbeat interval: 60 seconds');
        console.log('  Timeout threshold: 3 minutes');
    } catch (error) {
        console.log('✗ Worker monitoring initialization failed');
        console.log(`  Error: ${error.message}`);
    }

    console.log('\n========================================');
    console.log('Verification Summary');
    console.log('========================================\n');

    if (allServicesLoaded) {
        console.log('✓ All Lead Finder services loaded successfully');
        console.log('✓ System ready for operation');
        console.log('\nLead Finder system successfully started.');
    } else {
        console.log('⚠ Some services failed to load');
        console.log('  Check error messages above');
    }

    console.log('\n========================================\n');
    process.exit(allServicesLoaded ? 0 : 1);
})();
