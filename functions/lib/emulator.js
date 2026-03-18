"use strict";
/**
 * Emulator Helper Module
 * Provides utility functions for development and testing in the Firebase Emulator
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const auth = admin.auth();
const db = admin.firestore();
/**
 * seedTestUser - Create test user in Auth Emulator (development only)
 */
const seedTestUser = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    try {
        const testEmail = 'mrdev2386@gmail.com';
        const testPassword = 'test123456';
        // Try to get existing user first
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(testEmail);
            console.log('Test user already exists:', userRecord.uid);
        }
        catch (err) {
            if (err.code === 'auth/user-not-found') {
                // Create new user
                userRecord = await auth.createUser({
                    email: testEmail,
                    password: testPassword,
                    emailVerified: true
                });
                console.log('Created test user:', userRecord.uid);
            }
            else {
                throw err;
            }
        }
        // Create or update user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: testEmail,
            role: 'client_user',
            isActive: true,
            clientKey: `client_test_${Date.now()}`,
            assignedAutomations: ['lead_finder', 'ai_lead_agent'],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        res.json({
            success: true,
            uid: userRecord.uid,
            email: testEmail,
            password: testPassword,
            message: 'Test user is ready'
        });
    }
    catch (error) {
        console.error('Error in seedTestUser:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code
        });
    }
});
/**
 * initializeEmulator - Initialize emulator with test data
 */
const initializeEmulator = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    try {
        console.log('🚀 Initializing emulator...');
        const testEmail = 'mrdev2386@gmail.com';
        const testPassword = 'test123456';
        // Step 1: Create or get test user
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(testEmail);
        }
        catch (err) {
            userRecord = await auth.createUser({
                email: testEmail,
                password: testPassword,
                emailVerified: true
            });
        }
        // Step 2: Create user document
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: testEmail,
            role: 'client_user',
            isActive: true,
            clientKey: `client_test_${Date.now()}`,
            assignedAutomations: ['lead_finder', 'ai_lead_agent'],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        // Step 3: Ensure Lead Finder automation exists
        const lfAutomation = await db.collection('automations').doc('lead_finder').get();
        if (!lfAutomation.exists) {
            await db.collection('automations').doc('lead_finder').set({
                id: 'lead_finder',
                name: 'Lead Finder',
                description: 'Find and extract business emails',
                isActive: true
            });
        }
        // Step 4: Ensure AI Lead Agent automation exists  
        const alaAutomation = await db.collection('automations').doc('ai_lead_agent').get();
        if (!alaAutomation.exists) {
            await db.collection('automations').doc('ai_lead_agent').set({
                id: 'ai_lead_agent',
                name: 'AI Lead Agent',
                description: 'AI-powered lead engagement',
                isActive: true
            });
        }
        res.json({
            success: true,
            message: 'Emulator initialized successfully',
            testUser: {
                email: testEmail,
                password: testPassword,
                uid: userRecord.uid
            },
            status: {
                authSetup: true,
                testUserCreated: true,
                automationsCreated: true
            }
        });
    }
    catch (error) {
        console.error('Error initializing emulator:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code
        });
    }
});
module.exports = {
    seedTestUser,
    initializeEmulator
};
//# sourceMappingURL=emulator.js.map