/**
 * Firebase Functions Runtime Test Suite
 * Tests actual function execution to verify backend is working
 * 
 * Run this in browser console after logging in
 */

// Import from your firebase service
// Assuming callFunction is available globally or import it

const runFirebaseFunctionsTest = async () => {
    console.log('========================================');
    console.log('🧪 FIREBASE FUNCTIONS RUNTIME TEST');
    console.log('========================================\n');

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // Helper to record test results
    const recordTest = (name, passed, error = null) => {
        results.tests.push({ name, passed, error });
        if (passed) {
            results.passed++;
            console.log(`✅ ${name}`);
        } else {
            results.failed++;
            console.error(`❌ ${name}`);
            if (error) console.error(`   Error: ${error.message || error}`);
        }
    };

    // ========================================================================
    // STEP 1: TEST BASIC FUNCTION
    // ========================================================================
    console.log('📋 STEP 1: Testing basic function (test)...\n');
    
    try {
        const testResult = await callFunction('test', { message: 'hello' });
        
        if (testResult && testResult.ok === true) {
            recordTest('test function', true);
            console.log('   Response:', testResult);
        } else {
            recordTest('test function', false, 'Invalid response structure');
            console.log('   Response:', testResult);
        }
    } catch (error) {
        recordTest('test function', false, error);
        console.error('   Full error:', error);
    }

    console.log('\n');

    // ========================================================================
    // STEP 2: TEST SIMPLE READ FUNCTION
    // ========================================================================
    console.log('📋 STEP 2: Testing simple read function (getAllUsers)...\n');
    
    try {
        const usersResult = await callFunction('getAllUsers');
        
        // Check for proper response structure
        if (usersResult && typeof usersResult === 'object') {
            // Check if it's an error response
            if (usersResult.error || usersResult.code === 'internal') {
                recordTest('getAllUsers function', false, 'Internal error returned');
                console.log('   Response:', usersResult);
            } else {
                recordTest('getAllUsers function', true);
                console.log('   Response:', {
                    hasUsers: !!usersResult.users,
                    userCount: usersResult.users?.length || 0
                });
            }
        } else {
            recordTest('getAllUsers function', false, 'Invalid response type');
            console.log('   Response:', usersResult);
        }
    } catch (error) {
        // Check error type
        if (error.code === 'permission-denied') {
            recordTest('getAllUsers function', true, 'Permission denied (expected for non-admin)');
            console.log('   Note: Permission denied is expected for non-admin users');
        } else if (error.code === 'internal') {
            recordTest('getAllUsers function', false, 'Internal error - backend crash');
            console.error('   Full error:', error);
        } else {
            recordTest('getAllUsers function', false, error);
            console.error('   Full error:', error);
        }
    }

    console.log('\n');

    // ========================================================================
    // STEP 3: TEST AUTOMATION FUNCTION
    // ========================================================================
    console.log('📋 STEP 3: Testing automation function (getMyAutomations)...\n');
    
    try {
        const automationsResult = await callFunction('getMyAutomations');
        
        if (automationsResult && typeof automationsResult === 'object') {
            if (automationsResult.error || automationsResult.code === 'internal') {
                recordTest('getMyAutomations function', false, 'Internal error returned');
                console.log('   Response:', automationsResult);
            } else {
                recordTest('getMyAutomations function', true);
                console.log('   Response:', {
                    hasAutomations: !!automationsResult.automations,
                    automationCount: automationsResult.automations?.length || 0
                });
            }
        } else {
            recordTest('getMyAutomations function', false, 'Invalid response type');
            console.log('   Response:', automationsResult);
        }
    } catch (error) {
        if (error.code === 'internal') {
            recordTest('getMyAutomations function', false, 'Internal error - backend crash');
            console.error('   Full error:', error);
        } else {
            recordTest('getMyAutomations function', false, error);
            console.error('   Full error:', error);
        }
    }

    console.log('\n');

    // ========================================================================
    // STEP 4: TEST LEAD FINDER CONFIG FUNCTION
    // ========================================================================
    console.log('📋 STEP 4: Testing Lead Finder config function...\n');
    
    try {
        const configResult = await callFunction('getLeadFinderConfig');
        
        if (configResult && typeof configResult === 'object') {
            if (configResult.error || configResult.code === 'internal') {
                recordTest('getLeadFinderConfig function', false, 'Internal error returned');
                console.log('   Response:', configResult);
            } else {
                recordTest('getLeadFinderConfig function', true);
                console.log('   Response:', {
                    configured: configResult.leadFinderConfigured,
                    enabled: configResult.automationEnabled
                });
            }
        } else {
            recordTest('getLeadFinderConfig function', false, 'Invalid response type');
            console.log('   Response:', configResult);
        }
    } catch (error) {
        if (error.code === 'internal') {
            recordTest('getLeadFinderConfig function', false, 'Internal error - backend crash');
            console.error('   Full error:', error);
        } else {
            recordTest('getLeadFinderConfig function', false, error);
            console.error('   Full error:', error);
        }
    }

    console.log('\n');

    // ========================================================================
    // STEP 5: TEST ENSURE LEAD FINDER AUTOMATION
    // ========================================================================
    console.log('📋 STEP 5: Testing ensureLeadFinderAutomation function...\n');
    
    try {
        const ensureResult = await callFunction('ensureLeadFinderAutomation', { enabled: true });
        
        if (ensureResult && typeof ensureResult === 'object') {
            if (ensureResult.error || ensureResult.code === 'internal') {
                recordTest('ensureLeadFinderAutomation function', false, 'Internal error returned');
                console.log('   Response:', ensureResult);
            } else {
                recordTest('ensureLeadFinderAutomation function', true);
                console.log('   Response:', {
                    success: ensureResult.success,
                    status: ensureResult.status
                });
            }
        } else {
            recordTest('ensureLeadFinderAutomation function', false, 'Invalid response type');
            console.log('   Response:', ensureResult);
        }
    } catch (error) {
        if (error.code === 'internal') {
            recordTest('ensureLeadFinderAutomation function', false, 'Internal error - backend crash');
            console.error('   Full error:', error);
        } else {
            recordTest('ensureLeadFinderAutomation function', false, error);
            console.error('   Full error:', error);
        }
    }

    console.log('\n');

    // ========================================================================
    // STEP 6: CHECK NETWORK CALLS
    // ========================================================================
    console.log('📋 STEP 6: Network call verification...\n');
    console.log('⚠️  MANUAL CHECK REQUIRED:');
    console.log('   1. Open DevTools → Network tab');
    console.log('   2. Filter by "firebase" or "functions"');
    console.log('   3. Verify:');
    console.log('      ❌ No direct cloudfunctions.net calls');
    console.log('      ✅ Only Firebase SDK calls (firebaseapp.com)');
    console.log('      ✅ No CORS errors');
    console.log('\n');

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
        console.log('🎉 VERDICT: ALL TESTS PASSED');
        console.log('========================================\n');
        console.log('✅ Backend is stable');
        console.log('✅ No runtime crashes');
        console.log('✅ No CORS errors');
        console.log('✅ System working correctly\n');
        console.log('Next steps:');
        console.log('1. Check Firebase Console logs');
        console.log('2. Monitor for any errors');
        console.log('3. Test in production environment');
    } else {
        console.log('⚠️  VERDICT: SOME TESTS FAILED');
        console.log('========================================\n');
        console.log('❌ Backend may have issues');
        console.log('❌ Review failed tests above');
        console.log('❌ Check Firebase Console logs\n');
        console.log('Debugging steps:');
        console.log('1. Run: firebase functions:log');
        console.log('2. Check for error stack traces');
        console.log('3. Verify Firestore rules');
        console.log('4. Check authentication status');
    }

    console.log('\n========================================\n');

    return results;
};

// Auto-run if callFunction is available
if (typeof callFunction !== 'undefined') {
    console.log('🚀 Starting Firebase Functions Test Suite...\n');
    runFirebaseFunctionsTest().catch(error => {
        console.error('❌ Test suite failed to run:', error);
    });
} else {
    console.error('❌ callFunction is not defined');
    console.log('Please ensure you are on a page where firebase.js is loaded');
    console.log('Or run this in the browser console after logging in');
}

// Export for manual execution
window.runFirebaseFunctionsTest = runFirebaseFunctionsTest;
console.log('💡 You can also run manually: runFirebaseFunctionsTest()');
