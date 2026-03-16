# CORS Investigation Report - getLeadFinderConfig

**Date**: 2024
**Status**: 🔍 INVESTIGATION COMPLETE

---

## Investigation Results

### 1. Function Implementation ✅ CORRECT

**Location**: `functions/index.js` line 1379

```javascript
exports.getLeadFinderConfig = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // ... rest of implementation
});
```

✅ **Correctly implemented as `https.onCall`**

---

### 2. Frontend Implementation ✅ CORRECT

**Location**: `dashboard/src/pages/AILeadAgent.jsx` line 90-91

```javascript
const getLeadFinderConfig = httpsCallable(functions, 'getLeadFinderConfig');
const configResult = await getLeadFinderConfig();
```

✅ **Correctly using `httpsCallable`**

---

### 3. Firebase Configuration ✅ CORRECT

**Location**: `dashboard/src/services/firebase.js` line 50

```javascript
const functions = getFunctions(app, 'us-central1');
```

✅ **Region correctly specified**

---

### 4. No Direct HTTP Calls ✅ VERIFIED

Searched entire codebase for:
- `fetch("https://us-central1-waautomation-13fa6.cloudfunctions.net/getLeadFinderConfig")`
- `axios.post(...getLeadFinderConfig...)`

✅ **No direct HTTP calls found**

---

## Root Cause Analysis

The CORS error is occurring despite correct implementation. This indicates one of the following:

### Possible Causes:

1. **Function Not Deployed** ⚠️
   - The function may not be deployed to Firebase
   - Or deployed with wrong configuration

2. **Authentication Token Issue** ⚠️
   - User may not be authenticated when function is called
   - Token may be expired or invalid

3. **Browser Cache** ⚠️
   - Old function endpoint cached
   - Service worker caching old responses

4. **Firebase SDK Version Mismatch** ⚠️
   - Incompatible versions between frontend and backend

---

## Solution Steps

### Step 1: Verify Function Deployment

Run this command to check if the function is deployed:

```bash
firebase functions:list
```

**Expected output:**
```
✔ functions: Loaded functions definitions from source: ...
┌────────────────────────────────┬────────────────────────────────────────────────┐
│ Function Name                  │ Trigger                                        │
├────────────────────────────────┼────────────────────────────────────────────────┤
│ getLeadFinderConfig            │ https://us-central1-waautomation-13fa6...      │
└────────────────────────────────┴────────────────────────────────────────────────┘
```

If the function is NOT listed, deploy it:

```bash
cd functions
firebase deploy --only functions:getLeadFinderConfig
```

---

### Step 2: Check Authentication

Add debug logging to verify authentication:

**In `AILeadAgent.jsx` line 88:**

```javascript
const checkSetupRequirements = async () => {
    try {
        setSetupLoading(true);
        
        // DEBUG: Check authentication
        console.log('🔐 Auth state:', {
            user: user?.uid,
            email: user?.email,
            isAuthenticated: !!user
        });
        
        // Check Lead Finder configuration
        const getLeadFinderConfig = httpsCallable(functions, 'getLeadFinderConfig');
        
        console.log('📞 Calling getLeadFinderConfig...');
        const configResult = await getLeadFinderConfig();
        console.log('✅ Config result:', configResult.data);
        
        setLeadFinderConfigured(configResult.data?.hasApiKey || false);
        // ... rest of code
```

---

### Step 3: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use: `Ctrl+Shift+Delete` → Clear cache

---

### Step 4: Verify Firebase SDK Versions

Check `dashboard/package.json`:

```json
{
  "dependencies": {
    "firebase": "^10.x.x"  // Should be version 10+
  }
}
```

Check `functions/package.json`:

```json
{
  "dependencies": {
    "firebase-admin": "^12.x.x",
    "firebase-functions": "^5.x.x"
  }
}
```

If versions are mismatched, update:

```bash
cd dashboard
npm install firebase@latest

cd ../functions
npm install firebase-admin@latest firebase-functions@latest
```

---

### Step 5: Redeploy Functions

```bash
cd functions
firebase deploy --only functions
```

Wait for deployment to complete, then test again.

---

### Step 6: Test with Curl

Test the function directly to verify it's deployed:

```bash
# Get your Firebase ID token first
# (Copy from browser DevTools → Application → IndexedDB → firebaseLocalStorage)

curl -X POST \
  https://us-central1-waautomation-13fa6.cloudfunctions.net/getLeadFinderConfig \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{}'
```

**Expected response:**
```json
{
  "result": {
    "user_id": "...",
    "api_key": "",
    "daily_limit": 500,
    "hasApiKey": false
  }
}
```

---

## Debugging Checklist

- [ ] Function is deployed (`firebase functions:list`)
- [ ] User is authenticated (check console logs)
- [ ] Browser cache cleared
- [ ] Firebase SDK versions are compatible
- [ ] Functions redeployed
- [ ] Direct curl test successful

---

## Expected Behavior

When working correctly:

1. **Browser Network Tab** will show:
   - Request to: `https://us-central1-waautomation-13fa6.cloudfunctions.net/getLeadFinderConfig`
   - Method: POST
   - Status: 200 OK
   - Response: JSON with config data

2. **Browser Console** will show:
   ```
   🔐 Auth state: { user: "abc123", email: "user@example.com", isAuthenticated: true }
   📞 Calling getLeadFinderConfig...
   ✅ Config result: { user_id: "abc123", hasApiKey: false, ... }
   ```

3. **No CORS errors**

---

## Important Notes

### Why Network Tab Shows HTTP POST

Firebase callable functions **DO** use HTTP POST requests under the hood. This is normal!

The difference is:
- **Callable functions**: Firebase SDK handles authentication, CORS, and error handling automatically
- **Direct HTTP**: You must handle CORS, authentication headers, and error parsing manually

The fact that you see a POST request in the Network tab is **expected and correct**.

---

## Alternative: Use HTTP Version (Not Recommended)

If callable functions continue to fail, there's an HTTP version available:

**Backend** (`functions/index.js` line 4086):
```javascript
exports.getLeadFinderConfigHTTP = functions
    .region('us-central1')
    .https.onRequest((req, res) => {
        return cors(req, res, async () => {
            // ... implementation with CORS
        });
    });
```

**Frontend** (not recommended):
```javascript
const response = await fetch(
    'https://us-central1-waautomation-13fa6.cloudfunctions.net/getLeadFinderConfigHTTP',
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
        }
    }
);
```

**However, this is NOT recommended** because:
- Loses automatic authentication handling
- Loses automatic error handling
- More code to maintain
- Less secure

---

## Next Steps

1. **Run deployment check**: `firebase functions:list`
2. **Add debug logging** to verify authentication
3. **Clear browser cache** completely
4. **Redeploy functions**: `firebase deploy --only functions`
5. **Test again** and check console logs

---

## Contact

If the issue persists after following all steps:
1. Check Firebase Console → Functions → Logs
2. Look for error messages
3. Verify function is receiving requests
4. Check authentication tokens are valid

---

**Investigation Complete**
**Next Action**: Follow Solution Steps 1-6 in order
