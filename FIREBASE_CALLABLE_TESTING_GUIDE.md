# 🧪 Firebase Callable Functions - Testing Guide

## Quick Test Steps

### 1. Clear Cache & Restart
```bash
cd dashboard
rm -rf node_modules/.vite dist
npm run dev
```

### 2. Open Browser Console
Navigate to your app and open DevTools Console (F12)

### 3. Expected Console Output

#### ✅ CORRECT (After Fix)
```
🔥 Firebase Project: waautomation-13fa6
🔥 Region: us-central1
🔥 Using production Firebase Functions (us-central1)
🔥 Project ID: waautomation-13fa6
✅ Auth state changed - User logged in: user@example.com

📞 Calling function: getLeadFinderConfig
📞 Project: waautomation-13fa6
📞 Region: us-central1
📞 Data: {}
✅ Function getLeadFinderConfig succeeded
```

#### ❌ WRONG (Before Fix)
```
⚠️ callAtURL fallback
❌ CORS error
❌ functions/not-found
❌ Failed to fetch
```

---

## Test Scenarios

### Scenario 1: Load Lead Finder Settings
1. Login to dashboard
2. Navigate to Lead Finder tool
3. Open Settings tab
4. Check console for:
   - ✅ `Calling function: getLeadFinderConfig`
   - ✅ `Function getLeadFinderConfig succeeded`
   - ❌ No CORS errors
   - ❌ No callAtURL messages

### Scenario 2: Save API Keys
1. Enter API keys in settings
2. Click Save
3. Check console for:
   - ✅ `Calling function: saveLeadFinderAPIKey`
   - ✅ `Function saveLeadFinderAPIKey succeeded`
   - ❌ No errors

### Scenario 3: Test Function
1. Open browser console
2. Run:
```javascript
// Get functions instance
const { functions } = await import('./src/services/firebase.js');
const { httpsCallable } = await import('firebase/functions');

// Call test function
const testFn = httpsCallable(functions, 'test');
const result = await testFn({});
console.log('Test result:', result.data);
```

Expected output:
```javascript
{
  ok: true,
  message: "Test function working!",
  timestamp: "2026-03-19T...",
  auth: { uid: "...", email: "..." }
}
```

---

## Troubleshooting

### Issue: Still seeing CORS errors

**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear all browser cache
3. Restart dev server
4. Check `.env` file has `VITE_USE_EMULATOR=false`

### Issue: Function not found

**Solution**:
1. Verify function is deployed:
```bash
firebase functions:list | grep getLeadFinderConfig
```

2. Check function name spelling in code

### Issue: Unauthenticated error

**Solution**:
1. Ensure user is logged in
2. Check auth token is valid
3. Verify Firebase Auth is initialized

---

## Success Criteria

✅ All tests pass  
✅ No CORS errors  
✅ No callAtURL fallback  
✅ Clean console logs  
✅ Functions execute successfully  

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally
- [ ] No console errors
- [ ] `.env` has `VITE_USE_EMULATOR=false`
- [ ] Build succeeds: `npm run build`
- [ ] Preview build works: `npm run preview`
- [ ] Firebase functions deployed: `firebase deploy --only functions`
- [ ] Frontend deployed to hosting

---

**Last Updated**: 2026-03-19
