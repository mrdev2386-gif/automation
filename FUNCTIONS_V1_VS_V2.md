# Firebase Functions - V1 vs V2 API

## Current Status

Your project uses **firebase-functions v7.1.0** which supports **both v1 and v2 APIs**.

The `.region()` method works fine in v1 API (current setup).

## If You See "functions.region is not a function"

This error only occurs if you're trying to use v2 API syntax with v1 imports.

### Quick Fix: Stay on V1 (Recommended)

Your current code is correct:
```javascript
const functions = require('firebase-functions');

exports.getLeadFinderConfig = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
        // Your code
    });
```

**No changes needed!** This works perfectly with firebase-functions v7.

---

## Optional: Migrate to V2 API

Only do this if you specifically want v2 features (better cold starts, more memory options).

### Step 1: Update Imports

```javascript
// OLD (v1)
const functions = require('firebase-functions');

// NEW (v2)
const { onCall, onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { HttpsError } = require('firebase-functions/v2/https');
```

### Step 2: Set Global Region

```javascript
setGlobalOptions({ region: 'us-central1' });
```

### Step 3: Update Function Syntax

```javascript
// OLD (v1)
exports.getLeadFinderConfig = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Auth required');
        }
        const uid = context.auth.uid;
        // ...
    });

// NEW (v2)
exports.getLeadFinderConfig = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Auth required');
    }
    const uid = request.auth.uid;
    const data = request.data;
    // ...
});
```

### Key Differences

| V1 | V2 |
|----|-----|
| `(data, context)` | `(request)` |
| `context.auth` | `request.auth` |
| `data` | `request.data` |
| `.region()` | `setGlobalOptions()` |
| `functions.https.HttpsError` | `HttpsError` |

---

## Recommendation

**Keep using V1 API** - Your current setup works perfectly. Only migrate to V2 if you need:
- Faster cold starts
- More than 2GB memory
- Longer timeouts (>9 minutes)

---

## Current Setup (V1) - No Changes Needed

✅ Your functions work correctly
✅ `.region('us-central1')` is valid
✅ No migration required

If you're seeing errors, it's likely:
1. Emulator needs restart
2. Syntax error elsewhere in the file
3. Missing dependency

**Solution:** Restart emulator
```bash
cd functions
firebase emulators:start
```
