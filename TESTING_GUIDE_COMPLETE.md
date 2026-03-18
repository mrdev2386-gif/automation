# 🧪 FIREBASE FUNCTIONS TESTING GUIDE

## 🎯 OBJECTIVE
Verify that all Firebase callable functions are working correctly after cleanup and backend fixes.

---

## 📋 PRE-TESTING CHECKLIST

Before running tests, ensure:
- [ ] Backend cleanup completed
- [ ] Backend fixes applied
- [ ] Functions deployed: `firebase deploy --only functions`
- [ ] User logged in (for frontend tests)
- [ ] Firebase Console accessible

---

## 🧪 TEST SUITE 1: BACKEND STRUCTURE TEST

### Purpose
Verify that backend code structure is correct before deployment.

### Run Command
```bash
cd functions
node test-functions-backend.js
```

### Expected Results
```
✅ index.js loads successfully
✅ All critical functions exist
✅ No duplicate exports
✅ All exports are valid functions
✅ All modules load correctly
✅ No old/duplicate files found
```

### What It Tests
1. ✅ index.js loads without errors
2. ✅ All 68 functions are exported
3. ✅ No duplicate exports
4. ✅ Critical functions exist:
   - test
   - createUser
   - getAllUsers
   - getMyAutomations
   - getLeadFinderConfig
   - saveLeadFinderAPIKey
   - ensureLeadFinderAutomation
5. ✅ Individual modules load correctly
6. ✅ No old/duplicate files remain

### If Tests Fail
1. Check error messages
2. Verify all files exist
3. Run `npm install` in functions/
4. Check for syntax errors
5. Review cleanup was successful

---

## 🧪 TEST SUITE 2: RUNTIME FUNCTION TEST

### Purpose
Verify that deployed functions execute correctly in production.

### Setup
1. Deploy functions: `firebase deploy --only functions`
2. Open dashboard in browser
3. Login as a user
4. Open browser DevTools console

### Run Command
```javascript
// Copy and paste into browser console
// Or load the test file
const script = document.createElement('script');
script.src = '/test-firebase-functions.js';
document.head.appendChild(script);
```

Or manually run:
```javascript
runFirebaseFunctionsTest();
```

### Expected Results
```
✅ test function
✅ getAllUsers function
✅ getMyAutomations function
✅ getLeadFinderConfig function
✅ ensureLeadFinderAutomation function
```

### What It Tests

#### STEP 1: Basic Function (test)
```javascript
await callFunction('test', { message: 'hello' });
```
**Expected**: `{ ok: true, message: 'Test function working!', ... }`
**Checks**: Basic connectivity, no crashes

#### STEP 2: Simple Read (getAllUsers)
```javascript
await callFunction('getAllUsers');
```
**Expected**: `{ users: [...] }` or `permission-denied` (if not admin)
**Checks**: No "internal" error, proper response

#### STEP 3: User Automations (getMyAutomations)
```javascript
await callFunction('getMyAutomations');
```
**Expected**: `{ automations: [...] }`
**Checks**: No crash, no fallback, proper data

#### STEP 4: Lead Finder Config (getLeadFinderConfig)
```javascript
await callFunction('getLeadFinderConfig');
```
**Expected**: `{ leadFinderConfigured: false, ... }`
**Checks**: Function exists, no duplicate, proper response

#### STEP 5: Ensure Automation (ensureLeadFinderAutomation)
```javascript
await callFunction('ensureLeadFinderAutomation', { enabled: true });
```
**Expected**: `{ success: true, status: 'exists' or 'created' }`
**Checks**: No crash, automation created/verified

### If Tests Fail

#### "internal" Error
- Backend is crashing
- Check Firebase Console logs
- Review error stack traces
- Verify Firestore rules

#### "unauthenticated" Error
- User not logged in
- Token expired
- Re-login and try again

#### "permission-denied" Error
- Expected for non-admin on getAllUsers
- Check user role in Firestore
- Verify security rules

#### CORS Error
- Should NOT happen with httpsCallable
- Check Network tab
- Verify using Firebase SDK, not fetch

---

## 🧪 TEST SUITE 3: NETWORK VERIFICATION

### Purpose
Verify that calls are using Firebase SDK, not direct HTTP.

### Steps

1. **Open DevTools**
   - Press F12
   - Go to Network tab
   - Clear existing requests

2. **Run a Function**
   ```javascript
   await callFunction('test');
   ```

3. **Check Network Tab**
   
   **✅ CORRECT (Firebase SDK)**:
   ```
   Request URL: https://firebaseapp.com/...
   Method: POST
   Status: 200
   No CORS errors
   ```

   **❌ WRONG (Direct HTTP)**:
   ```
   Request URL: https://us-central1-project.cloudfunctions.net/...
   CORS error
   callAtURL fallback
   ```

4. **Verify**
   - ✅ No cloudfunctions.net calls
   - ✅ Only firebaseapp.com calls
   - ✅ No CORS errors
   - ✅ No "callAtURL" in console

---

## 🧪 TEST SUITE 4: FIREBASE CONSOLE LOGS

### Purpose
Verify functions are executing and logging correctly.

### Steps

1. **View Recent Logs**
   ```bash
   firebase functions:log
   ```

2. **View Specific Function**
   ```bash
   firebase functions:log --only test
   firebase functions:log --only getAllUsers
   firebase functions:log --only getLeadFinderConfig
   ```

