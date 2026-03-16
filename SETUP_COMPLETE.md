# Firebase Emulator Complete Setup & Testing Guide

**Date**: March 9, 2026  
**Status**: ✅ FIXED - All errors resolved

---

## 🎯 Issues Fixed

### 1. **400 Bad Request (signInWithPassword)**
- **Root Cause**: Test user didn't exist in Auth emulator
- **Fix**: Added initialization scripts to create test user directly
- **Status**: ✅ FIXED

### 2. **auth/user-not-found Error**
- **Root Cause**: Firebase Auth was unable to find user credentials
- **Fix**: Created `EMULATOR_INIT_DIRECT.js` that uses Firebase Admin SDK to initialize Auth emulator
- **Status**: ✅ FIXED  

### 3. **CORS Errors (No 'Access-Control-Allow-Origin' header)**
- **Root Cause**: When using `connectFunctionsEmulator`, SDK makes HTTP requests that need CORS headers
- **Fix**: 
  - Added Express middleware with global CORS headers in `functions/index.js`
  - Added `disableWarnings: true` to `connectAuthEmulator` in frontend
  - Fixed CORS header includes for all OPTIONS requests
- **Status**: ✅ FIXED

### 4. **FirebaseError: internal**
- **Root Cause**: Cascading failure from auth and CORS issues
- **Fix**: All underlying causes resolved
- **Status**: ✅ FIXED

---

## ✅ Setup Verification Checklist

Your system is now properly configured. Verify each step:

- [x] Firebase Emulators running on correct ports
  - Auth: 9100
  - Functions: 5001
  - Firestore: 8085
  - Hosting: 5002

- [x] Test user created
  - Email: `mrdev2386@gmail.com`
  - Password: `test123456`
  - UID: Generated and stored in Firestore

- [x] CORS headers configured properly
  - Express middleware added
  - Options requests handled
  - Origin header set dynamically

- [x] Test automations created
  - Lead Finder
  - AI Lead Agent

---

## 🚀 Quick Start (Copy-Paste Ready)

### Terminal 1: Start Emulators
```bash
firebase emulators:start
```

### Terminal 2: Initialize (if not already done)
```bash
cd functions
node -e "
const admin = require('firebase-admin');
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9100';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';

const app = admin.initializeApp({
    projectId: 'waautomation-13fa6',
});

async function init() {
    const auth = admin.auth();
    const db = admin.firestore();
    
    const testEmail = 'mrdev2386@gmail.com';
    const testPassword = 'test123456';
    
    let userRecord;
    try {
        userRecord = await auth.getUserByEmail(testEmail);
    } catch (e) {
        userRecord = await auth.createUser({
            email: testEmail,
            password: testPassword,
            emailVerified: true
        });
    }
    
    await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: testEmail,
        role: 'client_user',
        isActive: true,
        assignedAutomations: ['lead_finder', 'ai_lead_agent'],
    }, { merge: true });
    
    console.log('✅ Test user ready. Email: ' + testEmail);
    process.exit(0);
}

init().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
"
```

### Terminal 3: Start Frontend
```bash
cd dashboard
npm run dev
```

### Browser: Login
- Open: http://localhost:5173
- Email: `mrdev2386@gmail.com`
- Password: `test123456`

---

## 🧪 Testing Scenarios

### Test 1: Login Flow
```
Expected Flow:
1. Enter email: mrdev2386@gmail.com
2. Enter password: test123456
3. Click Login
4. ✅ Should navigate to dashboard (NO 400 error, NO auth/user-not-found)
```

### Test 2: Load Automations
```
Expected Flow:
1. After login, navigate to Dashboard
2. Should display "Your Automations" section
3. Show:
   - Lead Finder card
   - AI Lead Agent card (if assigned)
4. ✅ NO CORS error in console
```

### Test 3: Lead Finder Tool
```
Expected Flow:
1. Click on "Lead Finder" automation
2. Form appears with Country and Niche fields
3. Can enter search parameters
4. Click "Start Search"
5. ✅ Job starts (NO CORS error: net::ERR_FAILED)
```

### Test 4: Fetch Data
```
Expected Flow:
1. Dashboard calls getMyAutomations function
2. Console should show successful calls
3. ✅ NO "ERR_FAILED" or CORS errors
```

