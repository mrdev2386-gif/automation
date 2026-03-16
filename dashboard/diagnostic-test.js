/**
 * Firebase Permission Diagnostic Test
 * Run this in browser console on the AI Lead Agent page
 */

(async function diagnosticTest() {
    console.log('🔍 ===== FIREBASE PERMISSION DIAGNOSTIC =====');
    
    // Step 1: Check Firebase Config
    console.log('\n📋 Step 1: Firebase Configuration');
    const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAOB97HJHHsAbO5OQQ-kJtw3jyXU22A0bs",
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "waautomation-13fa6.firebaseapp.com",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "waautomation-13fa6",
    };
    console.log('  Project ID:', firebaseConfig.projectId);
    console.log('  Auth Domain:', firebaseConfig.authDomain);
    
    // Step 2: Check Auth State
    console.log('\n🔑 Step 2: Authentication State');
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    console.log('  Current User:', auth.currentUser);
    console.log('  User UID:', auth.currentUser?.uid);
    console.log('  User Email:', auth.currentUser?.email);
    
    if (!auth.currentUser) {
        console.error('  ❌ ERROR: User not authenticated!');
        return;
    }
    
    // Step 3: Check Firestore Instance
    console.log('\n💾 Step 3: Firestore Instance');
    const { getFirestore, collection, getDocs, addDoc, query, where } = await import('firebase/firestore');
    const db = getFirestore();
    console.log('  Firestore DB:', db);
    console.log('  App Name:', db.app.name);
    console.log('  Project ID:', db.app.options.projectId);
    
    // Step 4: Test Direct Write (debug_test collection)
    console.log('\n✍️ Step 4: Test Direct Write');
    try {
        const testRef = await addDoc(collection(db, 'debug_test'), {
            test: true,
            timestamp: new Date(),
            userId: auth.currentUser.uid
        });
        console.log('  ✅ SUCCESS: Write to debug_test collection');
        console.log('  Document ID:', testRef.id);
    } catch (error) {
        console.error('  ❌ FAILED: Write to debug_test collection');
        console.error('  Error Code:', error.code);
        console.error('  Error Message:', error.message);
    }
    
    // Step 5: Test ai_lead_campaigns Read
    console.log('\n📖 Step 5: Test ai_lead_campaigns Read');
    try {
        const q = query(
            collection(db, 'ai_lead_campaigns'),
            where('userId', '==', auth.currentUser.uid)
        );
        console.log('  Query created for userId:', auth.currentUser.uid);
        const snapshot = await getDocs(q);
        console.log('  ✅ SUCCESS: Read from ai_lead_campaigns');
        console.log('  Documents found:', snapshot.docs.length);
        snapshot.docs.forEach(doc => {
            console.log('    -', doc.id, doc.data());
        });
    } catch (error) {
        console.error('  ❌ FAILED: Read from ai_lead_campaigns');
        console.error('  Error Code:', error.code);
        console.error('  Error Message:', error.message);
        console.error('  Full Error:', error);
    }
    
    // Step 6: Test ai_lead_campaigns Write
    console.log('\n✍️ Step 6: Test ai_lead_campaigns Write');
    try {
        const { serverTimestamp } = await import('firebase/firestore');
        const testCampaign = await addDoc(collection(db, 'ai_lead_campaigns'), {
            userId: auth.currentUser.uid,
            name: 'Diagnostic Test Campaign',
            country: 'Test',
            niche: 'Test',
            status: 'active',
            createdAt: serverTimestamp()
        });
        console.log('  ✅ SUCCESS: Write to ai_lead_campaigns');
        console.log('  Campaign ID:', testCampaign.id);
    } catch (error) {
        console.error('  ❌ FAILED: Write to ai_lead_campaigns');
        console.error('  Error Code:', error.code);
        console.error('  Error Message:', error.message);
        console.error('  Full Error:', error);
    }
    
    // Step 7: Check User Document
    console.log('\n👤 Step 7: Check User Document');
    try {
        const { doc, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
            console.log('  ✅ User document exists');
            console.log('  User data:', userDoc.data());
            console.log('  isActive:', userDoc.data().isActive);
            console.log('  role:', userDoc.data().role);
        } else {
            console.error('  ❌ User document does NOT exist');
        }
    } catch (error) {
        console.error('  ❌ FAILED: Read user document');
        console.error('  Error Code:', error.code);
        console.error('  Error Message:', error.message);
    }
    
    console.log('\n🏁 ===== DIAGNOSTIC COMPLETE =====');
})();