3. **Check for**
   - ✅ Function execution logs
   - ✅ Entry logs (e.g., "🧪 TEST FUNCTION CALLED")
   - ✅ Success logs
   - ❌ No uncaught errors
   - ❌ No stack traces

### Expected Log Output

**test function**:
```
🧪 TEST FUNCTION CALLED
Auth: Authenticated
Data: { message: 'hello' }
```

**getLeadFinderConfig**:
```
🔥 FUNCTION STARTED: getLeadFinderConfig
📥 INPUT: {}
👤 USER: abc123...
✅ Authentication validated
📦 STEP 2: Reading Lead Finder configuration...
✅ Configuration loaded successfully
🎉 FUNCTION COMPLETED SUCCESSFULLY
```

### If Logs Show Errors

1. **"permission-denied"**
   - Check Firestore rules
   - Verify user authentication
   - Check user role

2. **"internal"**
   - Backend crash
   - Check stack trace
   - Review function code
   - Check dependencies

3. **No logs appear**
   - Function not deployed
   - Wrong function name
   - Deployment failed

---

## 🧪 TEST SUITE 5: INTEGRATION TEST

### Purpose
Test complete user workflow end-to-end.

### Test Scenario: Admin Creates User

1. **Login as super_admin**
   ```javascript
   // Email: cryptosourav23@gmail.com
   // Password: Agen@2025$$
   ```

2. **Get All Users**
   ```javascript
   const users = await callFunction('getAllUsers');
   console.log('Users:', users);
   ```

3. **Create Test User**
   ```javascript
   const result = await callFunction('createUser', {
       email: 'test@example.com',
       password: 'Test@123',
       role: 'client_user',
       assignedAutomations: ['lead_finder']
   });
   console.log('Created:', result);
   ```

4. **Verify User Created**
   ```javascript
   const users = await callFunction('getAllUsers');
   const testUser = users.users.find(u => u.email === 'test@example.com');
   console.log('Test user:', testUser);
   ```

### Expected Results
- ✅ No errors
- ✅ User created successfully
- ✅ User appears in getAllUsers
- ✅ Assigned automations saved

---

## 📊 FINAL VERDICT CRITERIA

### ✅ ALL TESTS PASS = BACKEND WORKING

**Criteria**:
- ✅ Backend structure test: 100% pass
- ✅ Runtime function test: All functions work
- ✅ Network verification: Using Firebase SDK
- ✅ Console logs: No errors
- ✅ Integration test: Complete workflow works

**Verdict**: 🎉 BACKEND STABLE - READY FOR PRODUCTION

### ❌ ANY TEST FAILS = BACKEND ISSUES

**Criteria**:
- ❌ Backend structure test: Failures
- ❌ Runtime function test: "internal" errors
- ❌ Network verification: CORS errors
- ❌ Console logs: Uncaught errors
- ❌ Integration test: Workflow broken

**Verdict**: ⚠️ BACKEND HAS ISSUES - NEEDS DEBUGGING

---

## 🎯 QUICK TEST COMMANDS

### Backend Structure
```bash
cd functions
node test-functions-backend.js
```

### Deploy Functions
```bash
firebase deploy --only functions
```

### View Logs
```bash
firebase functions:log
```

### Frontend Runtime Test
```javascript
// In browser console after login
runFirebaseFunctionsTest();
```

---

## 📋 TEST CHECKLIST

### Pre-Deployment
- [ ] Backend structure test passes
- [ ] All modules load correctly
- [ ] No duplicate exports
- [ ] No old files remaining

### Post-Deployment
- [ ] test function works
- [ ] getAllUsers works (or permission-denied)
- [ ] getMyAutomations works
- [ ] getLeadFinderConfig works
- [ ] ensureLeadFinderAutomation works
- [ ] No CORS errors
- [ ] No "internal" errors
- [ ] Logs show successful execution

### Network Verification
- [ ] Using Firebase SDK (firebaseapp.com)
- [ ] No direct cloudfunctions.net calls
- [ ] No CORS errors
- [ ] No callAtURL fallback

### Integration Test
- [ ] Admin can create users
- [ ] Users can login
- [ ] Users can access assigned tools
- [ ] Complete workflow works

---

## 🎉 SUCCESS CRITERIA

**Backend is considered WORKING when**:
1. ✅ All backend structure tests pass
2. ✅ All runtime function tests pass
3. ✅ Network calls use Firebase SDK
4. ✅ No CORS errors
5. ✅ No "internal" errors
6. ✅ Logs show successful execution
7. ✅ Integration test completes

**Status**: READY FOR PRODUCTION ✅

---

## 🆘 TROUBLESHOOTING

### Issue: "internal" Error
**Solution**:
1. Check Firebase Console logs
2. Look for stack traces
3. Verify Firestore rules
4. Check function code

### Issue: CORS Error
**Solution**:
1. Verify using httpsCallable
2. Check firebase.js implementation
3. Ensure not using fetch()
4. Redeploy functions

### Issue: "unauthenticated"
**Solution**:
1. Verify user is logged in
2. Check auth token
3. Re-login
4. Check Firebase Auth

### Issue: No Logs
**Solution**:
1. Verify deployment succeeded
2. Check function name
3. Wait a few minutes
4. Try: firebase functions:log --limit 50

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Ready for Testing
