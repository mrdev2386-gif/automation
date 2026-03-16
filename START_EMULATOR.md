# Fix CORS/Timeout - Start Firebase Emulator

## Problem
Dashboard gets `deadline-exceeded` timeout when calling Firebase callable functions because they're not deployed and emulator isn't running.

## Solution

### Step 1: Start Firebase Emulator

```bash
cd functions
firebase emulators:start
```

This will start:
- ✅ Functions Emulator on `localhost:5001`
- ✅ Firestore Emulator on `localhost:8080`
- ✅ Auth Emulator on `localhost:9099`

### Step 2: Start Dashboard (in new terminal)

```bash
cd dashboard
npm run dev
```

Dashboard will auto-connect to emulator (already configured in `firebase.js`):
```javascript
if (window.location.hostname === 'localhost') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

### Step 3: Test

1. Login to dashboard at `http://localhost:5173`
2. Navigate to AI Lead Agent
3. ✅ Should load without timeout

---

## Why This Works

**Callable Functions** (`https.onCall`) automatically handle:
- ✅ CORS - No manual setup needed
- ✅ Authentication - Uses Firebase Auth tokens
- ✅ JSON serialization - Automatic
- ✅ Error handling - Built-in

**No CORS package needed** - Firebase SDK handles it!

---

## Alternative: Deploy to Production

If you want to test against production:

```bash
cd functions
firebase deploy --only functions
```

Then update dashboard to use production:
```javascript
// Comment out emulator connection in firebase.js
// if (window.location.hostname === 'localhost') {
//     connectFunctionsEmulator(functions, 'localhost', 5001);
// }
```

---

## Quick Commands

```bash
# Terminal 1: Start emulator
cd c:\Users\dell\WAAUTOMATION\functions
firebase emulators:start

# Terminal 2: Start dashboard
cd c:\Users\dell\WAAUTOMATION\dashboard
npm run dev
```

---

**Status:** Ready to test
**Time:** < 1 minute to start emulator
