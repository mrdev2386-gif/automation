// Firebase Callable Functions Diagnostic Test
// Run this in browser console after logging in

async function testFirebaseCallable() {
    console.log('🧪 Starting Firebase Callable Functions Diagnostic Test');
    console.log('='.repeat(60));
    
    // Import Firebase modules
    const { auth, functions } = await import('./src/services/firebase.js');
    const { httpsCallable } = await import('firebase/functions');
    
    // Step 1: Check Auth
    console.log('\n📋 Step 1: Checking Authentication');
    const user = auth.currentUser;
    if (!user) {
        console.error('❌ NOT LOGGED IN - Please log in first!');
        return;
    }
    console.log('✅ Logged in as:', user.email);
    console.log('✅ User ID:', user.uid);
    
    // Step 2: Get Token
    console.log('\n📋 Step 2: Getting Auth Token');
    try {
        const token = await user.getIdToken(true);
        console.log('✅ Token obtained:', token.substring(0, 20) + '...');
    } catch (error) {
        console.error('❌ Failed to get token:', error);
        return;
    }
    
    // Step 3: Check Functions Instance
    console.log('\n📋 Step 3: Checking Functions Instance');
    console.log('Functions object:', functions);
    console.log('Functions app:', functions.app);
    console.log('Functions region:', functions.region || 'us-central1');
    
    // Step 4: Test Callable Function
    console.log('\n📋 Step 4: Testing Callable Function (test)');
    try {
        const testFn = httpsCallable(functions, 'test');
        console.log('Function reference created');
        
        const result = await testFn({});
        console.log('✅ Test function SUCCESS:', result.data);
    } catch (error) {
        console.error('❌ Test function FAILED:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
    }
    
    // Step 5: Test getLeadFinderConfig
    console.log('\n📋 Step 5: Testing getLeadFinderConfig');
    try {
        const configFn = httpsCallable(functions, 'getLeadFinderConfig');
        console.log('Function reference created');
        
        const result = await configFn({});
        console.log('✅ getLeadFinderConfig SUCCESS:', result.data);
    } catch (error) {
        console.error('❌ getLeadFinderConfig FAILED:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Diagnostic Test Complete');
}

// Run the test
testFirebaseCallable();
