/**
 * Backend Fix Verification Script
 * Tests that all fixes are properly applied
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log('========================================');
console.log('BACKEND FIX VERIFICATION');
console.log('========================================\n');

async function verifyFixes() {
    let passed = 0;
    let failed = 0;

    // Test 1: Firebase Admin Initialization
    console.log('[1/5] Testing Firebase Admin initialization...');
    try {
        if (admin.apps.length > 0) {
            console.log('✅ Firebase Admin initialized');
            passed++;
        } else {
            console.log('❌ Firebase Admin not initialized');
            failed++;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        failed++;
    }

    // Test 2: Firestore Connection
    console.log('\n[2/5] Testing Firestore connection...');
    try {
        const testDoc = await db.collection('_test').doc('verification').get();
        console.log('✅ Firestore connection working');
        passed++;
    } catch (error) {
        console.log('❌ Firestore connection failed:', error.message);
        failed++;
    }

    // Test 3: Check if functions are exported
    console.log('\n[3/5] Checking function exports...');
    try {
        const indexFile = require('./index.js');
        const requiredFunctions = [
            'test',
            'createUser',
            'getAllUsers',
            'getUserProfile',
            'getAllAutomations',
            'getMyAutomations',
            'ensureLeadFinderAutomation'
        ];

        let allExported = true;
        for (const funcName of requiredFunctions) {
            if (!indexFile[funcName]) {
                console.log(`❌ Function '${funcName}' not exported`);
                allExported = false;
            }
        }

        if (allExported) {
            console.log('✅ All required functions exported');
            passed++;
        } else {
            failed++;
        }
    } catch (error) {
        console.log('❌ Error checking exports:', error.message);
        failed++;
    }

    // Test 4: Verify auth.js has safe data access
    console.log('\n[4/5] Verifying auth.js safe data access...');
    try {
        const authModule = require('./auth.js');
        const authCode = require('fs').readFileSync('./auth.js', 'utf8');
        
        if (authCode.includes('userData?.role') && authCode.includes('userData?.isActive')) {
            console.log('✅ Safe data access patterns found');
            passed++;
        } else {
            console.log('❌ Safe data access patterns missing');
            failed++;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        failed++;
    }

    // Test 5: Verify error handling in users.js
    console.log('\n[5/5] Verifying error handling in users.js...');
    try {
        const usersCode = require('fs').readFileSync('./users.js', 'utf8');
        
        const hasGlobalTryCatch = usersCode.includes('try {') && 
                                  usersCode.includes('} catch (error)');
        const hasErrorLogging = usersCode.includes('console.error');
        const hasHttpsErrorCheck = usersCode.includes('error instanceof functions.https.HttpsError');
        
        if (hasGlobalTryCatch && hasErrorLogging && hasHttpsErrorCheck) {
            console.log('✅ Comprehensive error handling found');
            passed++;
        } else {
            console.log('❌ Error handling incomplete');
            if (!hasGlobalTryCatch) console.log('   - Missing try-catch blocks');
            if (!hasErrorLogging) console.log('   - Missing error logging');
            if (!hasHttpsErrorCheck) console.log('   - Missing HttpsError checks');
            failed++;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        failed++;
    }

    // Summary
    console.log('\n========================================');
    console.log('VERIFICATION SUMMARY');
    console.log('========================================');
    console.log(`✅ Passed: ${passed}/5`);
    console.log(`❌ Failed: ${failed}/5`);
    console.log('========================================\n');

    if (failed === 0) {
        console.log('🎉 All fixes verified! Ready to deploy.');
        console.log('\nNext step: Run deploy-backend-fix.bat');
    } else {
        console.log('⚠️  Some issues found. Review the errors above.');
    }

    process.exit(failed === 0 ? 0 : 1);
}

// Run verification
verifyFixes().catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
});
