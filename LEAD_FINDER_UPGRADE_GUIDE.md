# Lead Finder Automation - Phase 2 Upgrade Guide

## Overview

This document details the complete Phase 2 upgrade to the Lead Finder system, transforming it from a semi-manual tool to a fully automated, scalable, and admin-managed solution.

**Version:** 2.0.0  
**Status:** Production Ready  
**Last Updated:** 2024

---

## What's New

### 1. **Fully Automated Workflow**
- ✅ Auto-discovery of target websites using SerpAPI + fallback patterns
- ✅ No manual website submission required
- ✅ Automatic scraping with safety limits (15s timeout, 40min max runtime)
- ✅ Zero user configuration beyond API key

### 2. **Queue-Based Processing**
- ✅ BullMQ + Redis job queue system
- ✅ Global max 3 concurrent jobs (prevents server overload)
- ✅ Per-user max 1 job (prevents user abuse)
- ✅ Job retry with exponential backoff
- ✅ Progress tracking and real-time updates

### 3. **Email Deduplication**
- ✅ In-memory Set tracking during scraping
- ✅ Firestore uniqueness checks before storage
- ✅ Prevents duplicate emails at database level
- ✅ Query indexes for efficient lookups

### 4. **Admin Auto-Setup**
- ✅ One-click tool assignment during user creation
- ✅ Automatic lead_finder_config creation
- ✅ Automatic user_tools record creation
- ✅ User only needs to add API key

### 5. **API Key Management**
- ✅ LeadFinderSettings page for API key configuration
- ✅ Secure storage in lead_finder_config collection
- ✅ Encrypted at rest (configurable in production)
- ✅ Masked display (•••••••8chars)

