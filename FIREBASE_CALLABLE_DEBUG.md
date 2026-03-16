# 🔍 FIREBASE CALLABLE FUNCTION DEBUG GUIDE

## getLeadFinderConfig - Runtime Error Investigation

### EXACT FUNCTION LOCATION
**File**: `functions/index.js`  
**Line**: 1,847-1,880  
**Function Type**: `functions.https.onCall()`

---

## STEP 1: FUNCTION STRUCTURE VERIFICATION

### ✅ Correct Structure
```javascript
exports.getLeadFinderConfig = functions.https.onCall(async (data, context) => {
    // Function body
});
```

### ✅ Verified
- Function is properly exported
- Uses `functions.https.onCall()` (callable, not HTTP)
- Syntax is valid
- Not nested inside another function

---

## STEP 2: RUNTIME EXECUTION FLOW

### Call Chain
```
Frontend (LeadFinderSettings.jsx:41)
    ↓
httpsCallable(functions, 'getLeadFinderConfig')()
    ↓
Firebase SDK routes to emulator
    ↓
Emulator loads function from functions/index.js:1847
    ↓
Function executes with context.auth
    ↓
[EXECUTION POINT 1] Check context.auth
    ↓
[EXECUTION POINT 2] Get UID from context.auth.uid
    ↓
[EXECUTION POINT 3] Fetch user document from Firestore
    ↓
[EXECUTION POINT 4] Parse user data
    ↓
[EXECUTION POINT 5] Return response
```

---

## STEP 3: CRITICAL EXECUTION POINTS

### POINT 1: Authentication Check (Line 1,852)
```javascript
if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
}
```
**Possible Error**: `context.auth` is `null` or `undefined`  
**Debug Log**: `console.log('Auth context:', context.auth);`

### POINT 2: Extract UID (Line 1,857)
```javascript
const uid = context.auth.uid;
```
**Possible Error**: `context.auth.uid` is `undefined`  
**Debug Log**: `console.log('UID:', uid);`

### POINT 3: Firestore Query (Line 1,858)
```javascript
const userDoc = await db.collection('users').doc(uid).get();
```
**Possible Errors**:
- `db` is not defined
- `db.collection()` fails
- Firestore emulator not connected
- Network error

**Debug Log**: `console.log('Fetching user document...');`

### POINT 4: Parse User Data (Line 1,863)
```javascript
const userData = userDoc.data();
const tools = userData.assignedAutomations || [];
```
**Possible Errors**:
- `userData` is `null`
- `userData.assignedAutomations` is `undefined`
- `userData.isActive` is `undefined`

**Debug Log**: `console.log('User data:', userData);`

### POINT 5: Return Response (Line 1,868)
```javascript
return {
    accountActive: userData.isActive === true,
    leadFinderConfigured: tools.includes('lead_finder'),
    toolsAssigned: tools.length > 0
};
```
**Possible Errors**:
- `tools.includes()` throws error if `tools` is not an array
- `tools.length` throws error if `tools` is not an array

**Debug Log**: `console.log('Returning response:', response);`

---

## STEP 4: FIRESTORE INITIALIZATION CHECK

### Verify db is Defined
**Location**: `functions/index.js` Line 47-48

```javascript
// Initialize Firebase Admin
initializeFirebase();
const db = admin.firestore();
const auth = admin.auth();
```

**Check**:
- ✅ `initializeFirebase()` is called
- ✅ `db` is assigned from `admin.firestore()`
- ✅ `auth` is assigned from `admin.auth()`

### Verify initializeFirebase()
**Location**: `functions/src/config/firebase.js`

**Must contain**:
```javascript
const admin = require('firebase-admin');

module.exports.initializeFirebase = () => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
};
```

---

## STEP 5: EMULATOR CONNECTION VERIFICATION

### Check Emulator is Running
```bash
firebase emulators:start
```

**Expected Output**:
```
✔  functions: Emulator started at http://localhost:5001
✔  firestore: Emulator started at http://localhost:8085
✔  auth: Emulator started at http://localhost:9100
```

### Check Function is Loaded
**Expected in terminal**:
```
Loaded 50+ functions including:
  - getLeadFinderConfig
  - getMyAutomations
  - startLeadFinder
  ... etc
```

---

## STEP 6: ADDED DEBUG LOGGING

### Debug Logs Added to getLeadFinderConfig

