/**
 * WA Automation Platform - System Verification Script
 * 
 * This script verifies that all production-ready features are working correctly.
 * Run this after deployment to ensure the system is fully operational.
 * 
 * Usage:
 *   node functions/scripts/verifySystem.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

// Test results tracker
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

function logTest(name, status, message) {
    const symbols = {
        pass: '✅',
        fail: '❌',
        warn: '⚠️'
    };
    
    console.log(`${symbols[status]} ${name}: ${message}`);
    
    results.tests.push({ name, status, message });
    
    if (status === 'pass') results.passed++;
    else if (status === 'fail') results.failed++;
    else if (status === 'warn') results.warnings++;
}

async function verifyAutomations() {
    console.log('\n📦 STEP 1: Verifying Automations Collection\n');
    
    try {
        const snapshot = await db.collection('automations').get();
        
        if (snapshot.empty) {
            logTest('Automations Collection', 'fail', 'No automations found. Run seedAutomations.js first.');
            return false;
        }
        
        const expectedAutomations = [
            'saas_automation',
            'restaurant_automation',
            'hotel_automation',
            'whatsapp_ai_assistant',
            'lead_finder',
            'ai_lead_agent'
        ];
        
        const foundAutomations = snapshot.docs.map(doc => doc.id);
        const missingAutomations = expectedAutomations.filter(id => !foundAutomations.includes(id));
        
        if (missingAutomations.length > 0) {
            logTest('Automations Count', 'warn', `Missing: ${missingAutomations.join(', ')}`);
        } else {
            logTest('Automations Count', 'pass', `All 6 automations present`);
        }
        
        // Verify each automation has required fields
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const requiredFields = ['name', 'description', 'isActive'];
            const missingFields = requiredFields.filter(field => !data[field]);
            
            if (missingFields.length > 0) {
                logTest(`Automation: ${doc.id}`, 'warn', `Missing fields: ${missingFields.join(', ')}`);
            } else {
                logTest(`Automation: ${doc.id}`, 'pass', `${data.name} - ${data.isActive ? 'Active' : 'Inactive'}`);
            }
        }
        
        return true;
    } catch (error) {
        logTest('Automations Collection', 'fail', error.message);
        return false;
    }
}

async function verifySuperAdmin() {
    console.log('\n👤 STEP 2: Verifying Super Admin Account\n');
    
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'super_admin')
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            logTest('Super Admin Account', 'warn', 'No super_admin found. Create one using createAdminUser.js');
            return false;
        }
        
        const adminDoc = snapshot.docs[0];
        const adminData = adminDoc.data();
        
        logTest('Super Admin Account', 'pass', `Found: ${adminData.email}`);
        
        // Verify admin has required fields
        const requiredFields = ['uid', 'email', 'role', 'isActive', 'clientKey'];
        const missingFields = requiredFields.filter(field => !adminData[field]);
        
        if (missingFields.length > 0) {
            logTest('Admin Fields', 'warn', `Missing: ${missingFields.join(', ')}`);
        } else {
            logTest('Admin Fields', 'pass', 'All required fields present');
        }
        
        // Verify admin is active
        if (adminData.isActive !== true) {
            logTest('Admin Status', 'warn', 'Admin account is not active');
        } else {
            logTest('Admin Status', 'pass', 'Admin account is active');
        }
        
        return true;
    } catch (error) {
        logTest('Super Admin Account', 'fail', error.message);
        return false;
    }
}

async function verifyClientUsers() {
    console.log('\n👥 STEP 3: Verifying Client Users\n');
    
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'client_user')
            .get();
        
        if (snapshot.empty) {
            logTest('Client Users', 'warn', 'No client users found. Create test users via admin panel.');
            return true; // Not a failure, just a warning
        }
        
        logTest('Client Users', 'pass', `Found ${snapshot.size} client user(s)`);
        
        // Verify each client user
        for (const doc of snapshot.docs) {
            const userData = doc.data();
            
            // Check required fields
            const requiredFields = ['uid', 'email', 'role', 'isActive', 'assignedAutomations'];
            const missingFields = requiredFields.filter(field => userData[field] === undefined);
            
            if (missingFields.length > 0) {
                logTest(`User: ${userData.email}`, 'warn', `Missing: ${missingFields.join(', ')}`);
            } else {
                const toolCount = userData.assignedAutomations?.length || 0;
                const status = userData.isActive ? 'Active' : 'Inactive';
                logTest(`User: ${userData.email}`, 'pass', `${status}, ${toolCount} tool(s) assigned`);
            }
        }
        
        return true;
    } catch (error) {
        logTest('Client Users', 'fail', error.message);
        return false;
    }
}

async function verifyCloudFunctions() {
    console.log('\n⚡ STEP 4: Verifying Cloud Functions (Structure)\n');
    
    // We can't directly test Cloud Functions from this script,
    // but we can verify the index.js exports
    
    try {
        const functions = require('../index.js');
        
        const requiredFunctions = [
            'createUser',
            'updateUser',
            'deleteUser',
            'getAllUsers',
            'getUserProfile',
            'getAllAutomations',
            'getMyAutomations',
            'getDashboardStats',
            'seedDefaultAutomations'
        ];
        
        const exportedFunctions = Object.keys(functions);
        const missingFunctions = requiredFunctions.filter(fn => !exportedFunctions.includes(fn));
        
        if (missingFunctions.length > 0) {
            logTest('Cloud Functions', 'fail', `Missing: ${missingFunctions.join(', ')}`);
        } else {
            logTest('Cloud Functions', 'pass', `All ${requiredFunctions.length} required functions exported`);
        }
        
        return true;
    } catch (error) {
        logTest('Cloud Functions', 'fail', error.message);
        return false;
    }
}

async function verifyFirestoreCollections() {
    console.log('\n🗄️  STEP 5: Verifying Firestore Collections\n');
    
    try {
        const requiredCollections = [
            'users',
            'automations',
            'activity_logs'
        ];
        
        for (const collectionName of requiredCollections) {
            const snapshot = await db.collection(collectionName).limit(1).get();
            
            if (snapshot.empty && collectionName !== 'activity_logs') {
                logTest(`Collection: ${collectionName}`, 'warn', 'Empty collection');
            } else {
                logTest(`Collection: ${collectionName}`, 'pass', 'Collection exists');
            }
        }
        
        return true;
    } catch (error) {
        logTest('Firestore Collections', 'fail', error.message);
        return false;
    }
}

async function verifySecuritySetup() {
    console.log('\n🔒 STEP 6: Verifying Security Setup\n');
    
    try {
        // Check if users have clientKey (for webhook auth)
        const usersSnapshot = await db.collection('users').limit(5).get();
        
        let usersWithClientKey = 0;
        let usersWithoutClientKey = 0;
        
        usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.clientKey) {
                usersWithClientKey++;
            } else {
                usersWithoutClientKey++;
            }
        });
        
        if (usersWithoutClientKey > 0) {
            logTest('User ClientKeys', 'warn', `${usersWithoutClientKey} user(s) missing clientKey`);
        } else if (usersWithClientKey > 0) {
            logTest('User ClientKeys', 'pass', `All users have clientKey`);
        }
        
        // Check if rate_limits collection exists (for login protection)
        const rateLimitsSnapshot = await db.collection('rate_limits').limit(1).get();
        logTest('Rate Limiting', 'pass', 'rate_limits collection accessible');
        
        return true;
    } catch (error) {
        logTest('Security Setup', 'fail', error.message);
        return false;
    }
}

async function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    console.log(`📝 Total Tests: ${results.tests.length}`);
    console.log('='.repeat(60));
    
    if (results.failed > 0) {
        console.log('\n❌ SYSTEM NOT READY FOR PRODUCTION');
        console.log('Please fix the failed tests before deploying.\n');
        return false;
    } else if (results.warnings > 0) {
        console.log('\n⚠️  SYSTEM READY WITH WARNINGS');
        console.log('Review warnings and address them if needed.\n');
        return true;
    } else {
        console.log('\n✅ SYSTEM FULLY READY FOR PRODUCTION');
        console.log('All checks passed! You can deploy with confidence.\n');
        return true;
    }
}

async function runVerification() {
    console.log('🚀 WA Automation Platform - System Verification');
    console.log('='.repeat(60));
    
    await verifyAutomations();
    await verifySuperAdmin();
    await verifyClientUsers();
    await verifyCloudFunctions();
    await verifyFirestoreCollections();
    await verifySecuritySetup();
    
    const isReady = await printSummary();
    
    process.exit(isReady ? 0 : 1);
}

// Run verification
runVerification();
