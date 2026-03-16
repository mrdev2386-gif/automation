# Quick Debug Patch for AILeadAgent.jsx

## Add this debugging code to line 88 in AILeadAgent.jsx

Replace the `checkSetupRequirements` function with this version:

```javascript
// Check setup requirements
const checkSetupRequirements = async () => {
    try {
        setSetupLoading(true);
        
        // 🔍 DEBUG: Check authentication state
        console.log('=== SETUP REQUIREMENTS CHECK ===');
        console.log('🔐 Auth state:', {
            user: user?.uid,
            email: user?.email,
            isAuthenticated: !!user,
            authObject: auth.currentUser
        });
        
        if (!user || !user.uid) {
            console.error('❌ User not authenticated!');
            setSetupLoading(false);
            return;
        }
        
        // 🔍 DEBUG: Check functions instance
        console.log('☁️ Functions instance:', {
            app: functions.app.name,
            region: functions.region || 'default'
        });
        
        // Check Lead Finder configuration
        console.log('📞 Calling getLeadFinderConfig...');
        const getLeadFinderConfig = httpsCallable(functions, 'getLeadFinderConfig');
        
        try {
            const configResult = await getLeadFinderConfig();
            console.log('✅ Config result:', configResult.data);
            setLeadFinderConfigured(configResult.data?.hasApiKey || false);
        } catch (funcError) {
            console.error('❌ Function call failed:', {
                code: funcError.code,
                message: funcError.message,
                details: funcError.details,
                fullError: funcError
            });
            throw funcError;
        }
        
        // Check user tools
        console.log('📋 Checking user tools...');
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            console.log('✅ User data:', {
                assignedAutomations: userData.assignedAutomations,
                role: userData.role,
                isActive: userData.isActive
            });
            setUserTools(userData.assignedAutomations || []);
        } else {
            console.warn('⚠️ User document not found in Firestore');
        }
        
        console.log('=== SETUP CHECK COMPLETE ===');
    } catch (error) {
        console.error('❌ Setup requirements check failed:', {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack,
            fullError: error
        });
    } finally {
        setSetupLoading(false);
    }
};
```

## What This Debug Code Does

1. ✅ Logs authentication state
2. ✅ Logs functions instance configuration
3. ✅ Logs function call attempt
4. ✅ Logs detailed error information if call fails
5. ✅ Logs user data from Firestore

## How to Use

1. Replace the `checkSetupRequirements` function in `AILeadAgent.jsx`
2. Save the file
3. Refresh the browser
4. Open DevTools Console (F12)
5. Navigate to `/ai-lead-agent`
6. Check the console output

## Expected Output (Success)

```
=== SETUP REQUIREMENTS CHECK ===
🔐 Auth state: { user: "abc123", email: "user@example.com", isAuthenticated: true, ... }
☁️ Functions instance: { app: "[DEFAULT]", region: "us-central1" }
📞 Calling getLeadFinderConfig...
✅ Config result: { user_id: "abc123", hasApiKey: false, daily_limit: 500, ... }
📋 Checking user tools...
✅ User data: { assignedAutomations: [...], role: "client_user", isActive: true }
=== SETUP CHECK COMPLETE ===
```

## Expected Output (CORS Error)

```
=== SETUP REQUIREMENTS CHECK ===
🔐 Auth state: { user: "abc123", email: "user@example.com", isAuthenticated: true, ... }
☁️ Functions instance: { app: "[DEFAULT]", region: "us-central1" }
📞 Calling getLeadFinderConfig...
❌ Function call failed: {
  code: "unavailable",
  message: "Failed to fetch",
  details: undefined,
  fullError: Error: Failed to fetch
}
```

## Troubleshooting Based on Output

### If you see "User not authenticated"
- User is not logged in
- Redirect to login page
- Check Firebase Auth initialization

### If you see "Failed to fetch" or CORS error
- Function not deployed
- Run: `firebase deploy --only functions`
- Check: `firebase functions:list`

### If you see "unauthenticated" error
- Token expired
- Logout and login again
- Check token refresh logic

### If you see "permission-denied"
- User doesn't have access
- Check Firestore security rules
- Verify user role in database

## Remove Debug Code After Fixing

Once the issue is resolved, you can remove the extra console.log statements and keep just the essential logic.
