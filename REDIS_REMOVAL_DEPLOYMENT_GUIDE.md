# Redis/BullMQ Removal - Deployment Guide

**Status**: Ready for Production  
**Risk Level**: Low (Firestore-only, no external dependencies)  
**Estimated Deployment Time**: 5-10 minutes  

---

## Pre-Deployment Verification

### Step 1: Verify Code Changes

```bash
# Navigate to functions directory
cd functions

# Check for any Redis references
grep -r "redis" src/ || echo "✅ No redis references found"
grep -r "bullmq" src/ || echo "✅ No bullmq references found"
grep -r "bull" src/ || echo "✅ No bull references found"
grep -r "ioredis" src/ || echo "✅ No ioredis references found"
```

### Step 2: Verify Dependencies

```bash
# Check package.json
cat package.json | grep -E "redis|bullmq|bull|ioredis" || echo "✅ No Redis packages in dependencies"

# Verify required packages are present
npm list firebase-admin firebase-functions puppeteer cheerio axios
```

### Step 3: Verify Firestore Configuration

```bash
# Check that Firestore is initialized in index.js
grep -n "admin.firestore()" functions/index.js

# Expected output: Multiple references to admin.firestore()
```

---

## Local Testing

### Step 1: Install Dependencies

```bash
cd functions
npm install
```

### Step 2: Start Firebase Emulator

```bash
# In one terminal
firebase emulators:start --only functions,firestore

# Expected output:
# ✔  functions: http://localhost:5001
# ✔  firestore: http://localhost:8080
```

### Step 3: Test Health Check

```bash
# In another terminal, test the health check function
curl -X POST http://localhost:5001/wa-automation-prod/us-central1/testHealthCheck \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
# {
#   "healthy": true,
#   "checks": {
#     "firestore": true,
#     "queue": true
#   },
#   "errors": []
# }
```

### Step 4: Test Queue Operations

```bash
# Test adding a job to queue
curl -X POST http://localhost:5001/wa-automation-prod/us-central1/testQueueJob \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-job-123",
    "userId": "test-user-123",
    "websites": ["example.com"],
    "country": "US",
    "niche": "SaaS"
  }'

# Expected response:
# {
#   "success": true,
#   "queueId": "...",
#   "message": "Job queued successfully"
# }
```

### Step 5: Test Lead Finder Job

```bash
# Test starting a Lead Finder job
curl -X POST http://localhost:5001/wa-automation-prod/us-central1/startLeadFinder \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "country": "US",
    "niche": "SaaS",
    "limit": 10
  }'

# Expected response:
# {
#   "jobId": "...",
#   "status": "queued",
#   "websitesDiscovered": N,
#   "message": "🚀 Lead Finder job started..."
# }
```

---

## Production Deployment

### Step 1: Pre-Deployment Checklist

- [ ] All local tests passed
- [ ] No Redis/BullMQ references in code
- [ ] No Redis packages in package.json
- [ ] Firestore is initialized
- [ ] Cloud Functions are configured
- [ ] Firebase project is set up
- [ ] Backup of current functions created

### Step 2: Create Backup

```bash
# Export current functions (optional but recommended)
firebase functions:config:get > functions-backup.json

# Or use Firebase Console to download current code
```

### Step 3: Deploy Functions

```bash
# Navigate to functions directory
cd functions

# Deploy only functions (not hosting)
firebase deploy --only functions

# Expected output:
# ✔  functions[processLeadFinderQueue]: Successful update operation.
# ✔  functions[startAILeadCampaign]: Successful update operation.
# ✔  functions[startLeadFinder]: Successful update operation.
# ... (other functions)
# 
# Deployment complete!
```

### Step 4: Verify Deployment

```bash
# Check function logs
firebase functions:log

# Expected: No Redis connection errors
# Look for: "✅ Firestore queue ready"
# Look for: "System healthy: Firestore connection verified"
```

### Step 5: Monitor for Errors

```bash
# Watch logs in real-time
firebase functions:log --follow

# Or check Firebase Console:
# 1. Go to Cloud Functions
# 2. Click on each function
# 3. Check "Logs" tab for errors
```

---

## Post-Deployment Verification

### Step 1: Verify Health Check

```bash
# Call health check endpoint
curl -X POST https://us-central1-wa-automation-prod.cloudfunctions.net/checkSystemHealth \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
# {
#   "healthy": true,
#   "checks": {
#     "firestore": true,
#     "queue": true
#   },
#   "errors": []
# }
```

### Step 2: Verify Queue Operations

```bash
# Check queue stats
curl -X POST https://us-central1-wa-automation-prod.cloudfunctions.net/getQueueStats \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
# {
#   "pending": 0,
#   "processing": 0,
#   "completed": 0,
#   "failed": 0,
#   "total": 0
# }
```

### Step 3: Test Lead Finder Job

```bash
# Start a test Lead Finder job
curl -X POST https://us-central1-wa-automation-prod.cloudfunctions.net/startLeadFinder \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "country": "US",
    "niche": "SaaS",
    "limit": 10
  }'

# Expected: Job created and queued successfully
```

### Step 4: Monitor Firestore

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Check collections:
   - `lead_finder_queue` - Should show queued jobs
   - `lead_finder_jobs` - Should show job details
   - `leads` - Should show extracted leads
4. Verify no errors in collection access

### Step 5: Check Cloud Functions Logs

1. Go to Firebase Console
2. Navigate to Cloud Functions
3. For each function, check:
   - **Logs**: No Redis connection errors
   - **Metrics**: Normal execution time
   - **Errors**: Should be zero or minimal

---

## Rollback Plan

If issues occur after deployment:

### Step 1: Identify Issue

```bash
# Check logs for errors
firebase functions:log

# Look for:
# - "Redis is not a constructor"
# - "Firestore connection failed"
# - "Queue operation failed"
```

