# Per-User API Key - Quick Reference

## What Changed

### Before
- Global SERP API key: `process.env.SERPAPI_API_KEY`
- All users share same API key
- Limited to global quota

### After
- Per-user API keys stored in `lead_finder_config` collection
- Each user can use their own SERP API key
- Falls back to global key if user key not set
- Better quota management and cost allocation

## Files Modified

### 1. leadFinderWebSearchService.js
```javascript
// OLD
const searchWithSerpAPI = async (queries, limit = 100) => {
    const apiKey = process.env.SERPAPI_API_KEY;
}

// NEW
const searchWithSerpAPI = async (queries, limit = 100, userSerpApiKey = null) => {
    const apiKey = userSerpApiKey || process.env.SERPAPI_API_KEY;
}
```

### 2. leadFinderService.js
```javascript
// NEW CODE TO ADD in startAutomatedLeadFinder()
// Fetch user's SERP API key from Firestore
let userSerpApiKey = null;
try {
    const leadFinderConfigDoc = await db.collection('lead_finder_config').doc(userId).get();
    if (leadFinderConfigDoc.exists) {
        userSerpApiKey = leadFinderConfigDoc.data().api_key || null;
    }
} catch (error) {
    console.warn('Could not fetch user SERP API key:', error.message);
}

// Validate that user has API key configured
if (!userSerpApiKey && !process.env.SERPAPI_API_KEY) {
    throw new Error('SERP API key not configured for this user. Please add your API key in Lead Finder settings.');
}

// Pass user's API key to searchWebsites
const websites = await webSearch.searchWebsites(niche, country, limit, true, userSerpApiKey);
```

## Database Schema

### lead_finder_config Collection
```
lead_finder_config/{userId}
├── user_id: string
├── api_key: string (encrypted)
├── daily_limit: number
├── max_concurrent_jobs: number
├── status: string ("active" | "inactive")
├── webhook_url: string (optional)
├── created_at: timestamp
└── updated_at: timestamp
```

### leads Collection (Already Exists)
```
leads/{leadId}
├── userId: string
├── businessName: string
├── website: string
├── email: string
├── phone: string (optional)
├── country: string
├── niche: string
├── source: string ("lead_finder")
├── status: string ("new" | "contacted" | "qualified")
├── jobId: string
├── verified: boolean
├── lead_score: number (0-20)
└── createdAt: timestamp
```

## Implementation Checklist

### Backend
- [x] Update `leadFinderWebSearchService.js` to accept `userSerpApiKey`
- [ ] Update `leadFinderService.js` to fetch and pass user's API key
- [ ] Test with user API key
- [ ] Test with global API key fallback
- [ ] Deploy: `firebase deploy --only functions`

### Frontend
- [x] Dashboard already displays leads correctly
- [x] Filtering, sorting, pagination working
- [x] Export to CSV/JSON working
- [ ] Add "API Key Settings" page (optional)
- [ ] Add API key validation UI (optional)

### Testing
- [ ] Create test user with API key
- [ ] Start Lead Finder job
- [ ] Verify leads are extracted
- [ ] Verify leads display in dashboard
- [ ] Test filtering and sorting
- [ ] Test export functionality

## API Key Setup for Users

### Step 1: Get SERP API Key
1. Go to https://serpapi.com
2. Sign up for free account
3. Copy your API key from dashboard

### Step 2: Add to Lead Finder Settings
1. Open Lead Finder tool
2. Go to Settings tab
3. Paste API key in "SERP API Key" field
4. Click "Save API Key"
5. System validates and stores key

### Step 3: Start Using
1. Go to "New Search" tab
2. Enter country and niche
3. Click "Start Lead Collection"
4. System uses your API key for website discovery

## Logging & Debugging

### Check if User API Key is Being Used
```
grep "Using SERP API key for user" functions/logs
```

### Check Websites Discovered
```
grep "Websites discovered:" functions/logs
```

### Check Leads Extracted
```
grep "Leads extracted:" functions/logs
```

### Check for API Key Errors
```
grep "SERP API key not configured" functions/logs
```

## Firestore Queries

### Get User's API Key
```javascript
const configDoc = await db.collection('lead_finder_config').doc(userId).get();
const apiKey = configDoc.data().api_key;
```

### Get User's Leads
```javascript
const leads = await db.collection('leads')
  .where('userId', '==', userId)
  .where('source', '==', 'lead_finder')
  .orderBy('createdAt', 'desc')
  .limit(1000)
  .get();
```

### Get High-Quality Leads (Score ≥ 12)
```javascript
const leads = await db.collection('leads')
  .where('userId', '==', userId)
  .where('lead_score', '>=', 12)
  .orderBy('lead_score', 'desc')
  .get();
```

### Get Leads from Specific Job
```javascript
const leads = await db.collection('leads')
  .where('jobId', '==', jobId)
  .get();
```

## Dashboard Features

### Statistics
- **Total Leads**: All leads collected
- **High Quality**: Leads with score ≥ 12
- **Avg Score**: Average lead quality score
- **Filtered**: Leads matching current filters

### Filtering
- Min Score (0-20)
- Country
- Niche
- Email Domain
- Search Text (name or email)

### Sorting
Click column header to sort by:
- Business Name
- Website
- Email
- Score
- Country
- Niche
- Created Date

### Pagination
- Page size: 20, 50, or 100 rows
- Navigate between pages
- Shows current page and total pages

### Export
- **CSV**: Download as spreadsheet
- **JSON**: Download as JSON file
- **Google Sheets**: Send via webhook

### Actions
- **View Details**: Click row or eye icon
- **Select**: Checkbox to select leads
- **Delete**: Delete selected leads
- **Copy Email**: Copy email to clipboard
- **Open Website**: Open in new tab

## Troubleshooting

### Issue: "SERP API key not configured"
**Solution**: 
1. Go to Lead Finder Settings
2. Add your SERP API key
3. Click Save
4. Try again

### Issue: No websites discovered
**Solution**:
1. Check API key is valid
2. Check API quota not exceeded
3. Try different niche/country
4. Check internet connection

### Issue: Leads not showing in dashboard
**Solution**:
1. Wait for job to complete
2. Refresh page
3. Check job status in "Jobs" tab
4. Check activity logs for errors

### Issue: Slow performance
**Solution**:
1. Reduce page size to 20 rows
2. Apply filters to reduce results
3. Clear browser cache
4. Try different browser

## Performance Tips

1. **Use Filters**: Narrow down results to improve performance
2. **Pagination**: Use smaller page sizes (20 rows)
3. **Export**: Export to CSV for large datasets
4. **Sorting**: Sort by score to find best leads first
5. **Batch Delete**: Delete old leads to reduce clutter

## Security Notes

- API keys are stored encrypted in Firestore
- Never share your API key with others
- Rotate API key every 90 days
- Monitor API usage in SERP dashboard
- Set spending limits in SERP account

## Next Steps

1. Update `leadFinderService.js` with user API key fetching
2. Deploy to production
3. Test with real user
4. Monitor logs for errors
5. Gather user feedback
6. Iterate and improve

## Support

For issues:
1. Check logs: `firebase functions:log`
2. Check Firestore: `firebase firestore:inspect`
3. Check activity logs in dashboard
4. Contact support with job ID
