# Fix Firebase Function Timeout (deadline-exceeded)

## The Problem
`FirebaseError: deadline-exceeded` means the Cloud Function didn't respond within 60 seconds (or wasn't found).

## Root Cause
The functions exist in code but **haven't been deployed to Firebase yet**.

---

## Solution: Deploy Functions

```bash
cd functions
firebase deploy --only functions
```

Wait 3-5 minutes for deployment to complete.

---

## Verify Deployment

After deployment, check Firebase Console:
https://console.firebase.google.com/project/waautomation-13fa6/functions

You should see:
- ✅ getLeadFinderConfig
- ✅ startAILeadCampaign
- ✅ getFAQs
- ✅ All other functions

---

## Test After Deployment

1. Refresh dashboard at `http://localhost:5173`
2. Navigate to AI Lead Agent
3. Setup check should complete without timeout

---

## Alternative: Use Emulator (Development)

```bash
# Terminal 1
cd functions
firebase emulators:start

# Terminal 2  
cd dashboard
npm run dev
```

Dashboard will auto-connect to emulator on localhost.

---

**Status:** Deploy functions to fix timeout
**Command:** `firebase deploy --only functions`
