# 🔧 Firebase Emulator CORS Issue - Complete Fix

## Problem

Firebase SDK's `httpsCallable()` is still getting CORS errors when calling functions through the emulator. This happens because:

1. The emulator isn't properly responding to preflight requests
2. The SDK is falling back to HTTP instead of using the callable protocol
3. CORS headers are missing or conflicting

## Root Cause

When `httpsCallable()` fails to connect properly, it falls back to making direct HTTP requests, which then trigger CORS policy checks.

## Solution

### Step 1: Verify Emulator is Running

```bash
firebase emulators:start
```

Expected output:
```
✔ functions: Emulator started at http://localhost:5001
✔ firestore: Emulator started at http://127.0.0.1:8085
✔ auth: Emulator started at http://localhost:9100
```

### Step 2: Check Firebase Configuration

Ensure `firebase.json` has correct emulator ports:

```json
{
  "emulators": {
    "auth": { "port": 9100 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8085 },
    "hosting": { "port": 5002 }
  }
}
```

### Step 3: Verify Frontend Configuration

File: `dashboard/src/services/firebase.js`

```javascript
const functions = getFunctions(app, 'us-central1');

if (window.location.hostname === 'localhost') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
    connectAuthEmulator(auth, 'http://localhost:9100');
    console.log('✅ Connected to Firebase Emulators');
}
```

### Step 4: Clear Browser Cache

The browser may be caching CORS errors. Clear:
1. Browser cache (Ctrl+Shift+Delete)
2. Local storage (DevTools → Application → Local Storage → Clear All)
3. Session storage

### Step 5: Restart Everything

```bash
# Kill all processes
# Windows: taskkill /F /IM node.exe

# Clear emulator data
rm -rf ~/.cache/firebase/emulators

# Restart emulator
firebase emulators:start

# In another terminal, restart frontend
cd dashboard
npm run dev
```

### Step 6: Test Connection

In browser console:

```javascript
// Test if emulator is reachable
fetch('http://localhost:5001/waautomation-13fa6/us-central1/seedTestUser')
    .then(r => r.json())
    .then(console.log)
    .catch(console.error);
```

Expected: Should work without CORS errors

## Why Callable Functions Don't Need CORS

Firebase callable functions use a special protocol that:
- Doesn't require CORS headers
- Handles authentication automatically
- Uses the Firebase SDK's internal communication

When CORS errors appear with `httpsCallable()`, it means:
- The SDK couldn't connect to the emulator properly
- It's falling back to HTTP requests
- The fallback triggers browser CORS policy

## Troubleshooting

### Issue: "No 'Access-Control-Allow-Origin' header"

**Cause**: Emulator not responding to preflight requests

**Fix**:
1. Verify emulator is running: `firebase emulators:start`
2. Check port 5001 is not blocked
3. Restart emulator

### Issue: "Function does not exist"

**Cause**: SDK can't find the function in emulator

**Fix**:
1. Verify function is exported in `functions/index.js`
2. Check function name matches exactly
3. Restart emulator after code changes

### Issue: "User not authenticated"

**Cause**: Auth emulator not connected

**Fix**:
1. Ensure `connectAuthEmulator()` is called
2. Check auth port 9100 is correct
3. Verify user is logged in before calling function

## Network Flow (Correct)

```
Frontend (localhost:5173)
    ↓
httpsCallable(functions, 'getMyLeadFinderLeads')()
    ↓
Firebase SDK connects to emulator
    ↓
Emulator at localhost:5001
    ↓
Function executes
    ↓
✅ Response returned
```

## Network Flow (Broken - Current)

```
Frontend (localhost:5173)
    ↓
httpsCallable() fails to connect
    ↓
SDK falls back to HTTP fetch
    ↓
Browser CORS policy check
    ↓
Emulator responds with conflicting headers
    ↓
Browser rejects response
    ↓
❌ CORS error
```

## Quick Checklist

- [ ] Emulator is running (`firebase emulators:start`)
- [ ] Port 5001 is not blocked
- [ ] `connectFunctionsEmulator()` is called in frontend
- [ ] Browser cache is cleared
- [ ] Function is exported in `functions/index.js`
- [ ] Function name matches exactly
- [ ] User is authenticated before calling function
- [ ] No typos in function names

## If Still Not Working

1. **Check emulator logs** for errors
2. **Verify network connectivity** between frontend and emulator
3. **Test with curl**:
   ```bash
   curl -X POST http://localhost:5001/waautomation-13fa6/us-central1/seedTestUser
   ```
4. **Check firewall** isn't blocking port 5001
5. **Try different port** if 5001 is in use

## Production Note

In production, CORS headers are NOT needed because:
- Firebase Cloud Functions handle CORS automatically
- The SDK connects directly to the function endpoint
- No browser CORS policy applies to server-to-server communication

The CORS issue only appears in development with the emulator when the SDK can't connect properly.

