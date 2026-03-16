# Firebase Emulator Ports - Updated Configuration

## New Port Assignments

To avoid port conflicts, the Firebase emulators now use these ports:

| Service | Port | URL |
|---------|------|-----|
| **Functions** | 5001 | http://localhost:5001 |
| **Firestore** | 8085 | http://localhost:8085 |
| **Auth** | 9100 | http://localhost:9100 |
| **Hosting** | 5002 | http://localhost:5002 |
| **Emulator UI** | 4001 | http://localhost:4001 |

## Changes Made

### 1. firebase.json
```json
{
  "emulators": {
    "auth": { "port": 9100 },        // Changed from 9099
    "firestore": { "port": 8085 },   // Changed from 8080
    "functions": { "port": 5001 },   // Unchanged
    "hosting": { "port": 5002 },     // Changed from 5000
    "ui": { 
      "enabled": true,
      "port": 4001                   // Added explicit port
    }
  }
}
```

### 2. dashboard/src/services/firebase.js
- Functions emulator connection remains on port 5001
- Added console logs for all emulator ports

## How to Start

```bash
# Terminal 1: Start Firebase Emulators
cd functions
firebase emulators:start

# Terminal 2: Start Dashboard
cd dashboard
npm run dev
```

## Expected Output

When emulators start, you should see:
```
✔  functions: Emulator started at http://127.0.0.1:5001
✔  firestore: Emulator started at http://127.0.0.1:8085
✔  auth: Emulator started at http://127.0.0.1:9100
✔  hosting: Emulator started at http://127.0.0.1:5002
✔  Emulator UI running at http://127.0.0.1:4001
```

When dashboard connects, you should see in browser console:
```
🔧 Connected to Functions Emulator on localhost:5001
🔧 Auth Emulator: localhost:9100
🔧 Firestore Emulator: localhost:8085
```

## Troubleshooting

### Port Still in Use?
```bash
# Windows: Find and kill process on port
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Or change the port in firebase.json
```

### Emulator Not Connecting?
1. Verify emulators are running: http://localhost:4001
2. Check browser console for connection logs
3. Ensure dashboard is running on localhost (not 127.0.0.1)

### Functions Timeout?
- Make sure `firebase emulators:start` is running
- Check Functions Emulator logs in terminal
- Verify function exists in functions/index.js

## Quick Test

1. Start emulators
2. Start dashboard
3. Login to dashboard
4. Navigate to AI Lead Agent
5. Should load without timeout ✅

---

**Status:** ✅ Configured
**Last Updated:** 2024
