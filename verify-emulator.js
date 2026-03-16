#!/usr/bin/env node

/**
 * Firebase Emulator Verification Script
 * Checks if emulator is running and properly configured
 */

const http = require('http');

const checks = [
    { name: 'Functions Emulator', host: 'localhost', port: 5001 },
    { name: 'Firestore Emulator', host: '127.0.0.1', port: 8085 },
    { name: 'Auth Emulator', host: 'localhost', port: 9100 }
];

async function checkPort(host, port) {
    return new Promise((resolve) => {
        const req = http.request(
            { host, port, method: 'GET', timeout: 2000 },
            () => resolve(true)
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        req.end();
    });
}

async function verify() {
    console.log('\n🔍 Firebase Emulator Verification\n');
    
    let allRunning = true;
    
    for (const check of checks) {
        const isRunning = await checkPort(check.host, check.port);
        const status = isRunning ? '✅' : '❌';
        console.log(`${status} ${check.name}: ${check.host}:${check.port}`);
        if (!isRunning) allRunning = false;
    }
    
    console.log('\n' + (allRunning ? '✅ All emulators running!' : '❌ Some emulators not running'));
    console.log('\nTo start emulators, run:');
    console.log('  firebase emulators:start\n');
    
    process.exit(allRunning ? 0 : 1);
}

verify();
