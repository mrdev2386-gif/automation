# Firebase Emulator Setup & Troubleshooting Guide

## Understanding the Errors

Your application is experiencing multiple issues when running locally with the Firebase emulator:

### 1. **400 Bad Request Error (signInWithPassword)**
- **Location**: `http://localhost:9100/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`
- **Cause**: The test user doesn't exist in the Auth emulator, or the emulator hasn't been properly initialized
- **Solution**: Initialize test data using the provided script

### 2. **auth/user-not-found Error**
- **Cause**: Login fails because the user account doesn't exist in Firebase Auth
- **Solution**: Create test user through initialization script

### 3. **CORS Errors (No 'Access-Control-Allow-Origin' header)**
- **Location**: Requests to `http://localhost:5001/...`
- **Cause**: When using `connectFunctionsEmulator`, the Firebase SDK makes HTTP requests. These need proper CORS headers.
- **Solution**: Fixed in functions/index.js with proper CORS middleware

### 4. **FirebaseError: internal**
- **Cause**: Cascading failure from auth issues
- **Solution**: Fix auth first, then functions should work

---

## ✅ Quick Start Setup

### Step 1: Start Firebase Emulators
```bash
# Terminal 1 - Start emulators (keeps running)
firebase emulators:start
```

You should see:
```
✔  All emulators started successfully.
┌─────────────────┬──────────┬─────────────────────────────────┐
│ Emulator        │ Host:Port │ View in Emulator UI             │
├─────────────────┼──────────┼─────────────────────────────────┤
│ Authentication  │ 127.0.0.1:9100 │ http://localhost:4001        │
│ Firestore       │ 127.0.0.1:8085 │ http://localhost:4001        │
│ Functions       │ 127.0.0.1:5001 │ http://localhost:4001        │
│ Hosting         │ 127.0.0.1:5002 │ http://localhost:5002        │
└─────────────────┴──────────┴─────────────────────────────────┘
```

### Step 2: Initialize Test Data
```bash
# Terminal 2 - Initialize emulator with test user
node EMULATOR_INIT.js
```

You should see:
```
✅ Emulator initialized successfully!

Test User Credentials:
  Email: mrdev2386@gmail.com
  Password: test123456
  UID: [generated-uid]

Status:
  ✓ Auth setup: true
  ✓ Test user created: true
  ✓ Automations created: true
```

### Step 3: Start Frontend
```bash
# Terminal 3
cd dashboard
npm run dev
```

Open `http://localhost:5173` in your browser.

### Step 4: Login with Test Credentials
- **Email**: `mrdev2386@gmail.com`
- **Password**: `test123456`

---

## 🔧 Troubleshooting

### Problem: "Failed to connect to emulator"
**Solution**: Ensure Firebase emulators are running
```bash
# Check if port 5001 is accessible
netstat -ano | findstr :5001  # Windows
lsof -i :5001                 # Mac/Linux

# If not running, start emulators
firebase emulators:start
```

### Problem: "User not found" even after initialization
**Manual Fix**: 
1. Open http://localhost:4001 (Emulator UI)
2. Go to Authentication tab
3. Check if test user exists
4. If not, click "Add user" and create:
   - Email: `mrdev2386@gmail.com`
   - Password: `test123456`

### Problem: CORS errors still appearing
**Action**: 
1. Clear browser cache and local storage
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Restart frontend dev server

### Problem: "Cannot find module 'express'"
**Solution**: 
```bash
cd functions
npm install express cors
npm install
```

### Problem: Firestore data not persisting
**Solution**: Check if using Firestore emulator correctly
```javascript
// Correct: This should auto-connect to emulator
connectFirestoreEmulator(db, '127.0.0.1', 8085);

// Verify in console: "Connected to Firestore Emulator"
```

---

## 🔍 Verification Checklist

After setup, verify everything is working:

- [ ] Firebase emulators running (check http://localhost:4001)
- [ ] Test user exists (check Authentication tab in emulator UI)
- [ ] Frontend loads without errors (http://localhost:5173)
- [ ] Can login with test credentials
- [ ] Dashboard loads automations
- [ ] Can access LeadFinder tool
- [ ] No CORS warnings in console

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────┐
│   Browser (localhost:5173)          │
│   ┌──────────────────────────────┐  │
│   │ Dashboard/LeadFinder         │  │
│   │ Firebase SDK (Web)           │  │
│   └──────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────────────────────────────────┐
        │                                         │
  ┌─────▼──────────┐              ┌─────────────▼─────┐
  │ Auth Emulator  │              │ Functions Emulator│
  │ (localhost:9100)              │ (localhost:5001)  │
  │ - Sign In                      │ - getMyAutomations│
  │ - User Mgmt                    │ - Lead Finder     │
  └────────────────┘              │ - +50 Functions   │
                                  └──────────┬────────┘
                                            │
                                   ┌────────▼────────┐
                                   │ Firestore Emulator
                                   │ (localhost:8085)  │
                                   │ - Collections     │
                                   │ - Documents       │
                                   └───────────────────┘
```

---

## 🚀 Advanced: Manual Emulator Commands

### View logs
```bash
firebase emulators:start --inspect-functions
```

### Reset emulator data
```bash
firebase emulators:start --import=./firebase-data.json
firebase emulators:export ./firebase-data.json
```

### Clear all emulator data
```bash
rm -rf ~/.cache/firebase/emulators  # Mac/Linux
rmdir /s %APPDATA%\\.firebase\\emulators  # Windows
```

---

## 📞 Support

If you continue experiencing issues:

1. **Check the logs**: Look at browser console and terminal output
2. **Verify emulator ports**: 9100 (Auth), 5001 (Functions), 8085 (Firestore)
3. **Reset everything**: 
   ```bash
   firebase emulators:start --clear
   ```
4. **Check firewall**: Ensure localhost is accessible

---

## ✨ Files Modified

- `functions/index.js` - Added CORS middleware and initialization endpoints
- `dashboard/src/services/firebase.js` - Updated emulator connection
- `EMULATOR_INIT.js` - New initialization script
- `EMULATOR_TROUBLESHOOTING.md` - This file

---

**Last Updated**: March 9, 2026
