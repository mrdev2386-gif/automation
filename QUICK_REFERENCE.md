# Quick Reference - serverTimestamp Fix

## The Problem
```
Error: Cannot read properties of undefined (reading 'serverTimestamp')
```

## The Solution
Replace `FieldValue.serverTimestamp()` with `admin.firestore.Timestamp.now()`

## File Changed
`functions/index.js` - Lines 1533-1559

## What Changed
```diff
- const FieldValue = admin.firestore.FieldValue;
- updated_at: FieldValue.serverTimestamp()
+ updated_at: admin.firestore.Timestamp.now()

- created_at: FieldValue.serverTimestamp()
+ created_at: admin.firestore.Timestamp.now()
+ }, { merge: true });
```

## Deploy
```bash
cd functions
firebase deploy --only functions:saveLeadFinderAPIKey
```

## Verify
```bash
firebase functions:log --only saveLeadFinderAPIKey
```

## Expected Success Log
```
✅ Configuration saved successfully
✅ API keys saved for user xxx: 1 SERP, 0 Apify
```

## Status
✅ COMPLETE - Ready for deployment

---

**Key Points**:
- ✅ No FieldValue pattern
- ✅ Direct timestamp creation
- ✅ Merge option added
- ✅ Production ready
- ✅ No breaking changes
