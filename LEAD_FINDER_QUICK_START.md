# Lead Finder Tool - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### What You'll Do

1. Install dependencies
2. Deploy to Firebase
3. Create the automation record
4. Assign to a test user
5. Test the tool

### Requirements

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Access to Firebase project
- A test account ready

---

## Step 1: Install Dependencies (1 minute)

```bash
cd functions
npm install
```

Expected output:
- ✅ Puppeteer installed
- ✅ Cheerio installed
- ✅ Other dependencies updated

---

## Step 2: Deploy Cloud Functions (2 minutes)

```bash
firebase deploy --only functions
```

Monitor deployment:
```bash
firebase functions:list
```

Expected to see these 6 new functions:
- ✅ `startLeadFinder`
- ✅ `getLeadFinderStatus`
- ✅ `getMyLeadFinderLeads`
- ✅ `deleteLeadFinderLeads`
- ✅ `submitWebsitesForScraping`
- ✅ `ensureLeadFinderAutomation`

---

## Step 3: Initialize the Automation (30 seconds)

**Option A - Run Script:**
```bash
cd functions
node src/scripts/initializeSystem.js
```

You should see:
```
✅ Created automation: Lead Finder (lead_finder)
📊 Initialization complete: 1 created, 0 skipped
✨ System initialization complete!
```

**Option B - Call Function:**
```bash
firebase functions:call ensureLeadFinderAutomation
```

---

## Step 4: Deploy Frontend (1 minute)

```bash
cd dashboard
npm run build
firebase deploy --only hosting
```

The updated dashboard with Lead Finder UI is now live!

---

## Step 5: Assign to Test User (30 seconds)

### Via Admin Panel:

1. Open admin panel (`/admin`)
2. Go to Users
3. Find a test user
4. Click Edit
5. In "Assigned Tools" → Select "Lead Finder"
6. Click Save

### Or Create a New Test User:

1. Click "Add User"
2. Email: `leadfinder-test@example.com`
3. Password: Temporary strong password
4. Role: `client_user`
5. Assigned Tools: ✅ Check "Lead Finder"
6. Click Create

---

## Step 6: Test the Feature (2-3 minutes)

### A. Login as Test User

1. Go to login page
2. Enter test user credentials
3. Click Login

### B. Verify Sidebar

You should see:
- ✅ "Lead Finder" in sidebar
- ✅ Search icon next to it
- ✅ "Find Business Emails" description

### C. Click Lead Finder

You should see:
- ✅ "New Search" tab
- ✅ Form with Country, Niche fields
- ✅ Leads Limit selector (default 500)

### D. Create a Test Job

1. **Country:** `United States`
2. **Niche:** `Software`
3. Click "Start Lead Collection"

You should see:
- ✅ Job ID returned
- ✅ Redirected to "Jobs" tab
- ✅ Current job displayed with status

### E. Add Test Websites

Copy-paste these websites:
```
https://www.google.com
https://www.microsoft.com
https://www.github.com
https://www.stackoverflow.com
https://www.wikipedia.org
```

1. Paste first URL in input field
2. Click Add button (+)
3. Repeat for all 5
4. You should see all 5 listed

### F. Start Scraping

1. Click "Start Scraping (5 websites)"
2. System processes websites...
3. You should see progress updating:
   - Websites Scanned: 0 → 5
   - Emails Found: 0 → X

### G. View Results

Once scraping completes:
1. Click "Results" tab
2. You should see a table with extracted emails
3. Columns: Business Name, Email, Website, Country, Niche

### H. Test CSV Download

1. Click "Download CSV"
2. File downloaded: `leads-YYYY-MM-DD.csv`
3. Open in Excel/Sheets
4. Verify columns and data

### I. Test Deletion

1. Click checkbox next to a lead
2. Click "Delete (1)"
3. Confirm deletion
4. Lead removed from table

---

## ✅ Verification Checklist

- [ ] Dependencies installed without errors
- [ ] Functions deployed successfully
- [ ] Lead Finder automation created in database
- [ ] Test user assigned "Lead Finder" tool
- [ ] User sees "Lead Finder" in sidebar
- [ ] Can navigate to Lead Finder page
- [ ] Form submits and creates job
- [ ] Can add websites to job
- [ ] Scraping starts and shows progress
- [ ] Results display in table
- [ ] CSV download works
- [ ] Delete functionality works
- [ ] No error messages in console

