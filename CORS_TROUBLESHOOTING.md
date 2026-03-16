# 🚨 CORS Error Troubleshooting Guide

## Error Message

```
Access to fetch at 'http://localhost:5001/waautomation-13fa6/us-central1/getMyLeadFinderLeads' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## What This Means

The browser is blocking the request because:
1. Firebase SDK couldn't connect to the emulator properly
2. SDK fell back to making a direct HTTP request
3. Browser's CORS policy blocked the request
4. Emulator didn't respond with proper CORS headers

## Quick Fix (Try This First)

### 1. Stop Everything
```bash
# Kill all Node processes
# Windows: taskkill /F /IM node.exe
# Mac/Linux: pkill -f node
```

### 2. Clear Emulator Cache
```bash
# Remove cached emulator data
rm -rf ~/.cache/firebase/emulators
# or on Windows:
rmdir /s %USERPROFILE%\.cache\firebase\emulators
```

### 3. Clear Browser Cache
- Open DevTools (F12)
- Go to Application → Local Storage
- Delete all entries
- Go to Application → Session Storage
- Delete all entries
- Hard refresh (Ctrl+Shift+R)

### 4. Restart Everything
```bash
# Terminal 1: Start emulator
cd functions
firebase emulators:start

# Terminal 2: Start frontend
cd dashboard
npm run dev
```

### 5. Test
- Open http://localhost:5173
- Try the Lead Finder tool
- Check browser console for errors

## If Still Not Working

### Check 1: Is Emulator Running?

```bash
# Run verification script
node verify-emulator.js
```

Expected output:
```
✅ Functions Emulator: localhost:5001
✅ Firestore Emulator: 127.0.0.1:8085
✅ Auth Emulator: localhost:9100
✅ All emulators running!
```

If any show ❌, the emulator isn't running properly.

### Check 2: Is Port 5001 Blocked?

```bash
# Windows
netstat -ano | findstr :5001

# Mac/Linux
lsof -i :5001
```

If something is using port 5001:
- Kill the process
- Or change port in `firebase.json`

### Check 3: Is Frontend Connected to Emulator?

Open browser console and run:
```javascript
// Check if emulator is configured
console.log(window.location.hostname);  // Should be 'localhost'

// Check Firebase config
import { functions } from './src/services/firebase.js';
console.log(functions);  // Should show emulator connection
```

### Check 4: Verify Function Exists

In browser console:
```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from './src/services/firebase.js';

const testFunc = httpsCallable(functions, 'getMyLeadFinderLeads');
console.log(testFunc);  // Should be a function
```

### Check 5: Test Direct HTTP Request

```bash
# Test if emulator responds to HTTP
curl -X POST http://localhost:5001/waautomation-13fa6/us-central1/seedTestUser

# Should return JSON, not CORS error
```

## Common Issues & Solutions

### Issue 1: "Function does not exist"

**Cause**: Function not exported in `functions/index.js`

**Solution**:
1. Check function is exported: `exports.getMyLeadFinderLeads = ...`
2. Restart emulator after adding function
3. Verify function name matches exactly (case-sensitive)

### Issue 2: "User not authenticated"

**Cause**: Not logged in before calling function

**Solution**:
1. Log in first
2. Check auth token is valid
3. Verify auth emulator is running

### Issue 3: "Emulator not responding"

**Cause**: Emulator crashed or not started

**Solution**:
1. Check emulator logs for errors
2. Restart emulator: `firebase emulators:start`
3. Check port 5001 is not blocked

### Issue 4: "Firestore not found"

**Cause**: Firestore emulator not running

**Solution**:
1. Verify firestore emulator is running
2. Check port 8085 is correct
3. Restart emulator

## Advanced Debugging

### Enable Verbose Logging

```javascript
// In firebase.js, add:
import { enableLogging } from 'firebase/functions';
enableLogging(true);
```

### Check Network Tab

1. Open DevTools → Network tab
2. Try the function call
3. Look for the request to `localhost:5001`
4. Check response headers for CORS headers
5. Check response body for error message

### Check Emulator Logs

```bash
# Run emulator with verbose logging
firebase emulators:start --debug
```

Look for:
- Function registration messages
- Request handling logs
- Error messages

## Firestore Rules Issue

If you see "Permission denied" errors, the issue might be Firestore security rules.

**Solution**: In development, use permissive rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ⚠️ Development only!
    }
  }
}
```

Deploy to emulator:
```bash
firebase deploy --only firestore:rules
```

## Network Diagram

### Working Setup
```
Frontend (localhost:5173)
    ↓ (httpsCallable)
Firebase SDK
    ↓ (connects to emulator)
Functions Emulator (localhost:5001)
    ↓ (executes function)
Firestore Emulator (127.0.0.1:8085)
    ↓ (returns data)
Frontend (displays result)
```

### Broken Setup
```
Frontend (localhost:5173)
    ↓ (httpsCallable fails)
Firebase SDK (falls back to HTTP)
    ↓ (direct fetch)
Browser CORS Policy
    ↓ (checks headers)
Functions Emulator (responds with conflicting headers)
    ↓ (browser rejects)
❌ CORS Error
```

## Final Checklist

Before asking for help, verify:

- [ ] Emulator is running (`firebase emulators:start`)
- [ ] All 3 emulators show ✅ in logs
- [ ] Port 5001 is not blocked
- [ ] Browser cache is cleared
- [ ] Local storage is cleared
- [ ] Frontend is restarted after emulator restart
- [ ] Function is exported in `functions/index.js`
- [ ] Function name matches exactly
- [ ] User is logged in
- [ ] No typos in function names
- [ ] `connectFunctionsEmulator()` is called in frontend

## Still Not Working?

If you've tried everything above:

1. **Restart your computer** (clears all ports and processes)
2. **Check Node version**: `node --version` (should be 18+)
3. **Reinstall dependencies**: `npm install` in both `functions/` and `dashboard/`
4. **Check Firebase CLI**: `firebase --version` (should be latest)
5. **Update Firebase CLI**: `npm install -g firebase-tools@latest`

## Production Note

This CORS issue **only happens in development** with the emulator. In production:
- Firebase Cloud Functions handle CORS automatically
- No emulator configuration needed
- SDK connects directly to production endpoints
- No browser CORS policy applies

