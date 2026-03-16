/**
 * Firebase Permission Diagnostic Test
 * Run this to identify the exact cause of permission-denied errors
 */

import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const runDiagnostics = async () => {
    console.log('========================================');
    console.log('FIREBASE PERMISSION DIAGNOSTIC TEST');
    console.log('========================================\n');

    const auth = getAuth();
    const db = getFirestore();
    const app = getApp();

    // Test 1: Firebase Configuration
    console.log('[Test 1] Firebase Configuration');
    console.log('  Project ID:', app.options.projectId);
    console.log('  Auth Domain:', app.options.authDomain);
    console.log('  API Key:', app.options.apiKey?.substring(0, 10) + '...');
    console.log('  ✓ Configuration loaded\n');

    // Test 2: Authentication State
    console.log('[Test 2] Authentication State');
    console.log('  Current User:', auth.currentUser);
    console.log('  User UID:', auth.currentUser?.uid);
    console.log('  User Email:', auth.currentUser?.email);
    
    if (!auth.currentUser) {
        console.log('  ✗ ERROR: User not authenticated!');
        console.log('  → This is the root cause. User must be logged in.\n');
        return;
    }
    console.log('  ✓ User authenticated\n');

    // Test 3: User Document Check
    console.log('[Test 3] User Document in Firestore');
    try {
        const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('  ✓ User document exists');
            console.log('  isActive:', userData.isActive);
            console.log('  role:', userData.role);
        } else {
            console.log('  ✗ User document does NOT exist');
            console.log('  → Firestore rules require user document with isActive=true');
        }
    } catch (error) {
        console.log('  ✗ Error reading user document:', error.message);
    }
    console.log('');

    // Test 4: Direct Firestore Write Test
    console.log('[Test 4] Direct Firestore Write Test');
    try {
        const testRef = await addDoc(collection(db, 'debug_test'), {
            message: 'Firestore connection test',
            userId: auth.currentUser.uid,
            createdAt: serverTimestamp()
        });
        console.log('  ✓ Write successful! Doc ID:', testRef.id);
    } catch (error) {
        console.log('  ✗ Write FAILED');
        console.log('  Error Code:', error.code);
        console.log('  Error Message:', error.message);
        console.log('  → This indicates Firestore rules are blocking writes');
    }
    console.log('');

    // Test 5: Direct Firestore Read Test
    console.log('[Test 5] Direct Firestore Read Test');
    try {
        const snapshot = await getDocs(collection(db, 'debug_test'));
        console.log('  ✓ Read successful! Found', snapshot.size, 'documents');
    } catch (error) {
        console.log('  ✗ Read FAILED');
        console.log('  Error Code:', error.code);
        console.log('  Error Message:', error.message);
    }
    console.log('');

    // Test 6: AI Lead Campaigns Collection Test
    console.log('[Test 6] AI Lead Campaigns Collection Access');
    try {
        const q = query(
            collection(db, 'ai_lead_campaigns'),
            where('userId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        console.log('  ✓ Query successful! Found', snapshot.size, 'campaigns');
    } catch (error) {
        console.log('  ✗ Query FAILED');
        console.log('  Error Code:', error.code);
        console.log('  Error Message:', error.message);
        console.log('  → ROOT CAUSE IDENTIFIED');
    }
    console.log('');

    // Test 7: Create Campaign Test
    console.log('[Test 7] Create Campaign Test');
    try {
        const campaignRef = await addDoc(collection(db, 'ai_lead_campaigns'), {
            userId: auth.currentUser.uid,
            name: 'Test Campaign',
            status: 'active',
            createdAt: serverTimestamp()
        });
        console.log('  ✓ Campaign created! ID:', campaignRef.id);
    } catch (error) {
        console.log('  ✗ Campaign creation FAILED');
        console.log('  Error Code:', error.code);
        console.log('  Error Message:', error.message);
        console.log('  → ROOT CAUSE IDENTIFIED');
    }
    console.log('');

    // Final Diagnosis
    console.log('========================================');
    console.log('DIAGNOSIS COMPLETE');
    console.log('========================================');
};

export default runDiagnostics;