---

## 🔍 What's Happening Behind the Scenes

1. **User logs in**
   - Firebase Auth verifies credentials
   - App loads user profile from Firestore
   - Checks `assignedAutomations` array
   - If "lead_finder" present → show in sidebar

2. **User submits search form**
   - Frontend calls `startLeadFinder()` Cloud Function
   - Backend creates job record in `lead_finder_jobs` collection
   - Returns job ID

3. **User submits websites**
   - Frontend calls `submitWebsitesForScraping()` 
   - Backend launches Puppeteer browser
   - Scrapes each website with 2-second delay between
   - Uses Cheerio to parse HTML
   - Regex extracts emails
   - Stores results in `leads` collection
   - Updates job progress in real-time

4. **Frontend polls for status**
   - Every 3 seconds, calls `getLeadFinderStatus()`
   - Gets current progress and results
   - Updates UI in real-time
   - Shows progress bar and stats

5. **User views results**
   - Frontend calls `getMyLeadFinderLeads()`
   - Backend returns all user's leads
   - Displays in table with email links

---

## 🐛 Troubleshooting

### "Lead Finder tool not assigned"
**✓ Solution:** Admin needs to assign the tool to your user account

### "No automations assigned"
**✓ Solution:** Check user record in Firestore:
```
users collection
→ find your user ID
→ check assignedAutomations array
→ must contain "lead_finder"
```

### Websites not scraping
**✓ Solution:** 
- Verify URLs are valid (include `https://`)
- Check Firebase logs for errors
- Some websites may block Puppeteer

### No emails found
**✓ Solution:**
- Some websites don't have visible contact emails
- Check if website has /contact or /about pages
- Review website source code for emails

### Functions failing
**✓ Solution:**
- Check Firebase Console → Cloud Functions → Logs
- Reinstall dependencies: `npm install`
- Ensure Puppeteer version compatible

---

## 📊 What Gets Stored

### In Firebase (Firestore):

**lead_finder_jobs collection:**
- Job ID, user ID, country, niche
- Current progress (websites scanned, emails found)
- Job status (in_progress, completed, failed)

**leads collection:**
- Business name, website, email
- Country, niche, user association
- Timestamps for tracking

**activity_logs collection:**
- Record of "LEAD_FINDER_STARTED", etc.
- For audit trail

---

## 🎯 Next Steps

Once working:

1. **Configure Search Queries**
   - Edit `functions/src/services/leadFinderService.js`
   - Customize SEARCH_QUERIES_PER_NICHE for your niches

2. **Integrate Search API**
   - Currently uses manual website input
   - Can integrate Google/Bing/SerpAPI for automatic website discovery

3. **Add Email Verification**
   - Verify emails are valid before storing
   - Remove invalid entries

4. **Scale for Production**
   - Monitor Firestore costs
   - Optimize for high-volume usage
   - Add additional rate limiting if needed

---

## 📚 Full Documentation

For more details:
- [LEAD_FINDER_IMPLEMENTATION_SUMMARY.md](LEAD_FINDER_IMPLEMENTATION_SUMMARY.md) - Complete overview
- [LEAD_FINDER_DATABASE_SCHEMA.md](LEAD_FINDER_DATABASE_SCHEMA.md) - Database structure
- [LEAD_FINDER_DEPLOYMENT_GUIDE.md](LEAD_FINDER_DEPLOYMENT_GUIDE.md) - Production deployment

---

## 💡 Tips

- Start with small batches (5-10 websites) to test
- Use common websites (Google, GitHub, etc.) for initial test
- Monitor Cloud Functions logs while scraping
- Check Firestore to see leads being created
- Use CSV export to import into CRM/email tools

---

## ⏱️ Timing

- Job setup: ~30 seconds
- Website scraping: ~2-3 seconds per URL
- 10 websites: ~20-30 seconds total
- 100 websites: ~3-5 minutes
- 500 websites: ~15-25 minutes

---

**You're all set! 🎉 Lead Finder is now ready to use.**

Questions? Check the detailed documentation or review Firebase Console logs for diagnostic info.
