# Fix for saveLeadFinderAPIKey Error

## Problem
Error: "At least one API key type is required"

The validation logic fails when empty arrays are sent from the frontend.

## Root Cause
```javascript
// Current validation (BROKEN)
if (!serpApiKeys && !apifyApiKeys) {
    throw new Error('At least one API key type is required');
}
```

Empty arrays `[]` are truthy in JavaScript, so this check passes even when no keys are provided.
Then `serpApiKeys.length > 0` returns false, so no keys are added to updateData.

## Solution

### File: functions/index.js (Line ~1470)

**FIND:**
```javascript
        // Validate input
        if (!serpApiKeys && !apifyApiKeys) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'At least one API key type is required'
            );
        }
```

**REPLACE WITH:**
```javascript
        console.log('📥 saveLeadFinderAPIKey request:', { 
            userId, 
            serpKeysCount: serpApiKeys?.length || 0, 
            apifyKeysCount: apifyApiKeys?.length || 0 
        });

        // Validate input - check for at least one non-empty array
        const hasSerpKeys = serpApiKeys && Array.isArray(serpApiKeys) && serpApiKeys.length > 0;
        const hasApifyKeys = apifyApiKeys && Array.isArray(apifyApiKeys) && apifyApiKeys.length > 0;
        
        if (!hasSerpKeys && !hasApifyKeys) {
            console.log('❌ Validation failed: No valid API keys provided');
            throw new functions.https.HttpsError(
                'invalid-argument',
                'At least one API key type is required'
            );
        }
        
        console.log('✅ Validation passed:', { hasSerpKeys, hasApifyKeys });
```

## Manual Fix Steps

1. Open `functions/index.js`
2. Search for `exports.saveLeadFinderAPIKey`
3. Find the validation block (around line 1470)
4. Replace the validation logic as shown above
5. Save the file
6. Deploy: `firebase deploy --only functions`

## Testing

After deployment, test:
1. Save only SERP key → should succeed
2. Save only Apify key → should succeed  
3. Save both → should succeed
4. Save neither (empty arrays) → should show error

## Expected Logs

```
📥 saveLeadFinderAPIKey request: { userId: 'xxx', serpKeysCount: 1, apifyKeysCount: 0 }
✅ Validation passed: { hasSerpKeys: true, hasApifyKeys: false }
✅ API keys saved for user xxx: 1 SERP, 0 Apify
```
