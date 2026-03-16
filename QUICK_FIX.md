# QUICK FIX - CORS ERROR

## Root Cause
Firebase SDK can't connect to emulator → falls back to HTTP → CORS blocks it

## Solution - Add Helper Function

Add this to `functions/index.js` BEFORE `getLeadFinderConfig`:

```javascript
/**
 * Helper: Check if user is active
 */
const isUserActive = async (userId) => {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        return userDoc.exists && userDoc.data().isActive === true;
    } catch {
        return false;
    }
};
```

## Test Steps

1. **Kill emulator**: `taskkill /F /IM java.exe`
2. **Start fresh**: `firebase emulators:start --only functions,firestore,auth`
3. **Check logs**: Should see emulator starting on ports 5001, 8085, 9100
4. **Test in browser**: Open http://localhost:5173
5. **Check console**: Should NOT see CORS errors

## If Still Getting CORS Error

The issue is that the callable function is being called via HTTP instead of the Firebase SDK protocol.

**Check in browser DevTools:**
- Network tab → look for POST to `getLeadFinderConfig`
- If it shows `http://localhost:5001/...` → SDK not using callable protocol
- If it shows `https://...` → SDK is working correctly

**If HTTP request:**
1. Verify `firebase.js` has emulator connection code
2. Check if `connectFunctionsEmulator` is being called
3. Verify `functions` instance is from `getFunctions(app, 'us-central1')`

## Minimal Test

In browser console:
```javascript
const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-functions.js');
const fn = httpsCallable(functions, 'getLeadFinderConfig');
fn().then(r => console.log('✅ Success:', r.data)).catch(e => console.error('❌ Error:', e));
```

If this works → SDK is connected
If this fails → Emulator not connected
