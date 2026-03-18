#!/usr/bin/env node
"use strict";
/**
 * CORS Verification Test Script
 * Tests all HTTP endpoints with CORS support
 */
const admin = require('firebase-admin');
// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}
function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}
async function verifyFunctions() {
    logSection('🔍 CORS Implementation Verification');
    const fs = require('fs');
    const path = require('path');
    const indexPath = path.join(__dirname, 'index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    // Check 1: CORS package import
    log('\n✓ Checking CORS package import...', 'blue');
    if (indexContent.includes("const cors = require('cors')")) {
        log('  ✅ CORS package imported correctly', 'green');
    }
    else {
        log('  ❌ CORS package not imported', 'red');
        return false;
    }
    // Check 2: HTTP functions with CORS
    const httpFunctions = [
        'getMyAutomationsHTTP',
        'getClientConfigHTTP',
        'getMyLeadFinderLeadsHTTP',
        'getLeadFinderConfigHTTP'
    ];
    log('\n✓ Checking HTTP functions with CORS...', 'blue');
    let allFound = true;
    for (const funcName of httpFunctions) {
        if (indexContent.includes(`exports.${funcName}`)) {
            log(`  ✅ ${funcName} - Found`, 'green');
            // Check if it uses cors
            const funcStart = indexContent.indexOf(`exports.${funcName}`);
            const funcEnd = indexContent.indexOf('exports.', funcStart + 1);
            const funcContent = indexContent.substring(funcStart, funcEnd);
            if (funcContent.includes('cors(req, res')) {
                log(`     ✅ Uses CORS middleware`, 'green');
            }
            else {
                log(`     ❌ Missing CORS middleware`, 'red');
                allFound = false;
            }
            if (funcContent.includes('Authorization')) {
                log(`     ✅ Has Bearer token authentication`, 'green');
            }
            else {
                log(`     ⚠️  Missing authentication`, 'yellow');
            }
        }
        else {
            log(`  ❌ ${funcName} - Not found`, 'red');
            allFound = false;
        }
    }
    // Check 3: Package.json
    log('\n✓ Checking package.json...', 'blue');
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (packageJson.dependencies.cors) {
        log(`  ✅ CORS package installed: ${packageJson.dependencies.cors}`, 'green');
    }
    else {
        log('  ❌ CORS package not in dependencies', 'red');
        return false;
    }
    // Summary
    logSection('📊 Verification Summary');
    if (allFound) {
        log('\n✅ All CORS implementations verified successfully!', 'green');
        log('\n📝 Next Steps:', 'cyan');
        log('  1. Restart Firebase emulator: firebase emulators:start', 'blue');
        log('  2. Test endpoints in browser DevTools', 'blue');
        log('  3. Verify CORS headers in Network tab', 'blue');
        log('  4. Deploy to production: firebase deploy --only functions', 'blue');
        return true;
    }
    else {
        log('\n❌ Some checks failed. Please review the errors above.', 'red');
        return false;
    }
}
// Run verification
verifyFunctions()
    .then(success => {
    process.exit(success ? 0 : 1);
})
    .catch(error => {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
});
//# sourceMappingURL=verifyCORS.js.map