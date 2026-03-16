# 🎯 EXACT ERROR CAPTURE INSTRUCTIONS

## Quick Start (5 Minutes)

### Step 1: Start Emulator
```bash
cd c:\Users\dell\WAAUTOMATION\functions
firebase emulators:start --debug
```

**Wait for output**:
```
✔  functions: Emulator started at http://localhost:5001
✔  firestore: Emulator started at http://localhost:8085
✔  auth: Emulator started at http://localhost:9100
```

### Step 2: Open Browser
- URL: `http://localhost:5173`
- Open DevTools: Press `F12`
- Go to Console tab

### Step 3: Navigate to LeadFinderSettings
- Click on "Lead Finder Settings" or navigate to `/lead-finder-settings`
- Watch both browser console and terminal

### Step 4: Capture Error
**In Terminal**, look for:
```
🔍 getLeadFinderConfig called
📋 Auth context: ...
🔑 UID: ...
💾 Fetching user document from collection: users
❌ getLeadFinderConfig error: [ERROR HERE]
📋 Error type: [TYPE HERE]
📋 Error code: [CODE HERE]
📋 Error message: [MESSAGE HERE]
📋 Error stack: [STACK HERE]
```

**In Browser Console**, look for:
```
FirebaseError: internal
```

---

## Detailed Error Capture

### Terminal Output Format

**COPY THIS ENTIRE BLOCK FROM TERMINAL**:
```
[TIMESTAMP] 🔍 getLeadFinderConfig called
[TIMESTAMP] 📋 Auth context: { uid: '...', hasAuth: true }
[TIMESTAMP] 🔑 UID: [USER_ID]
[TIMESTAMP] 💾 Fetching user document from collection: users
[TIMESTAMP] ❌ getLeadFinderConfig error: [ERROR OBJECT]
[TIMESTAMP] 📋 Error type: [ERROR_TYPE]
[TIMESTAMP] 📋 Error code: [ERROR_CODE]
[TIMESTAMP] 📋 Error message: [ERROR_MESSAGE]
[TIMESTAMP] 📋 Error stack: [ERROR_STACK_TRACE]
```

### Browser Console Format

**COPY THIS FROM BROWSER CONSOLE**:
```
FirebaseError: internal
    at new HttpsError (https://...)
    at async getLeadFinderConfig (http://localhost:5001/...)
    at async ...
```

---

## What Each Debug Log Means

| Log | Meaning | If Missing |
|-----|---------|-----------|
| `🔍 getLeadFinderConfig called` | Function was invoked | Function not called at all |
| `📋 Auth context: { uid: '...', hasAuth: true }` | User authenticated | User not authenticated |
| `🔑 UID: [ID]` | User ID extracted | Auth context is null |
| `💾 Fetching user document...` | About to query Firestore | UID extraction failed |
| `✅ User document fetch completed` | Firestore query succeeded | **FIRESTORE ERROR** |
| `📄 Document exists: true` | User document found | User document missing |
| `👤 User data retrieved: {...}` | User data parsed | Data parsing failed |
| `🔧 Tools assigned: [...]` | Tools extracted | Tools field missing |
| `✅ Returning response: {...}` | Success | Response formatting failed |
| `❌ getLeadFinderConfig error: ...` | **ERROR OCCURRED** | **CAPTURE THIS** |

---

## Error Diagnosis Guide

### If Error After "Fetching user document..."
**Problem**: Firestore query failed  
**Likely Cause**: Emulator not running or not connected  
**Solution**: 
1. Check terminal shows `✔  firestore: Emulator started at http://localhost:8085`
2. Verify no firewall blocking localhost:8085
3. Restart emulator: `firebase emulators:start --debug`

### If Error After "User data retrieved..."
**Problem**: Data parsing failed  
**Likely Cause**: User document missing required fields  
**Solution**:
1. Check user document has `assignedAutomations` field
2. Check user document has `isActive` field
3. Verify user document structure in Firestore emulator UI

