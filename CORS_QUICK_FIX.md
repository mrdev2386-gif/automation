# CORS Fix - Quick Commands

## The Issue
CORS errors occur because Firebase callable functions need to be either deployed or running in the emulator.

---

## Solution 1: Deploy Functions (Production)

```bash
cd functions
firebase deploy --only functions
```

Wait 3-5 minutes, then refresh your dashboard at `http://localhost:5173`

---

## Solution 2: Use Emulator (Development)

### Terminal 1: Start Emulator
```bash
cd functions
firebase emulators:start
```

### Terminal 2: Start Dashboard
```bash
cd dashboard
npm run dev
```

The dashboard will automatically connect to the emulator when running on localhost.

---

## Verify Setup

Check browser console for:
```
🔧 Connected to Functions Emulator on localhost:5001
```

---

## Troubleshooting

### Still getting CORS errors?
1. Make sure functions are deployed OR emulator is running
2. Check that you're calling the correct function name
3. Verify Firebase config in `.env` file

### Emulator not starting?
```bash
# Install emulator
firebase init emulators

# Select: Functions, Firestore
```

---

**Quick Test:**
```bash
# Deploy and test
firebase deploy --only functions
```

**Status:** ✅ Ready
