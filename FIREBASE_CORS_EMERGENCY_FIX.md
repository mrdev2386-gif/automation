# 🚨 EMERGENCY FIX: Firebase Callable Functions CORS Error

## Problem
Firebase SDK is falling back to `callAtURL` and hitting CORS errors. This means the SDK is treating callable functions as regular HTTP endpoints instead of using the proper callable protocol.

## Root Cause
When you see `callAtURL` in the stack trace, it means:
1. Firebase SDK couldn't use the proper callable function protocol
2. It's falling back to direct HTTP POST requests
3. These HTTP requests don't have proper CORS headers (because they're meant to be callable, not HTTP)

## Immediate Solution

### Option 1: Use Firebase Emulator (RECOMMENDED FOR DEVELOPMENT)

1. **Enable emulator in `.env`**:
```env
VITE_USE_EMULATOR=true
```

2. **Start Firebase Emulator**:
```bash
cd functions
firebase emulators:start
```

3. **Restart dev server**:
```bash
cd dashboard
npm run dev
```

This will connect to `localhost:5001` and avoid all CORS issues.

---

### Option 2: Fix Production Callable Functions

The issue is that Firebase SDK v10.8.0 might have compatibility issues with Firebase Functions v5.0.0.

#### Step 1: Upgrade Firebase SDK

```bash
cd dashboard
npm install firebase@latest
```

#### Step 2: Clear all caches

```bash
rm -rf node_modules/.vite dist
npm run dev
```

#### Step 3: Verify initialization

Make sure firebase.js has:
```javascript
const functions = getFunctions(app, 'us-central1');
// NO emulator connection in production
```

---

### Option 3: Temporary HTTP Endpoint Workaround

If callable functions continue to fail, use the HTTP endpoints that are already deployed:

**Change in `firebase.js`**:

```javascript
// TEMPORARY: Use HTTP endpoints instead of callable
export const getLeadFinderConfig = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const token = await user.getIdToken();
    const response = await fetch(
        'https://us-central1-waautomation-13fa6.cloudfunctions.net/getLeadFinderConfig',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: {} })
        }
    );
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
};
```

**BUT WAIT** - Your functions are deployed as `callable`, not HTTP with CORS. So this won't work either!

---

## The Real Fix: Redeploy Functions with CORS

The functions need to be deployed with proper CORS headers OR as pure callable functions.

### Check Current Function Type

Run:
```bash
firebase functions:list | grep getLeadFinderConfig
```

Output shows:
```
getLeadFinderConfig  │ v1  │ callable  │ us-central1
```

This confirms it's deployed as **callable**, which should NOT have CORS issues!

---

## Why is this happening?

The Firebase SDK is using `callAtURL` fallback because:

1. **Auth token not being sent properly**
2. **Firebase SDK version mismatch**
3. **Browser blocking the request**
4. **Service Worker interference**

---

## Diagnostic Steps

### 1. Check Browser Console

Look for these logs:
```
📞 Calling function: getLeadFinderConfig
📞 Auth User: [email]
📞 Token obtained: YES
```

If you see "NOT LOGGED IN" or "Token obtained: NO", that's the problem!

### 2. Run Diagnostic Script

In browser console:
```javascript
// Copy and paste the content of test-callable-functions.js
```

### 3. Check Network Tab

- Open DevTools → Network tab
- Look for the request to `getLeadFinderConfig`
- Check if `Authorization` header is present
- Check if `__firebase_request_key__` header is present

---

## Solution Matrix

| Symptom | Cause | Solution |
|---------|-------|----------|
| "NOT LOGGED IN" | User not authenticated | Log in first |
| "Token obtained: NO" | Token fetch failed | Check Firebase Auth setup |
| CORS error | SDK using HTTP fallback | Use emulator OR upgrade SDK |
| "functions/not-found" | Function not deployed | Deploy functions |
| "functions/internal" | Function crashed | Check function logs |

---

## Quick Fix for Development

**Use the emulator!**

1. `.env`:
```env
VITE_USE_EMULATOR=true
```

2. Terminal 1:
```bash
cd functions
firebase emulators:start
```

3. Terminal 2:
```bash
cd dashboard
npm run dev
```

This bypasses ALL CORS issues and works perfectly for development.

---

## Production Fix

If you need production to work NOW:

### Option A: Wait for auth token

The issue might be that the function is being called before the user is fully authenticated.

**Add auth check**:
```javascript
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Wait a bit for token to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Now call the function
            await getLeadFinderConfig();
        }
    });
    return unsubscribe;
}, []);
```

### Option B: Retry logic

```javascript
async function callFunctionWithRetry(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// Usage
await callFunctionWithRetry(() => getLeadFinderConfig());
```

---

## Final Recommendation

**FOR DEVELOPMENT**: Use Firebase Emulator (no CORS issues)
**FOR PRODUCTION**: Upgrade Firebase SDK to latest version

```bash
cd dashboard
npm install firebase@latest
rm -rf node_modules/.vite dist
npm run dev
```

If that doesn't work, there's a deeper issue with how Firebase SDK is detecting callable functions. In that case, we need to check:

1. Firebase project settings
2. Service account permissions
3. Firebase SDK initialization order
4. Browser extensions blocking requests

---

## Emergency Contact

If nothing works:
1. Check Firebase Console → Functions → Logs
2. Look for errors in function execution
3. Verify function is actually being called
4. Check if it's a billing/quota issue

---

**Status**: 🔴 CORS ERROR ACTIVE  
**Next Step**: Use emulator OR upgrade Firebase SDK  
**ETA**: 5 minutes with emulator, 15 minutes with SDK upgrade
