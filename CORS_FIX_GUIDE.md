# CORS Error Fix Guide

## Understanding the Error

The CORS errors you're seeing indicate that your Firebase Cloud Functions are not properly handling cross-origin requests from your local development server (localhost:5173).

**Good News**: Firebase callable functions (`onCall`) automatically handle CORS. The issue is likely that the functions need to be deployed or redeployed.

---

## Solution: Deploy Your Cloud Functions

### Step 1: Navigate to Functions Directory

```bash
cd functions
```

### Step 2: Install Dependencies (if not already done)

```bash
npm install
```

### Step 3: Deploy All Functions

```bash
firebase deploy --only functions
```

**OR** Deploy specific functions:

```bash
firebase deploy --only functions:getLeadFinderConfig,functions:getFAQs
```

### Step 4: Wait for Deployment

The deployment will take 2-5 minutes. You'll see output like:

```
✔  functions[getLeadFinderConfig(us-central1)] Successful update operation.
✔  functions[getFAQs(us-central1)] Successful update operation.
```

### Step 5: Verify Deployment

Check the Firebase Console:
1. Go to https://console.firebase.google.com/project/waautomation-13fa6/functions
2. Verify that your functions are listed and show "Healthy" status
3. Note the function URLs

---

## Alternative: Use Firebase Emulators for Local Development

If you want to develop locally without deploying every time:

### Step 1: Install Emulator Suite

```bash
firebase init emulators
```

Select:
- Functions Emulator
- Firestore Emulator

### Step 2: Start Emulators

```bash
firebase emulators:start
```

### Step 3: Update Frontend to Use Emulators

In `dashboard/src/services/firebase.js`, add:

```javascript
import { connectFunctionsEmulator } from 'firebase/functions';

// After initializing functions
if (window.location.hostname === 'localhost') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

---

## Quick Fix: Verify Firebase Configuration

### Check `dashboard/src/services/firebase.js`

Ensure your Firebase configuration is correct:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1'); // Specify region
```

### Check `.env` File

Ensure `dashboard/.env` has correct values:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=waautomation-13fa6.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=waautomation-13fa6
VITE_FIREBASE_STORAGE_BUCKET=waautomation-13fa6.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Troubleshooting

### Error: "No 'Access-Control-Allow-Origin' header"

**Cause**: Functions not deployed or wrong region specified

**Fix**:
1. Deploy functions: `firebase deploy --only functions`
2. Verify region in `firebase.js`: `getFunctions(app, 'us-central1')`

### Error: "Failed to load resource: net::ERR_FAILED"

**Cause**: Function doesn't exist or wrong function name

**Fix**:
1. Check function name matches exactly: `getLeadFinderConfig`
2. Verify function is deployed in Firebase Console

### Error: "FirebaseError: internal"

**Cause**: Function threw an error on the server

**Fix**:
1. Check Firebase Console Logs: https://console.firebase.google.com/project/waautomation-13fa6/functions/logs
2. Look for error details in the logs
3. Fix the error in `functions/index.js`
4. Redeploy: `firebase deploy --only functions`

---

## Testing After Deployment

### Test in Browser Console

```javascript
// Open browser console (F12)
import { httpsCallable } from 'firebase/functions';
import { functions } from './services/firebase';

const getConfig = httpsCallable(functions, 'getLeadFinderConfig');
getConfig().then(result => console.log(result.data));
```

### Expected Response

```json
{
  "user_id": "your-user-id",
  "api_key": "",
  "daily_limit": 500,
  "max_concurrent_jobs": 1,
  "status": "active",
  "hasApiKey": false
}
```

---

## Summary

**The fix is simple**: Deploy your Cloud Functions

```bash
cd functions
firebase deploy --only functions
```

Firebase callable functions automatically handle CORS. The error occurs because the functions aren't deployed yet or need to be redeployed after changes.

---

## Need More Help?

1. Check Firebase Console Logs for detailed errors
2. Verify your Firebase project ID matches in all config files
3. Ensure you're logged into the correct Firebase account: `firebase login`
4. Check that you have the correct permissions in the Firebase project

---

**Last Updated**: 2024
**Status**: ✅ Ready to Deploy
