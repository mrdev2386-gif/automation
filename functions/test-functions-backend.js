/**
 * Backend Firebase Functions Test
 * Tests function exports and basic structure
 * 
 * Run: node test-functions-backend.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

console.log('========================================');
console.log('🧪 BACKEND FUNCTIONS STRUCTURE TEST');
console.log('========================================\n');

const results = {
    passed: 0,
    failed: 0,
    tests: []
};

const recordTest = (name, passed, error = null) => {
    results.tests.push({ name, passed, error });
    if (passed) {
        results.passed++;
        console.log(`✅ ${name}`);
    } else {
        results.failed++;
        console.error(`❌ ${name}`);
        if (error) console.error(`   Error: ${error}`);
    }
};

// ========================================================================
// TEST 1: Load index.js
// ========================================================================
console.log('📋 TEST 1: Loading index.js...\n');

let indexModule;
try {
    indexModule = require('./index.js');
    recordTest('index.js loads successfully', true);
    console.log(`   Exports: ${Object.keys(indexModule).length} functions\n`);
} catch (error) {
    recordTest('index.js loads successfully', false, error.message);
    console.error('   Full error:', error);
    process.exit(1);
}

// ========================================================================
// TEST 2: Verify critical functions exist
// ========================================================================
console.log('📋 TEST 2: Verifying critical functions exist...\n');

const criticalFunctions = [
    'test',
    'createUser',
    'getAllUsers',
    'getUserProfile',
    'getAllAutomations',
    'getMyAutomations',
    'ensureLeadFinderAutomation',
    'getLeadFinderConfig',
    'saveLeadFinderAPIKey'
];

criticalFunctions.forEach(funcName => {
    if (indexModule[funcName]) {
        recordTest(`Function '${funcName}' exists`, true);
    } else {
        recordTest(`Function '${funcName}' exists`, false, 'Not found in exports');
    }
});

console.log('\n');

// ========================================================================
// TEST 3: Check for duplicate exports
// ========================================================================
console.log('📋 TEST 3: Checking for duplicate exports...\n');

const exportNames = Object.keys(indexModule);
const uniqueNames = [...new Set(exportNames)];

if (exportNames.length === uniqueNames.length) {
    recordTest('No duplicate exports', true);
    console.log(`   Total exports: ${exportNames.length}\n`);
} else {
    const duplicates = exportNames.filter((item, index) => exportNames.indexOf(item) !== index);
    recordTest('No duplicate exports', false, `Duplicates: ${duplicates.join(', ')}`);
}

// ========================================================================
// TEST 4: Verify function types
// ========================================================================
console.log('📋 TEST 4: Verifying function types...\n');

let validFunctions = 0;
let invalidFunctions = 0;

Object.entries(indexModule).forEach(([name, func]) => {
    if (typeof func === 'function' || (func && typeof func === 'object' && func.__trigger)) {
        validFunctions++;
    } else {
        invalidFunctions++;
        console.warn(`   ⚠️  ${name} is not a valid Cloud Function`);
    }
});

if (invalidFunctions === 0) {
    recordTest('All exports are valid functions', true);
    console.log(`   Valid functions: ${validFunctions}\n`);
} else {
    recordTest('All exports are valid functions', false, `${invalidFunctions} invalid exports`);
}

// ========================================================================
// TEST 5: Load individual modules
// ========================================================================
console.log('📋 TEST 5: Loading individual modules...\n');

const modules = [
    { name: 'users', path: './users.js' },
    { name: 'automations', path: './automations.js' },
    { name: 'leadFinderConfig', path: './leadFinderConfig.js' },
    { name: 'auth', path: './auth.js' }
];

modules.forEach(({ name, path }) => {
    try {
        const module = require(path);
        const exportCount = Object.keys(module).length;
        recordTest(`Module '${name}' loads`, true);
        console.log(`   Exports: ${exportCount} functions`);
    } catch (error) {
        recordTest(`Module '${name}' loads`, false, error.message);
    }
});

console.log('\n');

// ========================================================================
// TEST 6: Verify leadFinderConfig specifically
// ========================================================================
console.log('📋 TEST 6: Verifying leadFinderConfig module...\n');

try {
    const leadFinderConfig = require('./leadFinderConfig.js');
    
    if (leadFinderConfig.getLeadFinderConfig) {
        recordTest('getLeadFinderConfig exists in module', true);
    } else {
        recordTest('getLeadFinderConfig exists in module', false, 'Not found');
    }
    
    if (leadFinderConfig.saveLeadFinderAPIKey) {
        recordTest('saveLeadFinderAPIKey exists in module', true);
    } else {
        recordTest('saveLeadFinderAPIKey exists in module', false, 'Not found');
    }
    
    console.log('\n');
} catch (error) {
    recordTest('leadFinderConfig module verification', false, error.message);
}

// ========================================================================
// TEST 7: Check for old/duplicate files
// ========================================================================
console.log('📋 TEST 7: Checking for old/duplicate files...\n');

const fs = require('fs');

const oldFiles = [
    'getLeadFinderConfig_fix.js',
    'temp_function.txt',
    'temp_lead_finder.txt',
    'original_index.js.tmp'
];

let foundOldFiles = false;
oldFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.warn(`   ⚠️  Old file still exists: ${file}`);
        foundOldFiles = true;
    }
});

if (!foundOldFiles) {
    recordTest('No old/duplicate files found', true);
    console.log('   All cleanup complete\n');
} else {
    recordTest('No old/duplicate files found', false, 'Some old files still exist');
}

// ========================================================================
// FINAL SUMMARY
// ========================================================================
console.log('========================================');
console.log('📊 TEST SUMMARY');
console.log('========================================\n');

console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📊 Total: ${results.tests.length}\n`);

console.log('Detailed Results:');
results.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
    if (!test.passed && test.error) {
        console.log(`   └─ ${test.error}`);
    }
});

console.log('\n========================================');

if (results.failed === 0) {
    console.log('🎉 VERDICT: ALL BACKEND TESTS PASSED');
    console.log('========================================\n');
    console.log('✅ All modules load correctly');
    console.log('✅ No duplicate exports');
    console.log('✅ All critical functions exist');
    console.log('✅ No old files remaining');
    console.log('✅ Backend structure is clean\n');
    console.log('Next steps:');
    console.log('1. Deploy: firebase deploy --only functions');
    console.log('2. Test runtime: Use test-firebase-functions.js in browser');
    console.log('3. Check logs: firebase functions:log');
} else {
    console.log('⚠️  VERDICT: SOME BACKEND TESTS FAILED');
    console.log('========================================\n');
    console.log('❌ Backend structure has issues');
    console.log('❌ Review failed tests above');
    console.log('❌ Fix issues before deploying\n');
    console.log('Debugging steps:');
    console.log('1. Check error messages above');
    console.log('2. Verify all required files exist');
    console.log('3. Check for syntax errors');
    console.log('4. Run: npm install in functions/');
}

console.log('\n========================================\n');

process.exit(results.failed === 0 ? 0 : 1);
