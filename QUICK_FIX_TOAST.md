# ⚡ Quick Fix Reference - Toast & Lead Finder

---

## 🎯 What Was Fixed

**Issue**: `showToast is not a function` error in LeadFinder

**Fix**: Added `showToast` method to Toast.jsx

**File Modified**: `dashboard/src/components/Toast.jsx`

---

## ✅ Verification (2 Steps)

### Step 1: Start System

```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Start dashboard
cd dashboard && npm run dev
```

### Step 2: Test Lead Finder

1. Open http://localhost:5173
2. Login: test@example.com / password123
3. Click "Lead Finder"
4. Start a search
5. **Expected**: Toast notification appears
6. **Expected**: No console errors

---

## 🔍 Console Check

**Open DevTools (F12) → Console**

### ✅ Good (No Errors)
```
🔧 Connected to Firebase Emulators
✅ Login success
✅ User authenticated
```

### ❌ Bad (If You See This)
```
Uncaught TypeError: showToast is not a function
```

**Solution**: Clear cache and hard reload (Ctrl+Shift+R)

---

## 📊 What Changed

### Toast.jsx - Added showToast Method

```javascript
// ADDED THIS:
showToast: (message, type = 'info') => {
    addToast({ type, title: message, message: '' });
}
```

### Usage in LeadFinder.jsx

```javascript
// Now works:
const { showToast } = useToast();
showToast('✅ Success!', 'success');
showToast('❌ Error!', 'error');
```

---

## 🎉 Success Indicators

- ✅ No "showToast is not a function" errors
- ✅ Toast notifications appear
- ✅ Lead Finder works end-to-end
- ✅ No CORS errors (callable functions handle automatically)

---

## 🔧 If Still Not Working

1. **Clear cache**: Ctrl+Shift+Delete
2. **Hard reload**: Ctrl+Shift+R
3. **Restart dev server**: Ctrl+C then `npm run dev`
4. **Check emulators running**: `firebase emulators:start`

---

**Status**: 🟢 FIXED  
**Version**: 1.0.2
