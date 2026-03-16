/**
 * Firebase Client Configuration
 * Shared Firebase initialization for client-side apps
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAOB97HJHHsAbO5OQQ-kJtw3jyXU22A0bs",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "waautomation-13fa6.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "waautomation-13fa6",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "waautomation-13fa6.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "160576032895",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:160576032895:web:d584b96ed32b5998612f4a",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-S3D64C11FP"
};

// Initialize Firebase app (singleton)
let app: FirebaseApp;

// Vite/Hydration-safe initialization
if (typeof window !== 'undefined' && !initializeApp.apps.length) {
    app = initializeApp(firebaseConfig);
} else if (typeof window === 'undefined') {
    // Server-side: don't initialize
    app = {} as FirebaseApp;
} else {
    app = initializeApp(firebaseConfig);
}

// Initialize services
const auth: Auth = typeof window !== 'undefined' ? getAuth(app) : ({} as Auth);
const db: Firestore = typeof window !== 'undefined' ? getFirestore(app) : ({} as Firestore);
const functions: Functions = typeof window !== 'undefined' ? getFunctions(app) : ({} as Functions);

export { app, auth, db, functions };
export default app;
