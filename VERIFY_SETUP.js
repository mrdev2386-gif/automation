#!/usr/bin/env node

/**
 * Firebase Emulator Health Check & Test Script
 * 
 * Verifies that all emulators are running and initialized correctly.
 * 
 * Usage:
 *   node VERIFY_SETUP.js
 */

const http = require('http');

const CHECKS = {
    'Auth Emulator': { url: 'http://localhost:9099', port: 9099 },
    'Functions Emulator': { url: 'http://localhost:5001', port: 5001 },
    'Firestore Emulator': { url: 'http://localhost:8080', port: 8080 },
    'Hosting Emulator': { url: 'http://localhost:5000', port: 5000 }
};

const ENDPOINTS = [
    { 
        name: 'seedTestUser', 
        url: 'http://localhost:5001/waautomation-13fa6/us-central1/seedTestUser',
        method: 'GET'
    },
    { 
        name: 'initializeEmulator', 
        url: 'http://localhost:5001/waautomation-13fa6/us-central1/initializeEmulator',
        method: 'GET'
    }
];

/**
 * Test a URL
 */
function testUrl(url, method = 'GET') {
    return new Promise((resolve) => {
        const options = {
            method: method,
            timeout: 3000
        };

        const request = http.get(url, options, (res) => {
            resolve({
                status: res.statusCode,
                reachable: true
            });
        });

        request.on('error', () => {
            resolve({
                reachable: false,
                error: 'Connection refused'
            });
        });

        request.on('timeout', () => {
            request.destroy();
            resolve({
                reachable: false,
                error: 'Timeout'
            });
        });
    });
}

/**
 * Run all checks
 */
async function runChecks() {
    console.log('\n🔍 Firebase Emulator Health Check');
    console.log('===================================\n');

    // Check emulators
    console.log('1️⃣  Emulator Status:');
    console.log('─' .repeat(40));

    let allEmulatorRunning = true;
    for (const [name, config] of Object.entries(CHECKS)) {
        // Parse port from URL
        const portMatch = config.url.match(/:(\d+)$/);
        const port = portMatch ? portMatch[1] : config.port;

        const result = await testUrl(config.url);

        if (result.reachable) {
            console.log(`  ✓ ${name.padEnd(20)} ${config.url}`);
        } else {
            console.log(`  ✗ ${name.padEnd(20)} Not running (${result.error})`);
            allEmulatorRunning = false;
        }
    }

    if (!allEmulatorRunning) {
        console.log('\n⚠️  Some emulators are not running.');
        console.log('   Run: firebase emulators:start\n');
        return { emulators: false };
    }

    console.log('\n✅ All emulators running!\n');

    // Check endpoints
    console.log('2️⃣  Firebase Functions:');
    console.log('─' .repeat(40));

    let allFunctionsReady = true;
    for (const endpoint of ENDPOINTS) {
        const result = await testUrl(endpoint.url);

        if (result.reachable) {
            console.log(`  ✓ ${endpoint.name.padEnd(25)} Ready (${result.status})`);
        } else {
            console.log(`  ✗ ${endpoint.name.padEnd(25)} Error (${result.error})`);
            allFunctionsReady = false;
        }
    }

    console.log();

    return {
        emulators: allEmulatorRunning,
        functions: allFunctionsReady
    };
}

/**
 * Display recommendations
 */
function displayRecommendations(checkResults) {
    console.log('📋 Recommendations:');
    console.log('─' .repeat(40));

    const steps = [
        '1. Ensure emulators are running:',
        '   firebase emulators:start',
        '',
        '2. Initialize test data:',
        '   npm run emulator:init  (or node EMULATOR_INIT.js)',
        '',
        '3. Start frontend:',
        '   cd dashboard && npm run dev',
        '',
        '4. Open browser:',
        '   http://localhost:5173',
        '',
        '5. Login with test credentials:',
        '   Email: mrdev2386@gmail.com',
        '   Password: test123456'
    ];

    steps.forEach(step => console.log('   ' + step));

    console.log();
    console.log('✅ Full setup instructions: EMULATOR_TROUBLESHOOTING.md\n');
}

/**
 * Main
 */
async function main() {
    const results = await runChecks();
    displayRecommendations(results);

    // Exit code
    const allGood = results.emulators && results.functions;
    process.exit(allGood ? 0 : 1);
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
