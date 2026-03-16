# CORS Fix Instructions - CRITICAL

## Problem
All HTTP endpoints return: `No 'Access-Control-Allow-Origin' header present`

## Root Cause
HTTP endpoints use cors middleware but don't set explicit headers.

## Solution
Add these 3 lines IMMEDIATELY after `return cors(req, res, async () => {` in EVERY HTTP endpoint:

```javascript
res.set("Access-Control-Allow-Origin", "*");
res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
```

## Affected Endpoints (Lines in index.js)

1. **getMyAutomationsHTTP** (Line ~4157)
2. **getLeadFinderConfigHTTP** (Line ~4092)
3. **getClientConfigHTTP** (Line ~4208)
4. **getMyLeadFinderLeadsHTTP** (Line ~4273)
5. **startLeadFinderHTTP** (Line ~4364)
6. **getLeadFinderStatusHTTP** (Line ~4419)
7. **deleteLeadFinderLeadsHTTP** (Line ~4463)

## Example Fix

### BEFORE:
```javascript
exports.getMyAutomationsHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }
        try {
```

### AFTER:
```javascript
exports.getMyAutomationsHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }
        try {
```

## CRITICAL NEXT STEP

**YOU MUST RESTART THE FIREBASE EMULATOR:**

```bash
# Stop emulator
Ctrl + C

# Restart emulator  
firebase emulators:start
```

Changes will NOT take effect until you restart!

## Verification

After restart, check DevTools Network tab:
- OPTIONS request → 204 with CORS headers
- GET/POST request → 200 with CORS headers
- Response headers include `Access-Control-Allow-Origin: *`
