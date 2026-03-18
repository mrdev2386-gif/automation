/**
 * Test Function Loading
 * Verifies all functions can be loaded without errors
 */

console.log('🔍 Testing function loading...\n');

try {
    // Test 1: Load main index
    console.log('1️⃣ Loading index.js...');
    const functions = require('./index.js');
    console.log('✅ index.js loaded successfully\n');

    // Test 2: Check critical functions exist
    console.log('2️⃣ Checking critical functions...');
    const criticalFunctions = [
        'captureLeadCallable',
        'getAllUsers',
        'uploadLeadsBulk',
        'getMyLeads',
        'createUser',
        'getLeadFinderConfig',
        'saveLeadFinderAPIKey'
    ];

    let allExist = true;
    for (const funcName of criticalFunctions) {
        if (functions[funcName]) {
            console.log(`   ✅ ${funcName} exists`);
        } else {
            console.log(`   ❌ ${funcName} MISSING`);
            allExist = false;
        }
    }

    if (!allExist) {
        console.log('\n❌ Some functions are missing!');
        process.exit(1);
    }

    console.log('\n✅ All critical functions exist\n');

    // Test 3: Load leadService directly
    console.log('3️⃣ Loading leadService.js...');
    const leadService = require('./src/services/leadService.js');
    console.log('✅ leadService.js loaded successfully\n');

    // Test 4: Check leadService exports
    console.log('4️⃣ Checking leadService exports...');
    const requiredExports = [
        'createLead',
        'checkDuplicate',
        'triggerLeadAutomation',
        'processBulkLeads',
        'getUserLeads',
        'isValidPhone',
        'isValidEmail'
    ];

    let allExportsExist = true;
    for (const exportName of requiredExports) {
        if (leadService[exportName]) {
            console.log(`   ✅ ${exportName} exported`);
        } else {
            console.log(`   ❌ ${exportName} NOT exported`);
            allExportsExist = false;
        }
    }

    if (!allExportsExist) {
        console.log('\n❌ Some exports are missing from leadService!');
        process.exit(1);
    }

    console.log('\n✅ All required exports exist\n');

    // Test 5: Count total functions
    console.log('5️⃣ Counting exported functions...');
    const functionCount = Object.keys(functions).length;
    console.log(`   📊 Total functions exported: ${functionCount}`);

    if (functionCount < 40) {
        console.log('   ⚠️  Warning: Expected 40+ functions');
    } else {
        console.log('   ✅ Function count looks good');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(50));
    console.log('\n✅ Functions are ready to deploy!\n');
    console.log('Next step: firebase deploy --only functions\n');

    process.exit(0);

} catch (error) {
    console.error('\n❌ ERROR LOADING FUNCTIONS:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    console.log('\n🔧 Fix the error above before deploying!\n');
    process.exit(1);
}
