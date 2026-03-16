#!/usr/bin/env node

/**
 * Direct Emulator Initialization
 * Uses Firebase Admin SDK to initialize test data directly
 */

const admin = require('firebase-admin');

// Initialize without credentials (emulator mode)
const app = admin.initializeApp({
    projectId: 'waautomation-13fa6',
});

// Get references
const auth = admin.auth();
const db = admin.firestore();

// Connect to emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9100';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';
process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

async function initializeEmulator() {
    try {
        console.log('\n🚀 Firebase Emulator Direct Setup');
        console.log('=====================================\n');

        const testEmail = 'mrdev2386@gmail.com';
        const testPassword = 'test123456';

        console.log('⏳ Step 1: Creating/updating test user in Auth...');
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(testEmail);
            console.log(`   ✓ User exists: ${userRecord.uid}`);
        } catch (e) {
            userRecord = await auth.createUser({
                email: testEmail,
                password: testPassword,
                emailVerified: true
            });
            console.log(`   ✓ User created: ${userRecord.uid}`);
        }

        console.log('\n⏳ Step 2: Creating/updating user document in Firestore...');
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: testEmail,
            role: 'client_user',
            isActive: true,
            clientKey: `client_test_${Date.now()}`,
            assignedAutomations: ['lead_finder', 'ai_lead_agent'],
            createdAt: new Date(),
            updatedAt: new Date()
        }, { merge: true });
        console.log('   ✓ User document saved');

        console.log('\n⏳ Step 3: Creating automations...');
        const automations = [
            {
                id: 'lead_finder',
                name: 'Lead Finder',
                description: 'Find and extract business emails from websites',
                isActive: true
            },
            {
                id: 'ai_lead_agent',
                name: 'AI Lead Agent',
                description: 'AI-powered lead engagement assistant',
                isActive: true
            }
        ];

        for (const automation of automations) {
            await db.collection('automations').doc(automation.id).set(automation, { merge: true });
            console.log(`   ✓ ${automation.name} created`);
        }

        console.log('\n✅ Emulator initialized successfully!\n');
        console.log('📋 Test User Credentials:');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${testPassword}`);
        console.log(`   UID: ${userRecord.uid}\n`);

        console.log('🎉 Ready for testing!');
        console.log('   1. Open http://localhost:5173 in your browser');
        console.log('   2. Use above credentials to login');
        console.log('   3. Test dashboard and automation features\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nMake sure:');
        console.error('   1. Firebase emulators are running');
        console.error('   2. Auth emulator is on port 9100');
        console.error('   3. Firestore emulator is on port 8085\n');
        process.exit(1);
    }
}

initializeEmulator();
