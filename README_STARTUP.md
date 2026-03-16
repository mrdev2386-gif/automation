# 🚀 Lead Finder System - Local Startup Guide

## Quick Start (Automated)

### Windows
```bash
start-system.bat
```

This will automatically:
1. ✅ Install all backend dependencies
2. ✅ Start Firebase emulators
3. ✅ Start frontend dashboard
4. ✅ Open browser to http://localhost:5173

---

## Manual Startup (Step-by-Step)

### Prerequisites
- Node.js 20.x installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Redis installed (optional, for queue functionality)

---

### Step 1: Install Backend Dependencies

```bash
cd functions
npm install
```

**Verify installation:**
```bash
npm list puppeteer bullmq redis cheerio axios
```

All dependencies should show as installed:
- ✅ puppeteer@21.6.0
- ✅ bullmq@5.0.0
- ✅ redis@4.6.0
- ✅ cheerio@1.0.0-rc.12
- ✅ axios@1.6.0

---

### Step 2: Verify Services

```bash
node verify-services.js
```

**Expected output:**
```
✓ leadFinderService loaded successfully
✓ browserPoolService loaded successfully
✓ emailVerificationService loaded successfully
✓ directoryFilterService loaded successfully
✓ webhookService loaded successfully
✓ workerMonitoringService loaded successfully
✓ scraperConfigService loaded successfully
✓ leadScoringService loaded successfully

Lead Finder system successfully started.
```

---

### Step 3: Test Core Services

```bash
node test-system.js
```

**Expected output:**
```
[Test 1] Email Verification Service
  ✓ sales@company.com: Valid
  ✗ invalid-email: Invalid email format
  ✗ test@gmail.com: Personal email domain not allowed

[Test 2] Lead Scoring Service
  ✓ sales@company.com: Score 15
  ✓ info@business.com: Score 15
  ✓ support@test.com: Score 13

[Test 3] Directory Filtering Service
  ✓ https://company.com: Valid site
  ✓ https://yelp.com/biz/company: Directory (filtered)
  ✓ https://linkedin.com/company/test: Directory (filtered)

✅ All core services operational
```

---

### Step 4: Start Firebase Emulators

```bash
cd ..
firebase emulators:start
```

**Wait for:**
```
✔  firestore: Firestore Emulator running on http://localhost:8080
✔  functions: Functions Emulator running on http://localhost:5001
✔  auth: Authentication Emulator running on http://localhost:9099
✔  hosting: Hosting Emulator running on http://localhost:5000

┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
└─────────────────────────────────────────────────────────────┘
```

**Verify Lead Finder functions loaded:**
- ✅ startLeadFinder
- ✅ getLeadFinderStatus
- ✅ getMyLeadFinderLeads
- ✅ saveLeadFinderAPIKey
- ✅ getLeadFinderConfig
- ✅ getLeadFinderQueueStats
- ✅ updateScraperConfig
- ✅ saveWebhookConfig
- ✅ checkWorkerHealth
- ✅ detectTimedOutJobs

---

### Step 5: Start Frontend Dashboard

**Open new terminal:**
```bash
cd dashboard
npm install
npm run dev
```

**Expected output:**
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🧪 Test Lead Finder Workflow

### 1. Open Dashboard
```
http://localhost:5173
```

### 2. Login
- Use existing test account
- Or create new user via admin panel

### 3. Navigate to Lead Finder Settings
```
http://localhost:5173/lead-finder-settings
```

**Configure:**
- Enter SerpAPI key (optional)
- Save configuration

### 4. Start Lead Finder Job
```
http://localhost:5173/lead-finder
```

**Input:**
- Country: United States
- Niche: Software Companies
- Limit: 50

**Click:** "Start Lead Finder"

### 5. Monitor Progress
- Job appears in "Jobs" tab
- Status: queued → in_progress → completed
- Progress updates in real-time
- Results appear in "Results" tab

### 6. View Results
- Emails extracted and verified
- Lead scores calculated
- Directory sites filtered
- Business emails only

---

## 📊 Service Endpoints

### Backend (Firebase Functions)
```
Base: http://localhost:5001/[project-id]/us-central1/

Functions:
- startLeadFinder
- getLeadFinderStatus
- getMyLeadFinderLeads
- deleteLeadFinderLeads
- saveLeadFinderAPIKey
- getLeadFinderConfig
- getLeadFinderQueueStats
- updateScraperConfig
- getScraperConfig
- saveWebhookConfig
- checkWorkerHealth (scheduled)
- detectTimedOutJobs (scheduled)
```

