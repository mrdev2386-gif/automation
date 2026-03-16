# Fix CORS Issue - Local Development Setup

## Problem

CORS errors occur because Firebase callable functions need to be either:
1. **Deployed to Firebase** (production), OR
2. **Running in Firebase Emulator** (local development)

---

## Solution 1: Deploy Functions (Recommended for Testing)

```bash
cd functions
firebase deploy --only functions
```

Wait 3-5 minutes for deployment to complete. Then refresh your dashboard.

---

## Solution 2: Use Firebase Emulator (Recommended for Development)

### Step 1: Start Firebase Emulator

```bash
cd functions
firebase emulators:start
```

This will start:
- Functions Emulator on `http://localhost:5001`
- Firestore Emulator on `http://localhost:8080`

### Step 2: Update Dashboard to Use Emulator

**File:** `dashboard/src/services/firebase.js`

Add this after initializing functions:

```javascript
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

export const functions = getFunctions(app, 'us-central1');

// Connect to emulator in development
if (window.location.hostname === 'localhost') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

### Step 3: Restart Dashboard

```bash
cd dashboard
npm run dev
```

Now all function calls will go to the local emulator instead of production.

---

## Solution 3: Quick Fix - Use Deployed Functions

If functions are already deployed but still getting CORS errors:

### Check Firebase Config

**File:** `dashboard/src/services/firebase.js`

Ensure functions are initialized with the correct region:

```javascript
import { getFunctions } from 'firebase/functions';

export const functions = getFunctions(app, 'us-central1');
```

### Verify Function Names

Make sure you're calling the correct function name:

```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

const getLeadFinderConfig = httpsCallable(functions, 'getLeadFinderConfig');
const result = await getLeadFinderConfig();
```

---

## Why Callable Functions Don't Need CORS Configuration

Firebase callable functions (`onCall`) automatically:
- ✅ Handle CORS for all origins
- ✅ Verify Firebase Auth tokens
- ✅ Parse request/response as JSON
- ✅ Provide error handling

**You don't need to add `cors` manually for callable functions.**

---

## When to Use HTTP Functions with CORS

Only use HTTP functions (`onRequest`) with manual CORS when:
- Building webhooks for external services
- Creating public APIs without authentication
- Need custom HTTP headers/methods

Example:

```javascript
const cors = require('cors')({ origin: true });

exports.myWebhook = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // Your logic here
        res.status(200).json({ success: true });
    });
});
```

---

## Recommended Development Workflow

### For Active Development:
```bash
# Terminal 1: Start emulator
cd functions
firebase emulators:start

# Terminal 2: Start dashboard
cd dashboard
npm run dev
```

### For Testing/Production:
```bash
# Deploy functions
cd functions
firebase deploy --only functions

# Deploy dashboard
cd dashboard
npm run build
netlify deploy --prod
```

---

## Troubleshooting

### Error: "No 'Access-Control-Allow-Origin' header"
- **Cause:** Functions not deployed or emulator not running
- **Fix:** Deploy functions OR start emulator

### Error: "Failed to load resource: net::ERR_FAILED"
- **Cause:** Function doesn't exist or wrong name
- **Fix:** Check function name and verify deployment

### Error: "FirebaseError: internal"
- **Cause:** Function threw an error on server
- **Fix:** Check Firebase Console logs for details

---

**Quick Command Reference:**

```bash
# Deploy functions
firebase deploy --only functions

# Start emulator
firebase emulators:start

# View function logs
firebase functions:log

# Test specific function
firebase functions:shell
```

---

**Status:** ✅ Ready to Use
**Last Updated:** 2024
