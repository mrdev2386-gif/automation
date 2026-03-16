# 🚀 Complete System Startup Guide
**WA Automation Platform - Run with Firebase Emulators**

---

## ✅ Prerequisites

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ Firebase CLI installed (`npm install -g firebase-tools`)
- ✅ Git installed
- ✅ Windows Command Prompt or PowerShell

---

## 📦 Step 1: Install All Dependencies

### Option A: Automated Setup (Recommended)

```bash
# Run the setup script
setup-complete.bat
```

This will:
1. Install all functions dependencies
2. Install all dashboard dependencies
3. Check and install Puppeteer, Cheerio, Axios

### Option B: Manual Setup

```bash
# Install functions dependencies
cd functions
npm install

# Install dashboard dependencies
cd ../dashboard
npm install

# Install required scraping dependencies
cd ../functions
npm install puppeteer cheerio axios
```

---

## 🔥 Step 2: Start Firebase Emulators

### From Project Root

```bash
firebase emulators:start
```

### Expected Output

```
✔  firestore: Emulator started at http://127.0.0.1:8085
✔  functions: Emulator started at http://127.0.0.1:5001
✔  auth: Emulator started at http://127.0.0.1:9100
✔  hosting: Emulator started at http://127.0.0.1:5002
✔  ui: Emulator UI started at http://127.0.0.1:4001

┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://127.0.0.1:4001                │
└─────────────────────────────────────────────────────────────┘
```

### Emulator Ports

| Service   | Port | URL                          |
|-----------|------|------------------------------|
| Auth      | 9100 | http://127.0.0.1:9100        |
| Firestore | 8085 | http://127.0.0.1:8085        |
| Functions | 5001 | http://127.0.0.1:5001        |
| Hosting   | 5002 | http://127.0.0.1:5002        |
| UI        | 4001 | http://127.0.0.1:4001        |

**Keep this terminal window open!**

---

## 🎨 Step 3: Start Dashboard (New Terminal)

### Open New Terminal/Command Prompt

```bash
cd dashboard
npm run dev
```

### Expected Output

```
VITE v4.5.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

**Keep this terminal window open!**

---

## 🧪 Step 4: Test the System

### 4.1 Open Browser

Navigate to: **http://localhost:5173**

### 4.2 Login/Signup

1. You'll see the login page
2. Enter any email: `test@example.com`
3. Enter any password (min 6 chars): `password123`
4. Click "Sign In"

**What Happens**:
- ✅ Email validation runs (checks format)
- ✅ Password validation runs (checks length)
- ✅ Firebase Auth attempts login
- ✅ User not found → Auto-signup creates account
- ✅ App.jsx detects new user → Auto-creates Firestore profile
- ✅ Dashboard loads with assigned tools

### 4.3 Check Emulator UI

Open: **http://127.0.0.1:4001**

**Authentication Tab**:
- You should see your test user created

**Firestore Tab**:
- Navigate to `users` collection
- You should see your user document with:
  - `email`: test@example.com
  - `role`: client_user
  - `isActive`: true
  - `assignedAutomations`: ['ai_lead_agent', 'lead_finder']

### 4.4 Test Lead Finder

1. In dashboard, click **"Lead Finder"** in sidebar
2. Enter search criteria:
   - **Niche**: `software companies`
   - **Country**: `USA`
   - **Limit**: `10` (start small for testing)
3. Click **"Start Search"**

**What Happens**:
- ✅ Creates job in `lead_finder_jobs` collection
- ✅ Discovers websites using SerpAPI (or fallback)
- ✅ Starts scraping with Puppeteer
- ✅ Extracts emails from websites
- ✅ Verifies and deduplicates emails
- ✅ Stores leads in `leads` collection
- ✅ Updates job progress in real-time

### 4.5 Monitor Progress

**In Dashboard**:
- Switch to "Jobs" tab
- You'll see job status: `queued` → `in_progress` → `completed`
- Progress shows: websites scanned, emails found

**In Emulator UI** (http://127.0.0.1:4001):
- **Firestore → lead_finder_jobs**: See job document updating
- **Firestore → leads**: See new leads being added
- **Firestore → activity_logs**: See all actions logged

**In Functions Terminal**:
```
🔍 Discovering websites for software companies in USA...
✅ Found 10 websites for software companies in USA
🚀 Browser launched with config: { proxyEnabled: false, ... }
🚀 Starting scrape for job abc123 (10 websites)
📄 Active pages: 1/3
✅ Job abc123 completed: 10 websites, 15 emails, 12 new leads
```

### 4.6 View Results

1. In dashboard, switch to **"Results"** tab
2. You'll see discovered leads with:
   - Business name
   - Website
   - Email
   - Country
   - Niche
   - Lead score
   - Status

3. Actions available:
   - Export to CSV
   - Export to JSON
   - Send to Google Sheets (webhook)
   - Delete leads

---

## 🔍 Step 5: Verify Everything Works

### Checklist

- [ ] Emulators running (all 5 services)
- [ ] Dashboard running on localhost:5173
- [ ] Can login/signup successfully
- [ ] User profile auto-created in Firestore
- [ ] Dashboard shows assigned tools
- [ ] Lead Finder page loads
- [ ] Can start a search job
- [ ] Job appears in Firestore
- [ ] Scraping starts (check terminal logs)
- [ ] Leads appear in results
- [ ] Can export leads to CSV

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'puppeteer'"

**Solution**:
```bash
cd functions
npm install puppeteer cheerio axios
```

### Issue: "Emulator already running on port 9100"

**Solution**:
```bash
# Kill existing emulators
taskkill /F /IM java.exe
# Or change ports in firebase.json
```

### Issue: "Login shows 400 Bad Request"

**Solution**: Already fixed in Login.jsx
- Validates email format before API call
- Validates password length (min 6 chars)
- Shows user-friendly error messages

### Issue: "Dashboard doesn't load after login"

**Solution**: Already fixed in App.jsx
- Auto-creates Firestore profile on first login
- Assigns default tools: ['ai_lead_agent', 'lead_finder']

### Issue: "Lead Finder shows 'Function not found'"

**Solution**:
- Ensure emulators are running
- Check Functions terminal for errors
- Verify firebase.js connects to emulators

### Issue: "Scraping fails with timeout"

**Solution**: Already implemented
- 15s timeout per page
- Tries contact pages if main page fails
- Graceful error handling

### Issue: "No websites found"

**Solution**:
- SerpAPI key not required for testing
- System uses fallback website patterns
- Try different niche/country combination

---

## 📊 System Architecture

### Running Services

```
┌─────────────────────────────────────────────────────────────┐
│                    TERMINAL 1                                │
│  Firebase Emulators (5 services)                             │
│  - Auth: 9100                                                │
│  - Firestore: 8085                                           │
│  - Functions: 5001                                           │
│  - Hosting: 5002                                             │
│  - UI: 4001                                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TERMINAL 2                                │
│  Dashboard (Vite Dev Server)                                 │
│  - http://localhost:5173                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BROWSER                                   │
│  - Dashboard: http://localhost:5173                          │
│  - Emulator UI: http://127.0.0.1:4001                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Login
   ↓