---

## 🔍 Troubleshooting If Issues Persist

### Issue: Still Getting 400 Bad Request
```
Check:
1. Are emulators running? (firebase emulators:start)
2. Is Auth emulator on port 9100? (netstat -ano | findstr :9100)
3. Has initialization run? (Check step above)

Fix:
firebase emulators:start  # Restart all
```

### Issue: Still Getting CORS Errors
```
Check:
1. Browser console - look for actual error message
2. Clear cache: Ctrl+Shift+Delete
3. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)

Fix:
1. Restart frontend: npm run dev
2. Check Functions emulator logs for errors
3. Restart emulators if needed
```

### Issue: "User not found" after setup
```
Check:
1. Open http://localhost:4001 (Emulator UI)
2. Go to Authentication tab
3. Verify test user exists

Fix:
If missing, run initialization command from Terminal 2 above
```

### Issue: Frontend fails to connect
```
Check:
1. Is frontend running? (http://localhost:5173)
2. Are all 3 services running?
3. Any port conflicts?

Fix:
# Kill all and restart
Ctrl+C (stop all terminals)
firebase emulators:start  # Wait 20 seconds
cd dashboard && npm run dev
```

---

## 📊 Success Indicators

### Browser Console (Should See)
```javascript
✅ 🔧 Connected to Firebase Emulators
✅ 🔧 Functions: localhost:5001
✅ 🔧 Firestore: 127.0.0.1:8085
✅ 🔧 Auth: localhost:9100
```

### Network Tab (Should See)
```
✅ POST /v1/accounts:signInWithPassword - 200 OK
✅ POST /waautomation-13fa6/us-central1/getMyAutomations - 200 OK
NO ❌ CORS errors
NO ❌ 400 Bad Request
NO ❌ net::ERR_FAILED
```

### Dashboard Shows
```
✅ "Your Automations" section visible
✅ Lead Finder card displayed
✅ No error messages
✅ Can click on automations
```

---

## 📝 Files Modified

| File | Changes |
|------|---------|
| `functions/index.js` | Added Express middleware, global CORS headers, initialization endpoints |
| `dashboard/src/services/firebase.js` | Added `disableWarnings: true` to connectAuthEmulator |
| `functions/package.json` | Added emulator:init script |
| `EMULATOR_TROUBLESHOOTING.md` | Created comprehensive guide |
| `EMULATOR_INIT.js` | New initialization script |
| `EMULATOR_INIT_DIRECT.js` | New direct initialization (uses Admin SDK) |
| `VERIFY_SETUP.js` | New verification/health check script |
| `STARTUP_EMULATOR.bat` | New Windows startup batch script |

---

## 🎓 Key Learnings

### Why CORS Was Failing
When you use `connectFunctionsEmulator()` on the client, the Firebase SDK converts callable function calls into HTTP POST requests to the emulator. These HTTP requests require proper CORS headers, which weren't being set.

### Solution
Added Express middleware at the top of functions/index.js that:
1. Sets `Access-Control-Allow-Origin` dynamically
2. Handles OPTIONS preflight requests
3. Sets all required CORS headers

### Auth Emulator
The Auth emulator requires test data to be explicitly created. We do this using Firebase Admin SDK which has direct access to the emulator.

---

## 💡 Pro Tips

1. **Keep emulators running**: Terminal 1 should always be active
2. **Save a backup**: Export emulator data: `firebase emulators:export ./backup`
3. **Reset everything**: Run `firebase emulators:start` (clears cache between sessions)
4. **Monitor logs**: `firebase emulators:start --inspect-functions`

---

## ✨ What's Working Now

- ✅ Login with test credentials
- ✅ Dashboard loads automations
- ✅ All callable functions work (no CORS errors)
- ✅ Firestore data persists
- ✅ Auth emulator handles all operations
- ✅ Frontend communicates properly with backend

---

## 📞 Support

If you encounter new issues:
1. Check the error message in console
2. Review matching section in EMULATOR_TROUBLESHOOTING.md
3. Run VERIFY_SETUP.js to diagnose
4. Restart emulators with `firebase emulators:start`

---

**Last Updated**: March 9, 2026  
**All Fixes**: ✅ Applied and Tested
