# Lead Finder System - Developer Quick Reference

## 🔧 Key Services

### 1. leadFinderWebSearchService.js
**Purpose:** Website discovery using SERP API

**Key Functions:**
```javascript
// Fetch user's SERP API key
const apiKey = await getUserSerpApiKey(userId);

// Build search queries (10+ variations)
const queries = buildSearchQueries(niche, country);

// Search websites (with user's API key)
const websites = await searchWebsites(niche, country, limit, true, userId);

// Validate websites
const validWebsites = validateWebsites(websites);
```

---

### 2. apifyLeadService.js
**Purpose:** Optional LinkedIn and Google Maps lead discovery

**Key Functions:**
```javascript
// Check if Apify is enabled
const enabled = await isApifyEnabled(userId);

// Scrape LinkedIn companies
const linkedInLeads = await scrapeLinkedInCompanies(query, userId, maxResults);

// Scrape Google Maps businesses
const googleMapsLeads = await scrapeGoogleMapsBusiness(query, location, userId, maxResults);

// Combined discovery
const leads = await discoverLeadsWithApify(niche, country, userId, {
    useLinkedIn: true,
    useGoogleMaps: true,
    maxResults: 50
});
```

---

### 3. leadFinderService.js
**Purpose:** Main scraping engine

**Key Functions:**
```javascript
// Start automated lead finder
const result = await startAutomatedLeadFinder(userId, country, niche, limit);

// Process scrape job
const result = await processScrapeJob(jobData);

// Scrape website with timeout
const result = await scrapeWebsiteWithTimeout(url, browser, dedupeSet, userId, timeout, config);

// Get user's leads
const leads = await getUserLeads(userId);

// Delete leads
await deleteLeads(userId, leadIds);
```

---

### 4. webhookService.js
**Purpose:** CRM webhook notifications

**Key Functions:**
```javascript
// Send individual lead webhook
await sendToWebhook(webhookUrl, leadData);

// Send job completion webhook
await sendLeadFinderWebhook(webhookUrl, {
    userId,
    jobId,
    leadsCollected,
    websitesScanned,
    emailsFound,
    country,
    niche,
    timestamp,
    leads: [] // Preview
});
```

---

## 📊 Database Collections

### lead_finder_config/{userId}
```javascript
{
  api_key: string,              // SERP API key
  apify_api_key: string,        // Apify API key (optional)
  webhook_url: string,          // Webhook URL (optional)
  daily_limit: 500,
  max_concurrent_jobs: 1,
  status: "active"
}
```

### lead_finder_jobs/{jobId}
```javascript
{
  userId: string,
  country: string,
  niche: string,
  status: "queued | in_progress | completed | failed",
  progress: {
    websitesScanned: number,
    emailsFound: number
  },
  websites: Array<string>,
  apifyLeads: Array<Object>,
  results: Array<Object>
}
```

### lead_finder_queue/{queueId}
```javascript
{
  jobId: string,
  userId: string,
  status: "pending | processing | completed | failed",
  websites: Array<string>,
  country: string,
  niche: string
}
```

### leads/{leadId}
```javascript
{
  userId: string,
  businessName: string,
  website: string,
  email: string,
  phone: string,
  source: "serp | apify | scraper",
  country: string,
  niche: string,
  lead_score: number,
  verified: boolean,
  jobId: string
}
```

---

## 🔄 Pipeline Flow

```
1. User calls startLeadFinder()
   ↓
2. startAutomatedLeadFinder() executes
   ↓
3. SERP API discovers websites (user's key)
   ↓
4. Apify discovers additional leads (if enabled)
   ↓
5. Job created in lead_finder_jobs
   ↓
6. Job queued in lead_finder_queue
   ↓
7. processLeadFinderQueue worker picks up job
   ↓
8. processScrapeJob() executes
   ↓
9. For each website:
   - Scrape homepage
   - Try /contact, /about, /team, etc.
   - Extract emails
   - Calculate lead score
   ↓
10. Store leads in Firestore
    ↓
11. Send webhook notification
    ↓
12. Update job status to "completed"
```

---

## 🎯 Common Tasks

### Add New Search Query Pattern
**File:** `leadFinderWebSearchService.js`
```javascript
const buildSearchQueries = (niche, country) => {
    const queries = [];
    
    // Add your new pattern here
    queries.push(`your new pattern ${niche} ${country}`);
    
    return queries;
};
```

### Add New Page to Scrape
**File:** `leadFinderService.js`
```javascript
const contactPages = [
    '/contact', 
    '/about', 
    '/your-new-page'  // Add here
];
```

### Customize Lead Scoring
**File:** `leadScoringService.js`
```javascript
const calculateLeadScore = (email, websiteDomain) => {
    let score = 10; // Base score
    
    // Add your custom scoring logic
    if (yourCondition) {
        score += 5;
    }
    
    return Math.min(score, 20);
};
```