### If Error "PERMISSION_DENIED"
**Problem**: Firestore security rules blocking access  
**Likely Cause**: Emulator security rules too restrictive  
**Solution**:
1. Check `firestore.rules` file
2. Verify rules allow read access to `users` collection
3. Restart emulator with fresh rules

### If Error "UNAVAILABLE"
**Problem**: Firestore emulator not reachable  
**Likely Cause**: Emulator crashed or not running  
**Solution**:
1. Stop emulator: `Ctrl+C`
2. Restart: `firebase emulators:start --debug`
3. Check no other process using port 8085

---

## Exact Error Capture Template

**Copy this template and fill in the blanks**:

```
=== ERROR CAPTURE REPORT ===

TIMESTAMP: [When error occurred]
BROWSER: [Chrome/Firefox/Safari]
OS: [Windows/Mac/Linux]

TERMINAL OUTPUT:
[PASTE ENTIRE DEBUG LOG BLOCK]

BROWSER CONSOLE OUTPUT:
[PASTE ERROR MESSAGE]

FIRESTORE EMULATOR STATUS:
- Running: [Yes/No]
- Port: [8085]
- Accessible: [Yes/No]

FUNCTIONS EMULATOR STATUS:
- Running: [Yes/No]
- Port: [5001]
- Accessible: [Yes/No]

AUTH EMULATOR STATUS:
- Running: [Yes/No]
- Port: [9100]
- Accessible: [Yes/No]

USER DOCUMENT STATUS:
- Exists: [Yes/No]
- Has assignedAutomations: [Yes/No]
- Has isActive: [Yes/No]

EXACT ERROR LINE:
[Which debug log is the last one before error?]

ERROR TYPE:
[TypeError/FirebaseError/ReferenceError/etc]

ERROR CODE:
[PERMISSION_DENIED/UNAVAILABLE/INTERNAL/etc]

ERROR MESSAGE:
[Exact error message]

STACK TRACE:
[Full stack trace]
```

---

## Common Issues & Quick Fixes

### Issue: "Cannot read property 'uid' of null"
**Fix**: User not authenticated
```bash
# Restart emulator
firebase emulators:start --debug
```

### Issue: "db is not defined"
**Fix**: Firebase not initialized
```bash
# Check functions/index.js line 47
# Should have: initializeFirebase();
```

### Issue: "Cannot read property 'includes' of undefined"
**Fix**: User document missing `assignedAutomations`
```bash
# Check Firestore emulator UI
# User document should have: assignedAutomations: [...]
```

### Issue: "PERMISSION_DENIED"
**Fix**: Firestore rules blocking access
```bash
# Check firestore.rules file
# Should allow read access to users collection
```

### Issue: "UNAVAILABLE"
**Fix**: Firestore emulator not running
```bash
# Restart emulator
firebase emulators:start --debug
```

---

## Verification Checklist Before Capture

- [ ] Emulator running: `firebase emulators:start --debug`
- [ ] Terminal shows all 3 emulators started
- [ ] Browser open to `http://localhost:5173`
- [ ] DevTools open (F12)
- [ ] Console tab active
- [ ] LeadFinderSettings page loaded
- [ ] Ready to capture error

---

## After Capturing Error

1. **Save Terminal Output**: Copy entire debug log block
2. **Save Browser Console**: Copy error message
3. **Note Exact Line**: Which debug log is last before error?
4. **Identify Error Type**: TypeError/FirebaseError/etc?
5. **Share Report**: Provide all captured information

---

## Expected Success Output

If function works correctly, you should see:
```
🔍 getLeadFinderConfig called
📋 Auth context: { uid: 'user123', hasAuth: true }
🔑 UID: user123
💾 Fetching user document from collection: users
✅ User document fetch completed
📄 Document exists: true
👤 User data retrieved: { isActive: true, automationsCount: 2 }
🔧 Tools assigned: [ 'lead_finder', 'ai_lead_agent' ]
✅ Returning response: { accountActive: true, leadFinderConfigured: true, toolsAssigned: true }
```

And in browser console: No error, just the response data.

---

## Support

If you get stuck:
1. Check this guide again
2. Verify all emulators are running
3. Check terminal for debug logs
4. Share the captured error report