### 6. **Timeout Protection**
- ✅ Reduced from 30s to 15s per page
- ✅ Graceful fallback to contact pages
- ✅ Skip on timeout (don't crash job)
- ✅ Automatic retry for timed-out pages

### 7. **Enhanced Security**
- ✅ Firestore security rules for all collections
- ✅ Per-user data isolation
- ✅ Admin access controls
- ✅ Activity logging for all operations

---

## Architecture Changes

### New Collections

#### 1. `lead_finder_config`
```javascript
{
  user_id: string,           // Document ID (same as user ID)
  api_key: string,           // SerpAPI key (encrypted in production)
  daily_limit: number,       // Default 500
  max_concurrent_jobs: number, // Default 1
  status: string,            // "active" | "suspended"
  created_at: timestamp,
  updated_at: timestamp
}
```

#### 2. `user_tools`
```javascript
{
  user_id: string,     // Indexed for user queries
  tool_name: string,   // "lead_finder" | "whatsapp_bot" | etc
  status: string,      // "active" | "disabled"
  created_at: timestamp
}
```
**Document ID Format:** `{userId}_{toolName}`

#### 3. `lead_finder_jobs` (Enhanced)
```javascript
{
  id: string,                              // Document ID
  userId: string,                          // Job owner (indexed)
  country: string,                         // Target country
  niche: string,                           // Target industry
  status: "queued" | "in_progress" | "completed" | "failed",
  queue_job_id: string,                    // BullMQ job ID reference
  websites: string[],                      // Auto-discovered URLs
  progress: {
    websitesScanned: number,
    emailsFound: number,
    startedAt: timestamp,
    completedAt: timestamp
  },
  results: Array,                          // Raw scraping results
  error: string,                           // Error message if failed
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Modified Services

#### leadFinderService.js (600+ → 850+ lines)
**New Functions:**
- `startAutomatedLeadFinder()` - Auto-discover + queue jobs
- `processScrapeJob()` - Core scraping with all safety features
- `emailExistsForUser()` - Deduplication check
- `scrapeWebsiteWithTimeout()` - Timeout-protected scraping

**Deprecated Functions:**
- `submitWebsites()` - Manual website submission (kept for backward compat)
- `searchWebsites()` - Generic web search (replaced by service import)

#### New Services
**leadFinderQueueService.js** (280 lines)
- Redis + BullMQ queue management
- Global concurrency limits (3 jobs)
- Per-user limits (1 job)
- Job retry with backoff
- Progress tracking

**leadFinderWebSearchService.js** (200 lines)
- Automatic website discovery
- SerpAPI integration
- Fallback to pattern-based search
- Social media blocking
- URL validation

### New Cloud Functions

#### `setupLeadFinderForUser(userId)`
**Admin only** - Called during user creation
- Creates lead_finder_config record
- Creates user_tools record
- Logs activity

#### `saveLeadFinderAPIKey(apiKey)`
**User endpoint** - Called from Settings page
- Encrypts and stores API key
- Updates lead_finder_config
- Returns success/error

#### `getLeadFinderConfig()`
**User endpoint** - Called when loading settings
- Returns config (without secret API key)
- Shows hasApiKey boolean
- Shows created/updated timestamps

---

## Configuration

### Environment Variables (functions/.env)

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Optional

# SerpAPI Configuration
SERPAPI_API_KEY=         # Optional - falls back to built-in patterns
```

### Firebase Configuration

**Firestore:**
- 3 new collections (lead_finder_config, user_tools, lead_finder_jobs)
- 5 new indexes for efficient querying
- Security rules for access control

**Storage:**
- No changes (leads stored in Firestore)

**Cloud Functions:**
- 3 new functions (setupLeadFinderForUser, saveLeadFinderAPIKey, getLeadFinderConfig)
- Updated functions (startLeadFinder now calls startAutomatedLeadFinder)

---

## Deployment Steps

### 1. Install Dependencies

```bash
cd functions
npm install bullmq redis
npm install
```

### 2. Update Environment Variables

```bash
# functions/.env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
SERPAPI_API_KEY=your-serpapi-key  # Optional
```

### 3. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

The following indexes will be created:
- lead_finder_jobs (userId, createdAt)
- lead_finder_jobs (userId, status)
- leads (userId, email) - for deduplication
- leads (userId, createdAt)

### 4. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### 5. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

New functions:
- setupLeadFinderForUser
- saveLeadFinderAPIKey
- getLeadFinderConfig

Modified functions:
- startLeadFinder (now calls startAutomatedLeadFinder)

### 6. Deploy Frontend

```bash
cd dashboard
npm run build
firebase deploy --only hosting
```

New components:
- LeadFinderSettings.jsx (full settings page)

Updated components:
- LeadFinder.jsx (removed manual website form)
- App.jsx (new /lead-finder-settings route)
- Sidebar.jsx (added Settings link)

### 7. Verify Deployment

```bash
# Check functions are deployed
firebase functions:list

# Check Firestore indexes
firebase firestore:indexes

# Test new endpoints (via Firebase Console or Functions Testing)
```

---

## User Workflow

### Admin View (Super Admin)

```
1. Open Users page
2. Create New User
3. ✓ Select "Lead Finder" tool
4. Set Name, Email, Password
5. Click "Create"
   ↓
   System automatically:
   - Creates lead_finder_config (empty API key)
   - Creates user_tools record
   - Logs admin action
   
6. User receives login credentials
```

### User View (Client User)

```
1. Log in to dashboard
2. Click "Lead Finder" in sidebar
3. First time setup:
   - Sidebar shows "Lead Finder Settings" link
   - Click link → LeadFinderSettings page
   - Paste SerpAPI key
   - Click "Save"
4. Go back to Lead Finder
5. Enter Country & Niche
6. Click "Start Lead Finder"
   ↓
   System automatically:
   - Discovers websites (SerpAPI)
   - Creates job record
   - Queues scraping job (BullMQ)
   - Returns to Jobs tab
7. Monitor progress:
   - Websites scanned
   - Emails found
   - Real-time updates every 3-5 seconds
8. Job completes:
   - Results tab shows leads
   - Download as CSV
   - Delete leads
```

---

## Safety Features

### Rate Limiting
- Global: Max 3 concurrent scraping jobs
- Per-user: Max 1 active job at a time
- Enforced in queue service + Cloud Function checks

### Timeout Protection
- Page load: 15 seconds (reduced from 30s)
- Contact page: 7.5 seconds
- Skip on timeout (continue with next site)
- No job crashes from timeouts

### Max Runtime
- Job timeout: 40 minutes
- Prevents infinite job processing
- Graceful shutdown on timeout
- Status logged as "timeout" or "completed_with_limit"

### Email Validation
- Regex pattern filters invalid formats
- Blocklist: localhost, example.com, test.com, demo.com
- Deduplication: Set() + Firestore checks
- Prevents duplicate storage

### Data Isolation
- Users can only access their own:
  - leads
  - jobs
  - config
  - activity logs
- Admin can override for support/debugging
- All access logged to activity_logs

---

## Performance Metrics

### Benchmarks (Estimated)

| Metric | Value |
|--------|-------|
| Websites discovered per job | Up to 500 |
| Average emails per website | 2-5 |
| Scraping speed | ~8-12 websites/minute* |
| Job completion time | 40-60 minutes (500 sites) |
| Max concurrent jobs | 3 globally |
| Redis memory per job | ~10-50MB |
| Firestore reads per job | ~100-500 |
| Firestore writes per job | ~50-500 |

*Depends on timeout, website complexity, and Redis performance

### Optimization Tips

1. **Limit websites per run:** Start with 100-200, scale to 500
2. **Batch small searches:** Multiple 100-site jobs vs single 500-site
3. **Monitor queue:** Check BullMQ dashboard for bottlenecks
4. **Redis memory:** Ensure sufficient RAM (1GB minimum)
5. **Firestore:** Enable auto-scaling for peak loads

---

## Troubleshooting

### Job Stuck in "Queued"

**Cause:** Redis unavailable or queue processor not running

**Solution:**
```bash
# Check Redis connection
redis-cli ping

# Check queue processor in logs
firebase functions:log

# Restart queue service
# Queue is automatically initialized when functions start
```

### Low Email Extraction Rate

**Cause:** Websites blocking scrapers or poor email formatting

**Solution:**
1. Increase timeout in CONFIG (max 30s)
2. Add more contact pages in scrapeWebsiteWithTimeout()
3. Improve email regex pattern
4. Check website is not returning captcha

### SerpAPI Rate Limit

**Cause:** Too many searches with API key

**Solution:**
1. Fall back to built-in patterns (automatic)
2. Increase delay between searches (modify leadFinderWebSearchService.js)
3. Upgrade SerpAPI plan
4. Set SERPAPI_API_KEY empty to use fallback only

### Firestore Costs High

**Cause:** Excessive email deduplication queries

**Solution:**
1. Batch queries (already done in processScrapeJob)
2. Enable Firestore caching
3. Reduce daily_limit per user
4. Use composite indexes (already created)

---

## Migration Guide (Phase 1 → Phase 2)

### Breaking Changes
- ❌ Manual website submission removed (submitWebsitesForScraping deprecated)
- ❌ No more "Add Websites" form
- ⚠️ Jobs now require API key (SerpAPI)

### Backward Compatibility
- ✅ Existing leads data intact
- ✅ Existing jobs data intact
- ✅ submitWebsitesForScraping still works (deprecated)
- ✅ startLeadFinder delegates to startAutomatedLeadFinder

### Data Migration

No data migration needed! All existing:
- Users: No changes
- Leads: No schema changes
- Jobs: status field now includes "queued"
- Configs: New collection (empty for existing users)

### User Communication

Send email to all users:

```
Subject: Lead Finder 2.0 - Fully Automated! 🚀

Your Lead Finder tool has been upgraded! Here's what's new:

✨ No More Manual Website Input
- Automatically discovers websites for your niche
- One-click to start the process

🔐 API Key Configuration
- Go to Lead Finder Settings (new link in sidebar)
- Paste your SerpAPI key
- We handle the rest!

⚡ Faster & Smarter
- Automatic deduplication of emails
- Smart timeout handling
- Real-time progress updates

Need help? Email support@waautomation.com
```

---

## API Reference

### Cloud Functions

#### startLeadFinder(data)
**Endpoint:** Callable function  
**Auth:** Required (client_user)  
**Input:**
```javascript
{
  country: string,    // "UAE", "USA", etc
  niche: string,      // "Real Estate", "Software", etc
  limit: number       // 10-500, default 500
}
```
**Output:**
```javascript
{
  jobId: string,
  status: "queued",
  websitesDiscovered: number,
  message: string
}
```

#### getLeadFinderStatus(data)
**Endpoint:** Callable function  
**Auth:** Required  
**Input:**
```javascript
{
  jobId: string
}
```
**Output:**
```javascript
{
  job: {
    id: string,
    userId: string,
    country: string,
    niche: string,
    status: string,
    progress: {
      websitesScanned: number,
      emailsFound: number
    },
    createdAt: timestamp
  }
}
```

#### saveLeadFinderAPIKey(data)
**Endpoint:** Callable function  
**Auth:** Required (client_user)  
**Input:**
```javascript
{
  apiKey: string  // SerpAPI key
}
```
**Output:**
```javascript
{
  success: true,
  message: "API key saved successfully"
}
```
**Errors:**
- `invalid-argument`: Empty API key
- `permission-denied`: Not assigned to Lead Finder
- `internal`: Firestore error

#### getLeadFinderConfig()
**Endpoint:** Callable function  
**Auth:** Required (client_user)  
**Input:** (none)  
**Output:**
```javascript
{
  user_id: string,
  api_key: "",              // Never returns actual key
  daily_limit: number,
  max_concurrent_jobs: number,
  status: string,
  hasApiKey: boolean,      // Key indicator
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## Monitoring & Logging

### Activity Logs

All Lead Finder actions logged to `activity_logs`:

```javascript
{
  userId: string,
  action: string,  // "LEAD_FINDER_STARTED" | "LEAD_FINDER_ERROR" | etc
  metadata: {},
  timestamp: timestamp
}
```

### BullMQ Dashboard

Monitor queue health:

```bash
# Install BullMQ UI (optional)
npm install --save-dev @bull-board/express @bull-board/ui

# Access at http://localhost:3000/admin/queues
```

### Firestore Monitoring

Monitor collection sizes and costs:

1. Go to Firebase Console
2. Firestore → Usage
3. Check lead_finder_* collections

---

## FAQ

**Q: Will my existing leads be lost?**  
A: No. All existing leads remain in the database. Phase 2 is fully backward compatible.

**Q: Do I need a SerpAPI key?**  
A: No, but strongly recommended. Without it, we fall back to pattern-based website discovery (less accurate).

**Q: What if my job times out?**  
A: The system gracefully skips timed-out websites and continues. You'll see progress up until timeout.

**Q: Can I run multiple jobs?**  
A: No, max 1 per user simultaneously. Prevents server overload and user abuse.

**Q: How much does Redis cost?**  
A: Pricing varies by provider (Heroku: ~$15+, AWS ElastiCache: ~$10+, etc.). Required for production.

**Q: Can I delete my API key?**  
A: Yes, leave it empty in settings. The system will use fallback discovery.

---

## Support

For issues or questions:

1. **Documentation:** Check /docs/lead-finder
2. **Community:** Ask in #lead-finder Slack channel
3. **Support:** Email support@waautomation.com
4. **Bugs:** GitHub Issues: github.com/waautomation/issues

---

## Version History

### v2.0.0 (Current)
- ✨ Fully automated workflow
- ✨ Queue-based processing (BullMQ + Redis)
- ✨ Email deduplication
- ✨ Admin auto-setup
- ✨ API key settings page
- ✨ Timeout protection (reduced to 15s)
- ✨ Enhanced security (Firestore rules)
- 🔧 Deprecated manual website submission

### v1.0.0 (Previous)
- Manual website submission
- Single-threaded scraping
- Basic error handling

---

**End of Document**

Questions? Contact: engineering@waautomation.com