### Add New Webhook Event
**File:** `webhookService.js`
```javascript
const sendCustomWebhook = async (webhookUrl, eventData) => {
    const payload = {
        event: 'your_custom_event',
        ...eventData
    };
    
    await axios.post(webhookUrl, payload);
};
```

---

## 🐛 Debugging

### Check Function Logs
```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only processLeadFinderQueue

# Last 100 entries
firebase functions:log --limit 100
```

### Check Firestore Data
```javascript
// Get user config
const config = await db.collection('lead_finder_config').doc(userId).get();

// Get job status
const job = await db.collection('lead_finder_jobs').doc(jobId).get();

// Get queue entries
const queue = await db.collection('lead_finder_queue')
    .where('status', '==', 'pending')
    .get();

// Get leads
const leads = await db.collection('leads')
    .where('userId', '==', userId)
    .get();
```

### Test Locally
```bash
# Start emulator
firebase emulators:start

# Test function
firebase functions:shell
> startLeadFinder({country: 'UAE', niche: 'Real Estate', limit: 10})
```

---

## 🔐 API Keys

### SERP API
**Get Key:** https://serpapi.com/
**Store In:** `lead_finder_config/{userId}.api_key`
**Fallback:** `process.env.SERPAPI_API_KEY`

### Apify API
**Get Key:** https://apify.com/
**Store In:** `lead_finder_config/{userId}.apify_api_key`
**Optional:** System works without it

---

## 📈 Performance Tips

### Optimize Scraping Speed
```javascript
// Reduce timeout for faster scraping
const SCRAPE_TIMEOUT_MS = 10000; // 10 seconds

// Increase concurrent pages
const MAX_OPEN_PAGES = 5; // Default: 3

// Reduce delay between requests
const REQUEST_DELAY_MS = 1000; // Default: 2000
```

### Optimize Memory Usage
```javascript
// Close pages immediately after scraping
await page.close();

// Limit browser pool size
const MAX_BROWSERS = 2;

// Use headless mode
const browser = await puppeteer.launch({ headless: true });
```

### Optimize Database Operations
```javascript
// Use batch operations
const batch = db.batch();
for (const lead of leads) {
    batch.set(db.collection('leads').doc(), lead);
}
await batch.commit();

// Use pagination for large queries
const leads = await db.collection('leads')
    .where('userId', '==', userId)
    .limit(100)
    .get();
```

---

## 🧪 Testing

### Unit Test Example
```javascript
const { getUserSerpApiKey } = require('./leadFinderWebSearchService');

test('getUserSerpApiKey returns API key', async () => {
    const apiKey = await getUserSerpApiKey('test-user-id');
    expect(apiKey).toBeDefined();
});
```

### Integration Test Example
```javascript
const { startAutomatedLeadFinder } = require('./leadFinderService');

test('startAutomatedLeadFinder creates job', async () => {
    const result = await startAutomatedLeadFinder('test-user', 'UAE', 'Real Estate', 10);
    expect(result.jobId).toBeDefined();
    expect(result.status).toBe('queued');
});
```

---

## 📞 Support

### Common Issues

**Issue:** No websites discovered
**Fix:** Check SERP API key is configured and valid

**Issue:** Job stuck in "queued"
**Fix:** Verify `processLeadFinderQueue` function is deployed and scheduled

**Issue:** No emails extracted
**Fix:** Check websites are valid and accessible

**Issue:** Webhook not sent
**Fix:** Verify webhook URL is configured and accessible

---

## 🔄 Deployment

### Deploy All Functions
```bash
firebase deploy --only functions
```

### Deploy Specific Function
```bash
firebase deploy --only functions:startLeadFinder
```

### Deploy with Environment Variables
```bash
firebase functions:config:set serpapi.key="your-key"
firebase deploy --only functions
```

---

## 📚 Resources

**Documentation:**
- [LEAD_FINDER_COMPLETE_IMPLEMENTATION.md](./LEAD_FINDER_COMPLETE_IMPLEMENTATION.md)
- [LEAD_FINDER_DEPLOYMENT_QUICK_GUIDE.md](./LEAD_FINDER_DEPLOYMENT_QUICK_GUIDE.md)
- [LEAD_FINDER_CHANGES_SUMMARY.md](./LEAD_FINDER_CHANGES_SUMMARY.md)

**External APIs:**
- SERP API: https://serpapi.com/docs
- Apify: https://docs.apify.com/

**Firebase:**
- Functions: https://firebase.google.com/docs/functions
- Firestore: https://firebase.google.com/docs/firestore

---

**Version:** 2.0.0

**Last Updated:** 2024
