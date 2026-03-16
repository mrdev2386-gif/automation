'use client';

/**
 * Firebase Admin Service
 * Handles all admin-related Firebase operations
 * Uses Firebase SDK's httpsCallable for proper CORS handling
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAOB97HJHHsAbO5OQQ-kJtw3jyXU22A0bs",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "waautomation-13fa6.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "waautomation-13fa6",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "waautomation-13fa6.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "160576032895",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:160576032895:web:d584b96ed32b5998612f4a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');

// Setup emulator connection if needed
const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';
const isEmulator = () => {
    return typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1'
    );
};

if (typeof window !== 'undefined' && isEmulator() && USE_EMULATOR) {
    try {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log('✅ Connected to Firebase Functions Emulator');
    } catch (error) {
        console.warn('⚠️ Emulator connection skipped:', error);
    }
}

// ============================================================================
// HELPER: Call Firebase callable functions using httpsCallable
// Handles CORS automatically - no direct HTTP calls to cloudfunctions.net
// ============================================================================

const callFunction = async (functionName: string, data: Record<string, unknown> = {}) => {
    try {
        console.log(`📞 Calling function: ${functionName}`, data);
        const fn = httpsCallable(functions, functionName);
        const result = await fn(data);
        console.log(`✅ Function ${functionName} returned:`, result.data);
        return result.data;
    } catch (error: any) {
        console.error(`❌ Function ${functionName} failed:`, error);
        // Provide meaningful error messages
        if (error.code === 'functions/unauthenticated') {
            throw new Error('You must be logged in to perform this action');
        } else if (error.code === 'functions/permission-denied') {
            throw new Error('You do not have permission to perform this action');
        } else if (error.code === 'functions/not-found') {
            throw new Error(`Function ${functionName} not found`);
        } else if (error.code === 'functions/internal') {
            throw new Error(error.message || `Internal error in ${functionName}`);
        }
        throw new Error(error.message || `Failed to call ${functionName}`);
    }
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const adminSignIn = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Admin signed in:', userCredential.user.email);
        return {
            user: { uid: userCredential.user.uid, email: userCredential.user.email },
            email: userCredential.user.email,
        };
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

export const adminSignOut = async () => {
    try {
        await firebaseSignOut(auth);
        console.log('✅ Admin signed out');
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

export const onAdminAuthStateChanged = (callback: (user: any) => void) => {
    return onAuthStateChanged(auth, (user) => {
        if (user) {
            callback({ authenticated: true, uid: user.uid, email: user.email });
        } else {
            callback(null);
        }
    });
};

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export const createUser = async (userData: {
    email: string;
    password: string;
    role: string;
    assignedAutomations?: string[];
}) => {
    const result = await callFunction('createUser', userData);
    return result;
};

export const updateUser = async (userId: string, updateData: {
    role?: string;
    isActive?: boolean;
    assignedAutomations?: string[];
}) => {
    const result = await callFunction('updateUser', { userId, ...updateData });
    return result;
};

export const deleteUser = async (userId: string) => {
    const result = await callFunction('deleteUser', { userId });
    return result;
};

export const resetUserPassword = async (userId: string, email: string) => {
    const result = await callFunction('resetUserPassword', { userId, email });
    return result;
};

export const getAllUsers = async () => {
    const result = await callFunction('getAllUsers', {});
    return (result as any).users;
};

export const getUserProfile = async () => {
    const result = await callFunction('getUserProfile', {});
    return (result as any).user;
};

// ============================================================================
// AUTOMATION MANAGEMENT
// ============================================================================

export const createAutomation = async (automationData: {
    name: string;
    description?: string;
    isActive?: boolean;
}) => {
    const result = await callFunction('createAutomation', automationData);
    return result;
};

export const updateAutomation = async (automationId: string, updateData: {
    name?: string;
    description?: string;
    isActive?: boolean;
}) => {
    const result = await callFunction('updateAutomation', { automationId, ...updateData });
    return result;
};

export const deleteAutomation = async (automationId: string) => {
    const result = await callFunction('deleteAutomation', { automationId });
    return result;
};

export const getAllAutomations = async () => {
    const result = await callFunction('getAllAutomations', {});
    return (result as any).automations;
};

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export const getDashboardStats = async () => {
    const result = await callFunction('getDashboardStats', {});
    return result;
};

// ============================================================================
// RATE LIMITING
// ============================================================================

export const verifyLoginAttempt = async (email: string) => {
    const result = await callFunction('verifyLoginAttempt', { email });
    return result as { allowed: boolean };
};

// ============================================================================
// AUTOMATION SEEDING
// ============================================================================

export const seedDefaultAutomations = async () => {
    const result = await callFunction('seedDefaultAutomations', {});
    return result;
};

