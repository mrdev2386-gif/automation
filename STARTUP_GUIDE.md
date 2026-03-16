# Lead Finder System Startup & Verification Guide

## Quick Start

Run the automated startup script:
```bash
start-system.bat
```

This will automatically:
1. Install backend dependencies
2. Start Firebase emulators
3. Start frontend dashboard
4. Open browser to dashboard

---

## Manual Startup Steps

### Step 1: Install Backend Dependencies

```bash
cd functions
npm install
```

**Verify Required Packages:**
```bash
npm list puppeteer bullmq redis cheerio axios
```

**If missing, install:**
```bash
npm install puppeteer bullmq redis cheerio axios --save
```

---

### Step 2: Start Firebase Emulators

```bash
firebase emulators:start
```

**Expected Output:**
```
✔  functions: Loaded functions definitions from source
✔  firestore: Firestore Emulator running on http://localhost:8080
✔  functions: Functions Emulator running on http://localhost:5001
✔  auth: Authentication Emulator running on http://localhost:9099
✔  hosting: Hosting Emulator running on http://localhost:5000
```

**Verify Lead Finder Functions Loaded:**
- startLeadFinder
- getLeadFinderStatus
- getMyLeadFinderLeads
- saveLeadFinderAPIKey
- getLeadFinderConfig
- getLeadFinderQueueStats
- updateScraperConfig
- saveWebhookConfig

---

### Step 3: Verify Services

```bash
cd functions
node verify-services.js
```

**Expected Output:**
```
✓ leadFinderService loaded successfully
✓ browserPoolService loaded successfully
✓ emailVerificationService loaded successfully
✓ directoryFilterService loaded successfully
✓ webhookService loaded successfully
✓ workerMonitoringService loaded successfully
✓ scraperConfigService loaded successfully
✓ leadScoringService loaded successfully
✓ leadFinderQueueService loaded successfully
✓ leadFinderWebSearchService loaded successfully

✓ Redis connection established
✓ BullMQ queue initialized
✓ Browser pool initialized
✓ Worker monitoring initialized

Lead Finder system successfully started.
```

---

### Step 4: Start Frontend Dashboard

```bash
cd dashboard
npm install
npm run dev
```

**Expected Output:**
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## Verification Checklist

### ✅ Backend Services

- [ ] Firebase emulators running
- [ ] Firestore emulator: http://localhost:8080
- [ ] Functions emulator: http://localhost:5001
- [ ] Auth emulator: http://localhost:9099
- [ ] All Lead Finder functions loaded
- [ ] Redis connection active (optional)
- [ ] BullMQ queue initialized (optional)
- [ ] Browser pool initialized
- [ ] Worker monitoring active

### ✅ Frontend Dashboard

- [ ] Dashboard running: http://localhost:5173
- [ ] Login page accessible: http://localhost:5173/login
- [ ] Dashboard accessible: http://localhost:5173/dashboard
- [ ] Lead Finder page: http://localhost:5173/lead-finder
- [ ] Settings page: http://localhost:5173/lead-finder-settings

### ✅ Service Verification

Run verification script:
```bash
cd functions
node verify-services.js
```

Check output for:
- [ ] All 10 services loaded
- [ ] No error messages
- [ ] "Lead Finder system successfully started" message

---

## Test Lead Finder Workflow

### 1. Login
```
URL: http://localhost:5173/login
Credentials: Use test account or create new user
```

### 2. Navigate to Lead Finder Settings
```
URL: http://localhost:5173/lead-finder-settings
```

### 3. Save API Key (Optional)
```javascript
// Enter SerpAPI key for website discovery
// Or leave empty to use fallback mode
```

### 4. Start Lead Finder Job
```
URL: http://localhost:5173/lead-finder

Input:
- Country: United States
- Niche: Software Companies
- Limit: 50

Click: "Start Lead Finder"
```

