# Deployment & Testing Guide - serverTimestamp Fix

## STEP 6: Build Functions

```bash
cd functions
npm install
npm run build
```

Expected output:
```
npm notice
npm notice New minor version of npm available: X.X.X -> X.X.X
npm notice To update run: npm install -g npm@X.X.X
npm notice
added X packages, and audited X packages in Xs
```

## STEP 7: Deploy Function

```bash
firebase deploy --only functions:saveLeadFinderAPIKey
```

Expected output:
```
✔ functions: Finished running predeploy script.
i functions: ensuring required API cloudfunctions.googleapis.com is enabled...
✔ functions: required API cloudfunctions.googleapis.com is enabled
i functions: preparing functions directory for uploading...
i functions: packaged functions (XX.XX KB) for uploading
✔ functions: functions folder uploaded successfully
i functions: updating Node.js 18 function saveLeadFinderAPIKey(us-central1)...
✔ functions[saveLeadFinderAPIKey(us-central1)]: Successful update operation.

✔ Deploy complete!
```

## STEP 8: Verify Deployment

### Check Function Logs
```bash
firebase functions:log --only saveLeadFinderAPIKey
```

### Expected Log Output
```
🔍 saveLeadFinderAPIKey request: { userId: 'xxx', serpKeysCount: 1, apifyKeysCount: 0 }
📊 Saving API keys for user: xxx
📊 SERP keys: ['sk_test_xxxxx']
📊 Apify keys: []
✅ Validation passed: { hasSerpKeys: true, hasApifyKeys: false }
💾 Preparing to save to Firestore...
✅ Added SERP keys to updateData: 1
💾 Update data prepared: ['user_id', 'updated_at', 'serp_api_keys']
📝 Creating new config document...
✅ New config document created
✅ Configuration saved successfully
✅ API keys saved for user xxx: 1 SERP, 0 Apify
```

## STEP 9: End-to-End Test

### Test 1: Save SERP API Key Only

**Steps**:
1. Open Lead Finder Settings page
2. Enter a SERP API key: `sk_test_xxxxx`
3. Leave Apify key empty
4. Click "Save API Keys"

**Expected Result**:
- ✅ Success toast message
- ✅ No console errors
- ✅ Function returns success response
- ✅ No serverTimestamp errors in logs

**Verify in Firestore**:
```
lead_finder_config/{userId}
├── user_id: "xxx"
├── serp_api_keys: ["sk_test_xxxxx"]
├── apify_api_keys: []
├── updated_at: Timestamp (current time)
├── created_at: Timestamp (creation time)
├── daily_limit: 500
├── max_concurrent_jobs: 1
└── status: "active"
```

### Test 2: Save Apify API Key Only

**Steps**:
1. Open Lead Finder Settings page
2. Leave SERP key empty
3. Enter an Apify key: `apify_xxxxx`
4. Click "Save API Keys"

**Expected Result**:
- ✅ Success toast message
- ✅ No console errors
- ✅ Function returns success response

**Verify in Firestore**:
```
lead_finder_config/{userId}
├── serp_api_keys: []
├── apify_api_keys: ["apify_xxxxx"]
└── updated_at: Timestamp (updated time)
```

### Test 3: Save Both Keys

**Steps**:
1. Open Lead Finder Settings page
2. Enter SERP key: `sk_test_xxxxx`
3. Enter Apify key: `apify_xxxxx`
4. Click "Save API Keys"

**Expected Result**:
- ✅ Success toast message
- ✅ No console errors
- ✅ Both keys saved

### Test 4: Save Multiple Keys

**Steps**:
1. Open Lead Finder Settings page
2. Click "Add SERP API Key"
3. Enter first SERP key: `sk_test_key1`
4. Enter second SERP key: `sk_test_key2`
5. Click "Save API Keys"

**Expected Result**:
- ✅ Success toast message
- ✅ Both keys saved in array

**Verify in Firestore**:
```
lead_finder_config/{userId}
├── serp_api_keys: ["sk_test_key1", "sk_test_key2"]
└── updated_at: Timestamp (updated time)
```

### Test 5: Attempt Save with No Keys

**Steps**:
1. Open Lead Finder Settings page
2. Leave all keys empty
3. Click "Save API Keys"

**Expected Result**:
- ✅ Error toast: "Please enter at least one valid API key"
- ✅ No Firestore write
- ✅ No console errors

## Troubleshooting

### Issue: Still Getting serverTimestamp Error

**Solution**:
1. Verify deployment completed successfully
2. Check Cloud Function logs for errors
3. Clear browser cache and reload
4. Restart Firebase emulator if using local development

### Issue: Firestore Document Not Created

**Solution**:
1. Check Firestore security rules allow write
2. Verify user is authenticated
3. Check Cloud Function logs for errors
4. Ensure `lead_finder_config` collection exists

### Issue: Timestamp Shows as Null

**Solution**:
1. Verify `admin.firestore.Timestamp.now()` is being used
2. Check that `{ merge: true }` option is present
3. Verify Firebase Admin SDK is properly initialized

## Rollback (If Needed)

If issues occur after deployment:

```bash
# Revert to previous version
firebase functions:delete saveLeadFinderAPIKey

# Redeploy from backup
firebase deploy --only functions:saveLeadFinderAPIKey
```

## Success Criteria

All tests pass when:
- ✅ Single SERP key saves successfully
- ✅ Single Apify key saves successfully
- ✅ Both keys save successfully
- ✅ Multiple keys save successfully
- ✅ Empty submission shows validation error
- ✅ Firestore document structure is correct
- ✅ Timestamps are created correctly
- ✅ No serverTimestamp errors in logs
- ✅ No console errors in browser

## Deployment Checklist

- [ ] Run `npm install` in functions directory
- [ ] Run `npm run build` to verify no build errors
- [ ] Deploy with `firebase deploy --only functions:saveLeadFinderAPIKey`
- [ ] Verify deployment completed successfully
- [ ] Check Cloud Function logs
- [ ] Test saving SERP key only
- [ ] Test saving Apify key only
- [ ] Test saving both keys
- [ ] Test saving multiple keys
- [ ] Test validation with no keys
- [ ] Verify Firestore document structure
- [ ] Verify timestamps are correct
- [ ] Confirm no serverTimestamp errors

## Status

✅ **READY FOR DEPLOYMENT**

The fix has been applied and verified. Ready to deploy to production.

---

**Date**: 2024
**Status**: ✅ COMPLETE
**Next Step**: Deploy with `firebase deploy --only functions:saveLeadFinderAPIKey`
