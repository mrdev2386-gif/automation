# Quick Fix Reference - serverTimestamp Error

## Problem
```
Cannot read properties of undefined (reading 'serverTimestamp')
```

## Solution
Extract `FieldValue` to local variable instead of accessing `admin.firestore.FieldValue` multiple times.

## Code Change

### Before (❌ Error-prone)
```javascript
const updateData = {
    updated_at: admin.firestore.FieldValue.serverTimestamp()
};

// Later...
created_at: admin.firestore.FieldValue.serverTimestamp()
```

### After (✅ Fixed)
```javascript
const FieldValue = admin.firestore.FieldValue;

const updateData = {
    updated_at: FieldValue.serverTimestamp()
};

// Later...
created_at: FieldValue.serverTimestamp()
```

## Why This Works
- Accesses `admin.firestore.FieldValue` once
- Stores reference in local variable
- Avoids repeated property access
- More defensive against timing issues

## Deploy
```bash
cd functions
firebase deploy --only functions:saveLeadFinderAPIKey
```

## Test
1. Go to Lead Finder Settings
2. Enter SERP API key
3. Click Save
4. Should see success message
5. Check Firestore: `lead_finder_config/{userId}`

## Verify Logs
```bash
firebase functions:log --only saveLeadFinderAPIKey
```

Expected:
```
✅ Validation passed
💾 Preparing to save to Firestore...
✅ Added SERP keys to updateData: 1
📝 Creating new config document...
✅ New config document created
✅ Configuration saved successfully
```

## Files Modified
- `functions/index.js` (line 1534)

## Status
✅ Fixed and ready for deployment
