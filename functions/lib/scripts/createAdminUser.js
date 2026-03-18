"use strict";
/**
 * Create Super Admin User
 * Run this script to create the first super admin user
 *
 * Usage: node scripts/createAdminUser.js
 */
const admin = require('firebase-admin');
const readline = require('readline');
// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const auth = admin.auth();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}
async function createAdminUser() {
    try {
        console.log('\n🔐 Create Super Admin User\n');
        // Hardcoded credentials
        const email = 'cryptosourav23@gmail.com';
        const password = 'Agen@2025$$';
        console.log(`Creating admin user: ${email}\n`);
        console.log('\n⏳ Creating admin user...\n');
        // Check if user already exists in Auth
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log(`✅ User already exists in Firebase Auth: ${userRecord.uid}`);
        }
        catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create user in Firebase Auth
                userRecord = await auth.createUser({
                    email: email,
                    password: password,
                    emailVerified: true
                });
                console.log(`✅ Created user in Firebase Auth: ${userRecord.uid}`);
            }
            else {
                throw error;
            }
        }
        // Generate client key
        const clientKey = `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        // Create/update user document in Firestore
        const userDoc = {
            uid: userRecord.uid,
            email: email,
            role: 'super_admin',
            isActive: true,
            clientKey: clientKey,
            assignedAutomations: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
        console.log(`✅ Created/updated user document in Firestore`);
        // Log activity
        await db.collection('activity_logs').add({
            userId: userRecord.uid,
            action: 'SUPER_ADMIN_CREATED',
            metadata: {
                email: email,
                createdBy: 'setup_script'
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('\n✅ SUCCESS! Super admin user created:\n');
        console.log(`   Email: ${email}`);
        console.log(`   UID: ${userRecord.uid}`);
        console.log(`   Role: super_admin`);
        console.log(`   Client Key: ${clientKey}`);
        console.log(`\n🎉 You can now login to the admin panel at: http://localhost:3000/login\n`);
    }
    catch (error) {
        console.error('\n❌ Error creating admin user:', error.message);
        process.exit(1);
    }
    finally {
        process.exit(0);
    }
}
createAdminUser();
//# sourceMappingURL=createAdminUser.js.map