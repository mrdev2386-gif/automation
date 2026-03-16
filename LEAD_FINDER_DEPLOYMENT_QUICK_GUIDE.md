# Lead Finder System - Quick Deployment Guide

## 🚀 Deployment Steps

### Step 1: Deploy Cloud Functions

```bash
cd functions
firebase deploy --only functions
```

**Wait for deployment to complete** (2-5 minutes)

### Step 2: Verify Deployment

```bash
firebase functions:log --limit 50
```

**Look for:**
- ✅ Functions deployed successfully
- ✅ No deployment errors
- ✅ Worker scheduled function active

### Step 3: Test the System

#### A. Test via Dashboard

1. **Login to Dashboard**
   ```
   https://your-dashboard-url.netlify.app
   ```

2. **Navigate to Lead Finder**
   - Click "Lead Finder" in sidebar

3. **Start a Test Campaign**
   - Country: "UAE"
   - Niche: "Real Estate"
   - Limit: 50 (for quick test)
   - Click "Start Lead Collection"

4. **Monitor Progress**
   - Switch to "Jobs" tab
   - Watch progress bar update every 3 seconds
   - Check "Websites Scanned" and "Emails Found"

5. **View Results**
   - Switch to "Results" tab
   - Verify leads are displayed
   - Check statistics panel
   - Test filtering and sorting
   - Export to CSV

#### B. Test via Firebase Console

1. **Check Firestore Collections**
   ```
   - lead_finder_jobs → Should have new job
   - lead_finder_queue → Should have queue entry
   - leads → Should have extracted leads
   - activity_logs → Should have log entries
   ```

2. **Check Functions Logs**
   ```bash
   firebase functions:log --only processLeadFinderQueue
   ```
   
   **Expected Output:**
   ```
   [WORKER] Checking lead finder queue
   [WORKER] Found 1 pending job(s)
   [WORKER] Processing campaign: xxx
   Websites discovered: 50
   Scraping website: https://example.com (1/50)
   Emails extracted: 2
   Leads saved: 2
   [WORKER] Job completed: xxx
   ```

---

## 🔧 Configuration

### Configure SERP API Key (Per-User)

**Option 1: Via Dashboard**
1. Login to dashboard
2. Go to Lead Finder Settings
3. Enter SERP API key
4. Click "Save"

**Option 2: Via Firestore Console**
1. Open Firestore
2. Navigate to `lead_finder_config/{userId}`
3. Add/Update field:
   ```javascript
   {
     api_key: "your-serpapi-key-here",
     status: "active",
     daily_limit: 500
   }
   ```

### Configure Apify API Key (Optional)

**Via Firestore Console:**
1. Open Firestore
2. Navigate to `lead_finder_config/{userId}`
3. Add field:
   ```javascript
   {
     apify_api_key: "your-apify-key-here"
   }
   ```

### Configure Webhook URL (Optional)

**Via Dashboard:**
1. Go to Lead Finder Settings
2. Enter webhook URL
3. Click "Save"

**Via Firestore Console:**
1. Navigate to `lead_finder_config/{userId}`
2. Add field:
   ```javascript
   {
     webhook_url: "https://your-crm.com/webhook"
   }
   ```

---

## ✅ Verification Checklist

### Deployment Verification

- [ ] All functions deployed successfully
- [ ] No errors in deployment logs
- [ ] `processLeadFinderQueue` scheduled function active
- [ ] Dashboard accessible

### Functionality Verification

- [ ] Can start new campaign
- [ ] Job appears in "Jobs" tab
- [ ] Progress updates in real-time
- [ ] Websites are discovered (SERP API)
- [ ] Emails are extracted
- [ ] Leads appear in "Results" tab
- [ ] Statistics are calculated correctly
- [ ] Filtering works
- [ ] Sorting works
- [ ] CSV export works
- [ ] Webhook notification sent (if configured)

### Performance Verification

- [ ] Job completes within expected time (10-30 min for 500 websites)
- [ ] No memory errors
- [ ] No timeout errors
- [ ] Logs show progress

---

## 🐛 Troubleshooting

### Issue: No websites discovered

**Solution:**
1. Check SERP API key is configured
2. Verify API key is valid
3. Check API quota/limits
4. Try different niche/country

### Issue: Job stuck in "queued" status

**Solution:**
1. Check `processLeadFinderQueue` function is deployed
2. Verify scheduled function is active
3. Check function logs for errors
4. Manually trigger worker:
   ```bash
   firebase functions:shell
   > processLeadFinderQueue()
   ```

### Issue: No emails extracted

**Solution:**
1. Check websites are valid
2. Verify scraper is running (check logs)
3. Try different websites
4. Check email verification settings

### Issue: Webhook not sent

**Solution:**
1. Verify webhook URL is configured
2. Check webhook URL is accessible
3. Review webhook service logs
4. Test webhook manually:
   ```bash
   curl -X POST https://your-webhook-url \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### Issue: Apify not working

**Solution:**
1. Verify Apify API key is configured
2. Check Apify account has credits
3. Review Apify service logs
4. Apify is optional - system works without it

---

## 📊 Monitoring

### Real-Time Monitoring

**Firebase Console:**
1. Functions → Logs
2. Firestore → Collections
3. Performance → Metrics

**Dashboard:**
1. Jobs tab → Active jobs
2. Results tab → Lead statistics
3. Activity logs

### Key Metrics to Monitor

- **Job Success Rate:** Should be > 95%
- **Email Extraction Rate:** Should be 30-50%
- **Average Job Duration:** 10-30 minutes
- **Webhook Delivery Rate:** Should be 100%
- **Error Rate:** Should be < 5%

---

## 🔄 Maintenance

### Daily Tasks

- [ ] Check function logs for errors
- [ ] Monitor job completion rate
- [ ] Verify webhook deliveries
- [ ] Check API quota usage

### Weekly Tasks

- [ ] Review lead quality scores
- [ ] Analyze extraction rates
- [ ] Optimize query patterns
- [ ] Clean up old jobs (optional)

### Monthly Tasks

- [ ] Review API costs
- [ ] Analyze performance trends
- [ ] Update scraper patterns if needed
- [ ] Backup lead data

---

## 📞 Support

**Common Commands:**

```bash
# View logs
firebase functions:log

# View specific function logs
firebase functions:log --only processLeadFinderQueue

# Deploy specific function
firebase deploy --only functions:startLeadFinder

# Test function locally
firebase functions:shell
```

**Firestore Collections:**
- `lead_finder_config` - User configurations
- `lead_finder_jobs` - Job records
- `lead_finder_queue` - Queue entries
- `leads` - Extracted leads
- `activity_logs` - System logs

---

## 🎉 Success!

Your Lead Finder system is now fully deployed and operational!

**Next Steps:**
1. Configure API keys for users
2. Test with real campaigns
3. Monitor performance
4. Collect feedback
5. Optimize as needed

---

**Status:** ✅ **DEPLOYED**

**Version:** 2.0.0

**Last Updated:** 2024