### Step 2: Rollback to Previous Version

```bash
# Option 1: Revert to previous commit
git revert HEAD
firebase deploy --only functions

# Option 2: Restore from backup
# Use Firebase Console to restore previous version
# Or redeploy from previous code commit
```

### Step 3: Verify Rollback

```bash
# Check that functions are working
firebase functions:log

# Test health check
curl -X POST https://us-central1-wa-automation-prod.cloudfunctions.net/checkSystemHealth \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Troubleshooting

### Issue: "Firestore connection failed"

**Symptoms**:
- Health check returns `healthy: false`
- Error: "Firestore connection failed"

**Solutions**:
1. Check Firestore is enabled in Firebase Console
2. Verify security rules allow access:
   ```
   match /lead_finder_queue/{document=**} {
     allow read, write: if request.auth != null;
   }
   ```
3. Check Cloud Functions have Firestore permissions
4. Restart Cloud Functions

### Issue: "Queue jobs not processing"

**Symptoms**:
- Jobs stay in "pending" status
- No jobs move to "processing"

**Solutions**:
1. Check `processLeadFinderQueue` function is deployed
2. Verify scheduled trigger is enabled
3. Check Cloud Functions logs for errors
4. Manually trigger function:
   ```bash
   gcloud functions call processLeadFinderQueue --region=us-central1
   ```

### Issue: "High latency in health checks"

**Symptoms**:
- Health check takes > 5 seconds
- Firestore queries are slow

**Solutions**:
1. Check Firestore usage metrics
2. Verify indexes are created
3. Optimize query with limit(1)
4. Check network connectivity

### Issue: "Permission denied" errors

**Symptoms**:
- Error: "Permission denied on resource"
- Firestore operations fail

**Solutions**:
1. Check Cloud Functions service account has Firestore permissions
2. Update security rules to allow service account
3. Check IAM roles in Firebase Console
4. Verify project ID is correct

---

## Performance Optimization

### Query Optimization

```javascript
// ✅ Good: Limited query with index
await db.collection('lead_finder_queue')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'asc')
  .limit(5)
  .get();

// ❌ Bad: Unlimited query
await db.collection('lead_finder_queue')
  .where('status', '==', 'pending')
  .get();
```

### Batch Operations

```javascript
// ✅ Good: Batch write
const batch = db.batch();
for (const lead of leads) {
  batch.set(db.collection('leads').doc(), lead);
}
await batch.commit();

// ❌ Bad: Individual writes
for (const lead of leads) {
  await db.collection('leads').add(lead);
}
```

### Cleanup Strategy

```javascript
// Run daily cleanup to remove old jobs
// Keeps Firestore collection size manageable
// Reduces query latency
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
await db.collection('lead_finder_queue')
  .where('completedAt', '<', sevenDaysAgo)
  .limit(500)
  .get();
```

---

## Monitoring Dashboard

### Key Metrics to Track

1. **Queue Health**
   ```
   Pending Jobs: [0-10]
   Processing Jobs: [0-5]
   Completed Jobs: [0-1000]
   Failed Jobs: [0-10]
   ```

2. **System Health**
   ```
   Firestore Connection: ✅ Healthy
   Health Check Success Rate: > 99%
   Average Response Time: < 500ms
   ```

3. **Performance**
   ```
   Job Completion Time: 5-30 minutes
   Email Extraction Rate: 10-50 per minute
   Browser Memory: < 500MB
   ```

### Alert Thresholds

- **Critical**: Firestore connection fails
- **Warning**: Pending jobs > 20
- **Warning**: Failed jobs > 5
- **Warning**: Health check latency > 2 seconds

---

## Success Criteria

After deployment, verify:

- ✅ No Redis connection errors in logs
- ✅ Health check returns `healthy: true`
- ✅ Queue operations work (add, get, update)
- ✅ Lead Finder jobs can be created
- ✅ Jobs are queued in Firestore
- ✅ Scheduled worker processes jobs
- ✅ Leads are stored in Firestore
- ✅ No external dependencies required
- ✅ System scales automatically with Firestore

---

## Deployment Checklist

### Before Deployment
- [ ] Code reviewed and tested locally
- [ ] No Redis/BullMQ references in code
- [ ] All tests passing
- [ ] Backup created
- [ ] Team notified

### During Deployment
- [ ] Functions deployed successfully
- [ ] No deployment errors
- [ ] Logs monitored for issues
- [ ] Health check verified

### After Deployment
- [ ] Health check returns healthy
- [ ] Queue operations working
- [ ] Lead Finder jobs can be created
- [ ] Firestore collections populated
- [ ] No errors in logs
- [ ] Performance metrics normal
- [ ] Team notified of completion

---

## Support & Escalation

### If Issues Occur

1. **Check Logs**
   ```bash
   firebase functions:log --follow
   ```

2. **Check Firestore**
   - Firebase Console → Firestore Database
   - Verify collections exist
   - Check security rules

3. **Check Cloud Functions**
   - Firebase Console → Cloud Functions
   - Verify functions are deployed
   - Check execution metrics

4. **Escalate if Needed**
   - Contact Firebase Support
   - Provide logs and error messages
   - Include deployment details

---

## Conclusion

The deployment of Redis/BullMQ removal is **low-risk** because:
- ✅ Firestore is built-in to Firebase
- ✅ No external dependencies added
- ✅ All code changes are internal
- ✅ API signatures unchanged
- ✅ Easy rollback if needed

**Estimated Deployment Time**: 5-10 minutes  
**Estimated Testing Time**: 10-15 minutes  
**Total Time**: 15-25 minutes  

**Status**: 🟢 **READY FOR PRODUCTION DEPLOYMENT**