Firebase Auth Emulator (9100)
   ↓
App.jsx checks Firestore
   ↓
Firestore Emulator (8085)
   ↓
Auto-create profile if missing
   ↓
Dashboard loads

User starts Lead Finder
   ↓
Calls Cloud Function
   ↓
Functions Emulator (5001)
   ↓
leadFinderService.startAutomatedLeadFinder()
   ↓
Discovers websites (SerpAPI or fallback)
   ↓
Creates job in Firestore
   ↓
Starts scraping with Puppeteer
   ↓
Extracts emails
   ↓
Stores leads in Firestore
   ↓
Dashboard shows results
```

---

## 🎯 Next Steps

### For Development

1. **Test all features**:
   - Login/Signup
   - Lead Finder
   - AI Lead Agent
   - Settings
   - FAQs

2. **Check Firestore data**:
   - Open Emulator UI: http://127.0.0.1:4001
   - Verify collections: users, leads, lead_finder_jobs

3. **Monitor logs**:
   - Functions terminal shows scraping progress
   - Dashboard console shows API calls

### For Production

1. **Deploy Functions**:
   ```bash
   firebase deploy --only functions
   ```

2. **Deploy Hosting**:
   ```bash
   cd dashboard
   npm run build
   firebase deploy --only hosting
   ```

3. **Set Environment Variables**:
   ```bash
   firebase functions:config:set serpapi.key="your_key"
   firebase functions:config:set openai.key="your_key"
   ```

---

## 📝 Quick Reference

### Start System
```bash
# Terminal 1
firebase emulators:start

# Terminal 2
cd dashboard && npm run dev
```

### Stop System
```bash
# Terminal 1: Ctrl+C (stop emulators)
# Terminal 2: Ctrl+C (stop dashboard)
```

### Reset Emulator Data
```bash
firebase emulators:start --import=./emulator-data --export-on-exit
```

### View Logs
```bash
# Functions logs
firebase emulators:start --debug

# Dashboard logs
# Open browser console (F12)
```

---

## ✅ Success Indicators

You'll know the system is working when:

1. ✅ Both terminals show no errors
2. ✅ Dashboard loads at http://localhost:5173
3. ✅ Can login with any email/password
4. ✅ Dashboard shows "Lead Finder" and "AI Lead Agent" tools
5. ✅ Can start a Lead Finder search
6. ✅ Job appears in Emulator UI → Firestore → lead_finder_jobs
7. ✅ Functions terminal shows scraping progress
8. ✅ Leads appear in dashboard results tab
9. ✅ Can export leads to CSV

---

## 🎉 You're Ready!

The system is now fully operational with Firebase Emulators. You can:

- ✅ Test authentication flow
- ✅ Test Lead Finder end-to-end
- ✅ Test AI Lead Agent UI
- ✅ View all data in Emulator UI
- ✅ Monitor logs in real-time
- ✅ Export leads to CSV/JSON

**No production Firebase project needed for development!**

---

**Last Updated**: 2024
**System Version**: 1.0.0
**Status**: 🟢 Ready for Development
