#!/usr/bin/env node

/**
 * Firebase Emulator Initialization Script
 * 
 * This script initializes the Firebase emulator with test data needed for development.
 * 
 * Usage:
 *   node EMULATOR_INIT.js
 * 
 * Or from package.json:
 *   npm run emulator:init
 */

const http = require('http');

const EMULATOR_URL = 'http://localhost:5001/waautomation-13fa6/us-central1';
const INIT_ENDPOINT = `${EMULATOR_URL}/initializeEmulator`;
const SEED_ENDPOINT = `${EMULATOR_URL}/seedTestUser`;

/**
 * Make HTTP request to emulator endpoint
 */
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const request = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });
        
        request.on('error', (err) => {
            reject(new Error(`Failed to connect to emulator at ${url}: ${err.message}`));
        });
        
        request.setTimeout(5000, () => {
            request.destroy();
            reject(new Error('Request timeout - ensure Firebase emulators are running'));
        });
    });
}

/**
 * Initialize emulator
 */
async function initializeEmulator() {
    console.log('\n🚀 Firebase Emulator Initialization');
    console.log('=====================================\n');
    
    try {
        console.log('⏳ Initializing emulator with test data...');
        const response = await makeRequest(INIT_ENDPOINT);
        
        if (response.status === 200 && response.data.success) {
            console.log('✅ Emulator initialized successfully!\n');
            console.log('Test User Credentials:');
            console.log(`  Email: ${response.data.testUser.email}`);
            console.log(`  Password: ${response.data.testUser.password}`);
            console.log(`  UID: ${response.data.testUser.uid}\n`);
            
            console.log('Status:');
            console.log(`  ✓ Auth setup: ${response.data.status.authSetup}`);
            console.log(`  ✓ Test user created: ${response.data.status.testUserCreated}`);
            console.log(`  ✓ Automations created: ${response.data.status.automationsCreated}\n`);
            
            console.log('🎉 Ready for testing!');
            console.log('   1. Open http://localhost:5173 in your browser');
            console.log('   2. Use the credentials above to login');
            console.log('   3. Access the dashboard and test features\n');
            
            return true;
        } else {
            console.error('❌ Initialization failed:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ Error during initialization:');
        console.error(`   ${error.message}\n`);
        console.error('Make sure:');
        console.error('   1. Firebase emulators are running (firebase emulators:start)');
        console.error('   2. You can access http://localhost:5001');
        console.error('   3. All required Firebase modules are installed\n');
        return false;
    }
}

/**
 * Main execution
 */
async function main() {
    const success = await initializeEmulator();
    process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
    main().catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}

module.exports = { initializeEmulator };
