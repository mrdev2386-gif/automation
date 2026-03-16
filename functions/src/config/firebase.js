/**
 * Firebase Admin Configuration
 * Initializes Firebase Admin SDK for Firestore access
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// In production, this uses Firebase's default credentials
// In local development, uses FIREBASE_AUTH_EMULATOR or service account
const initializeFirebase = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    }
    return admin;
};

// Get Firestore database instance
const getFirestore = () => {
    initializeFirebase();
    return admin.firestore();
};

// Get Auth instance
const getAuth = () => {
    initializeFirebase();
    return admin.auth();
};

module.exports = {
    admin,
    initializeFirebase,
    getFirestore,
    getAuth,
};