### Frontend (Vite)
```
Base: http://localhost:5173

Routes:
- /login
- /dashboard
- /lead-finder
- /lead-finder-settings
- /results
```

### Firestore UI
```
http://localhost:4000
```

---

## ✅ Verification Checklist

### Backend Services
- [ ] Firebase emulators running
- [ ] All 10+ Lead Finder functions loaded
- [ ] Services verification passed
- [ ] Core services test passed
- [ ] No error messages in console

### Frontend Dashboard
- [ ] Dashboard accessible at http://localhost:5173
- [ ] Login page loads
- [ ] Dashboard loads after login
- [ ] Lead Finder page accessible
- [ ] Settings page accessible

### Lead Finder Features
- [ ] Email verification working
- [ ] Lead scoring calculating
- [ ] Directory filtering active
- [ ] Browser pool initialized
- [ ] Worker monitoring active
- [ ] Configuration loading

---

## 🔧 Troubleshooting

### Backend Issues

**"Cannot find module" errors:**
```bash
cd functions
rm -rf node_modules package-lock.json
npm install
```

**Emulators won't start:**
```bash
# Kill existing processes
taskkill /F /IM java.exe
taskkill /F /IM node.exe

# Restart
firebase emulators:start
```

**Puppeteer installation fails:**
```bash
# Set environment variable
set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Reinstall
npm install puppeteer --force
```

### Frontend Issues

**Port 5173 in use:**
```bash
# Use different port
npm run dev -- --port 5174
```

**Build errors:**
```bash
cd dashboard
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Redis Issues

**Redis not available:**
```
⚠ This is optional for local development
✓ System will work without Redis
✓ Jobs will process synchronously
```

**To install Redis (optional):**
- Windows: Download from https://github.com/microsoftarchive/redis/releases
- Or use Docker: `docker run -p 6379:6379 redis`

---

## 📈 System Status

### Health Check Commands

**Backend:**
```bash
curl http://localhost:5001
```

**Frontend:**
```bash
curl http://localhost:5173
```

**Firestore:**
```bash
curl http://localhost:8080
```

**All Services:**
```bash
cd functions
node verify-services.js
```

---

## 🎯 Expected Console Output

### Backend (Functions)
```
i  functions: Loaded functions definitions from source
✔  functions[startLeadFinder]: http function initialized
✔  functions[getLeadFinderStatus]: http function initialized
✔  functions[saveLeadFinderAPIKey]: http function initialized
✔  functions[getLeadFinderConfig]: http function initialized
✔  functions[getLeadFinderQueueStats]: http function initialized
✔  functions[updateScraperConfig]: http function initialized
✔  functions[saveWebhookConfig]: http function initialized
✔  functions[checkWorkerHealth]: scheduled function initialized
✔  functions[detectTimedOutJobs]: scheduled function initialized

🔧 Browser pool initialized
🔍 Worker monitoring initialized
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

## ✨ Success Indicators

### System Running Successfully:

✅ **Backend:** Firebase Functions active  
✅ **Queue:** BullMQ worker running (optional)  
✅ **Redis:** Connected (optional)  
✅ **Frontend:** Dashboard accessible  
✅ **Services:** All 10 services loaded  
✅ **Browser Pool:** Initialized (max 2 browsers)  
✅ **Worker Monitoring:** Active (60s heartbeat)  
✅ **Email Verification:** Working  
✅ **Lead Scoring:** Calculating  
✅ **Directory Filtering:** Active  

### Final Message:
```
========================================
Lead Finder system successfully started.
========================================

Backend:  http://localhost:5001
Frontend: http://localhost:5173
Firestore: http://localhost:4000

All services operational ✓
Ready for testing ✓
```

---

## 📚 Additional Resources

- **Startup Guide:** STARTUP_GUIDE.md
- **Phase 2 Summary:** LEAD_FINDER_PHASE_2_FINAL_SUMMARY.md
- **Production Optimizations:** LEAD_FINDER_PRODUCTION_OPTIMIZATIONS.md
- **Service Verification:** functions/verify-services.js
- **System Test:** functions/test-system.js

---

## 🆘 Support

If you encounter issues:

1. Run `node verify-services.js` to check service status
2. Run `node test-system.js` to test core functionality
3. Check Firebase emulator logs for errors
4. Verify all dependencies installed: `npm list`
5. Ensure ports 5173, 5001, 8080, 9099 are available

---

**Status:** Ready for Local Testing ✅  
**Version:** 2.2.0  
**Last Updated:** 2024