```javascript
console.log('🔍 getLeadFinderConfig called');
console.log('📋 Auth context:', { uid: context.auth?.uid, hasAuth: !!context.auth });

// After auth check
console.log('🔑 UID:', uid);
console.log('💾 Fetching user document from collection: users');

// After Firestore query
console.log('✅ User document fetch completed');
console.log('📄 Document exists:', userDoc.exists);

// After parsing data
console.log('👤 User data retrieved:', { isActive: userData.isActive, automationsCount: userData.assignedAutomations?.length });
console.log('🔧 Tools assigned:', tools);

// Before return
console.log('✅ Returning response:', response);

// In catch block
console.error('❌ getLeadFinderConfig error:', error);
console.error('📋 Error type:', error.constructor.name);
console.error('📋 Error code:', error.code);
console.error('📋 Error message:', error.message);
console.error('📋 Error stack:', error.stack);
```

---

## STEP 7: HOW TO CAPTURE ERROR

### Run Emulator with Debug Logs
```bash
firebase emulators:start --debug
```

### Trigger Function from Frontend
1. Open browser DevTools (F12)
2. Go to LeadFinderSettings page
3. Watch browser console for errors
4. Watch terminal for Firebase function logs

### Expected Terminal Output (Success)
```
🔍 getLeadFinderConfig called
📋 Auth context: { uid: 'user123', hasAuth: true }
🔑 UID: user123
💾 Fetching user document from collection: users
✅ User document fetch completed
📄 Document exists: true
👤 User data retrieved: { isActive: true, automationsCount: 2 }
🔧 Tools assigned: [ 'lead_finder', 'ai_lead_agent' ]
✅ Returning response: { accountActive: true, leadFinderConfigured: true, toolsAssigned: true }
```

### Expected Terminal Output (Error)
```
🔍 getLeadFinderConfig called
📋 Auth context: { uid: 'user123', hasAuth: true }
🔑 UID: user123
💾 Fetching user document from collection: users
❌ getLeadFinderConfig error: [ERROR DETAILS]
📋 Error type: [ERROR TYPE]
📋 Error code: [ERROR CODE]
📋 Error message: [ERROR MESSAGE]
📋 Error stack: [STACK TRACE]
```

---

## STEP 8: COMMON ERRORS & SOLUTIONS

### Error: "Cannot read property 'uid' of null"
**Cause**: `context.auth` is null  
**Solution**: User not authenticated or token invalid

### Error: "Cannot read property 'data' of undefined"
**Cause**: `userDoc` is undefined  
**Solution**: Firestore query failed

### Error: "db is not defined"
**Cause**: `admin.firestore()` not called  
**Solution**: Check `initializeFirebase()` is called at line 47

### Error: "Cannot read property 'includes' of undefined"
**Cause**: `userData.assignedAutomations` is undefined  
**Solution**: User document missing `assignedAutomations` field

### Error: "PERMISSION_DENIED"
**Cause**: Firestore security rules blocking access  
**Solution**: Check Firestore emulator rules

### Error: "UNAVAILABLE"
**Cause**: Firestore emulator not running  
**Solution**: Run `firebase emulators:start`

---

## STEP 9: VERIFICATION CHECKLIST

- [ ] Firebase Admin SDK initialized (`initializeFirebase()` called)
- [ ] `db` variable defined from `admin.firestore()`
- [ ] `auth` variable defined from `admin.auth()`
- [ ] Function exported correctly: `exports.getLeadFinderConfig = ...`
- [ ] Function uses `functions.https.onCall()`
- [ ] Emulator running on port 5001
- [ ] Function loaded in emulator
- [ ] User authenticated with valid token
- [ ] User document exists in Firestore
- [ ] User document has `assignedAutomations` field
- [ ] No syntax errors in function

---

## STEP 10: NEXT STEPS

1. **Run emulator**: `firebase emulators:start --debug`
2. **Trigger function**: Open LeadFinderSettings page
3. **Check terminal**: Look for debug logs
4. **Identify error**: Find the exact line that fails
5. **Report error**: Share the error message and stack trace
6. **Fix issue**: Based on error type

---

## SUMMARY

**Function**: `getLeadFinderConfig`  
**Location**: `functions/index.js:1847-1880`  
**Type**: Firebase Callable Function  
**Status**: Added comprehensive debug logging  
**Next Action**: Run emulator and capture error logs