### 5. Verify Job Processing
```
Expected:
✓ Job created in Firestore
✓ Job appears in Jobs tab
✓ Status: "queued" → "in_progress"
✓ Progress updates in real-time
✓ Results appear in Results tab
```

---

## Service Endpoints

### Backend (Firebase Functions)
```
Base URL: http://localhost:5001/[project-id]/us-central1/

Endpoints:
- startLeadFinder
- getLeadFinderStatus
- getMyLeadFinderLeads
- saveLeadFinderAPIKey
- getLeadFinderConfig
- getLeadFinderQueueStats
- updateScraperConfig
- saveWebhookConfig
```

### Frontend (Vite Dev Server)
```
Base URL: http://localhost:5173

Routes:
- /login
- /dashboard
- /lead-finder
- /lead-finder-settings
- /results
```

### Firestore UI
```
URL: http://localhost:4000
```

---

## Troubleshooting

### Backend Issues

**Functions not loading:**
```bash
# Check functions/index.js for syntax errors
cd functions
npm run lint

# Restart emulators
firebase emulators:start
```

**Redis connection failed:**
```
⚠ This is optional for local testing
✓ Queue will work without Redis in development
✓ Jobs will process synchronously
```

**Puppeteer installation issues:**
```bash
# Windows: Install build tools
npm install --global windows-build-tools

# Reinstall Puppeteer
npm install puppeteer --force
```

### Frontend Issues

**Port 5173 already in use:**
```bash
# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID [PID] /F

# Or use different port
npm run dev -- --port 5174
```

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## System Status Check

### Quick Health Check
```bash
# Backend
curl http://localhost:5001

# Frontend
curl http://localhost:5173

# Firestore
curl http://localhost:8080
```

### Detailed Status
```bash
# Check all services
cd functions
node verify-services.js

# Check emulator status
firebase emulators:exec "echo 'Emulators running'"
```

---

## Expected Console Output

### Backend (Firebase Functions)
```
i  functions: Loaded functions definitions from source
✔  functions[startLeadFinder]: http function initialized
✔  functions[getLeadFinderStatus]: http function initialized
✔  functions[saveLeadFinderAPIKey]: http function initialized
✔  functions[getLeadFinderConfig]: http function initialized
✔  functions[getLeadFinderQueueStats]: http function initialized
✔  functions[updateScraperConfig]: http function initialized
✔  functions[saveWebhookConfig]: http function initialized

🔧 Browser pool initialized
🔍 Worker monitoring initialized: worker_[id]
✅ Lead Finder services ready
```

### Frontend (Dashboard)
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose

✓ Dashboard loaded
✓ Routes configured
✓ Firebase initialized
✓ Authentication ready
```

---

## Final Verification

### System Components Running:

✅ **Backend:** Firebase Functions active  
✅ **Queue:** BullMQ worker running (optional)  
✅ **Redis:** Connected (optional)  
✅ **Frontend:** Dashboard accessible  
✅ **Services:** All 10 services loaded  
✅ **Browser Pool:** Initialized  
✅ **Worker Monitoring:** Active  

### Success Message:
```
========================================
Lead Finder system successfully started.
========================================

Backend:  http://localhost:5001
Frontend: http://localhost:5173
Firestore UI: http://localhost:4000

All services operational ✓
```

---

## Next Steps

1. **Open Dashboard:** http://localhost:5173
2. **Login** with test credentials
3. **Navigate to Lead Finder Settings**
4. **Configure API key** (optional)
5. **Start a test job**
6. **Monitor progress** in dashboard
7. **View results** in Results tab

---

## Support

If you encounter issues:

1. Check console output for errors
2. Run `node verify-services.js`
3. Check Firebase emulator logs
4. Verify all dependencies installed
5. Ensure ports 5173, 5001, 8080 are available

---

**Status:** Ready for Testing ✅  
**Version:** 2.2.0  
**Date:** 2024
