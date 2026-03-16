# ⚡ Quick Test Commands

## 🚀 Restart Everything

### Terminal 1: Backend
```bash
# Stop emulator
Ctrl+C

# Restart emulator
cd c:\Users\dell\WAAUTOMATION
firebase emulators:start
```

### Terminal 2: Frontend
```bash
# Stop frontend
Ctrl+C

# Restart frontend
cd c:\Users\dell\WAAUTOMATION\dashboard
npm run dev
```

---

## 🧪 Test Checklist

### 1. Dashboard Test
```
✅ Open: http://localhost:5173
✅ Login with credentials
✅ Dashboard loads
✅ Automation cards appear
✅ No CORS errors in console
```

### 2. Lead Finder Test
```
✅ Click "Lead Finder"
✅ Page loads
✅ Leads table appears (or empty state)
✅ No CORS errors in console
```

### 3. Console Check (F12)
```
✅ No red errors
✅ No "CORS policy" messages
✅ No "Access-Control-Allow-Origin" errors
✅ API calls show 200 OK
```

### 4. Network Tab Check (F12 → Network)
```
✅ getMyAutomationsHTTP → 200 OK
✅ getMyLeadFinderLeadsHTTP → 200 OK
✅ Response headers include Access-Control-Allow-Origin
```

---

## ✅ Success = All Green

If all tests pass:
- ✅ CORS issue is fixed
- ✅ Dashboard works
- ✅ Lead Finder works
- ✅ Ready for production

---

## ❌ If Still Failing

1. **Clear browser cache**: Ctrl+Shift+Delete
2. **Hard reload**: Ctrl+Shift+R
3. **Check emulator logs** for errors
4. **Verify token** is being sent in headers
5. **Check functions deployed** in emulator

---

**Status**: 🟢 READY TO TEST
