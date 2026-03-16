/**
 * Create User Document in Firestore
 * 
 * INSTRUCTIONS:
 * 1. Open your app in browser
 * 2. Login to your account
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire script
 * 5. Press Enter
 * 
 * This will create your user document in Firestore with proper fields
 */

(async function createUserDocument() {
    console.log('🚀 Creating user document in Firestore...\n');
    
    try {
        // Import Firebase modules
        const { getAuth } = await import('firebase/auth');
        const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
        
        // Get instances
        const auth = getAuth();
        const db = getFirestore();
        
        // Check if user is authenticated
        if (!auth.currentUser) {
            console.error('❌ ERROR: No user is currently logged in!');
            console.log('Please login first, then run this script again.');
            return;
        }
        
        const userId = auth.currentUser.uid;
        const userEmail = auth.currentUser.email;
        
        console.log('📋 User Information:');
        console.log('  UID:', userId);
        console.log('  Email:', userEmail);
        console.log('');
        
        // Check if document already exists
        console.log('🔍 Checking if user document exists...');
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            console.log('✅ User document already exists!');
            console.log('📄 Current data:', userDocSnap.data());
            console.log('');
            
            // Check isActive field
            const userData = userDocSnap.data();
            if (userData.isActive === false) {
                console.warn('⚠️  WARNING: isActive is set to FALSE');
                console.log('This will cause permission errors.');
                console.log('');
                console.log('To fix, run this command:');
                console.log('');
                console.log('await updateDoc(doc(getFirestore(), "users", "' + userId + '"), { isActive: true });');
                console.log('');
            } else if (userData.isActive === true) {
                console.log('✅ isActive is TRUE - permissions should work!');
                console.log('');
                console.log('If you still get permission errors, the issue is:');
                console.log('1. Firestore rules not deployed, OR');
                console.log('2. Auth token expired (try logging out and back in)');
            } else {
                console.warn('⚠️  WARNING: isActive field is missing');
                console.log('Adding isActive: true...');
                const { updateDoc } = await import('firebase/firestore');
                await updateDoc(userDocRef, { isActive: true });
                console.log('✅ isActive field added!');
            }
            
            return;
        }
        
        // Create new user document
        console.log('📝 Creating new user document...');
        
        const userData = {
            email: userEmail,
            role: 'client_user',
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            assignedAutomations: {},
            displayName: userEmail.split('@')[0],
        };
        
        await setDoc(userDocRef, userData);
        
        console.log('✅ SUCCESS! User document created!');
        console.log('📄 Document data:', userData);
        console.log('');
        console.log('🎉 You can now use the AI Lead Agent without permission errors!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Refresh the page');
        console.log('2. Navigate to AI Lead Agent');
        console.log('3. Try creating a campaign');
        console.log('');
        
    } catch (error) {
        console.error('❌ ERROR creating user document:');
        console.error('  Code:', error.code);
        console.error('  Message:', error.message);
        console.error('  Full error:', error);
        console.log('');
        console.log('If you see "permission-denied", you need to:');
        console.log('1. Deploy testing rules to Firebase');
        console.log('2. Or manually create the document in Firebase Console');
    }
})();
