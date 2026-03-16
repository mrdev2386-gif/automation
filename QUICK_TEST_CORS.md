# ⚡ Quick Test - CORS Fix

## 🚀 Test Now

```bash
# Terminal 1: Restart emulator
Ctrl+C
firebase emulators:start

# Terminal 2: Restart frontend
Ctrl+C
cd dashboard
npm run dev

# Browser
http://localhost:5173/lead-finder
```

---

## ✅ Check These

### Console (F12)
```
✅ No CORS errors
✅ No "Access-Control-Allow-Origin" errors
```

### Network Tab (F12 → Network)
```
✅ OPTIONS → 204 No Content
✅ POST/GET → 200 OK
✅ Headers include:
   - Access-Control-Allow-Origin
   - Access-Control-Allow-Methods
   - Access-Control-Allow-Headers
```

### UI
```
✅ Leads load
✅ Search works
✅ Delete works
✅ Toasts appear
```

---

## 🔧 If Still Broken

1. **Clear cache**: Ctrl+Shift+Delete
2. **Hard reload**: Ctrl+Shift+R
3. **Check emulator logs** for errors
4. **Verify token** is being sent

---

**Status**: 🟢 READY TO TEST
