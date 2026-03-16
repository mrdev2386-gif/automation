# Per-User SERP API Key Implementation Guide

## Overview
This guide implements per-user SERP API key support for the Lead Finder automation, allowing each user to use their own API key instead of relying on a global key.

## Architecture

### 1. User API Key Storage
**Collection**: `lead_finder_config`
**Document ID**: `{userId}`

```json
{
  "user_id": "user123",
  "api_key": "your-serp-api-key-here",
  "daily_limit": 500,
  "max_concurrent_jobs": 1,
  "status": "active",
  "webhook_url": "https://example.com/webhook",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### 2. Lead Storage Structure
**Collection**: `leads`
**Document ID**: Auto-generated

```json
{
  "userId": "user123",
  "businessName": "Acme Corp",
  "website": "https://acmecorp.com",
  "email": "contact@acmecorp.com",
  "phone": "+1-555-0123",
  "country": "USA",
  "niche": "Software Companies",
  "source": "lead_finder",
  "status": "new",
  "jobId": "job123",
  "verified": true,
  "lead_score": 15,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## Implementation Steps

### Step 1: Update Web Search Service
**File**: `functions/src/services/leadFinderWebSearchService.js`

✅ DONE - Updated `searchWithSerpAPI()` to accept `userSerpApiKey` parameter:
- Accepts optional `userSerpApiKey` parameter
- Falls back to global `process.env.SERPAPI_API_KEY` if user key not provided
- Logs which API key is being used

### Step 2: Update Lead Finder Service
**File**: `functions/src/services/leadFinderService.js`

**Key Changes**:
1. Fetch user's API key from `lead_finder_config` collection
2. Pass user's API key to `searchWebsites()` function
3. Log API key usage in activity logs

**Code to Replace**:
Find the `startAutomatedLeadFinder` function and replace with the version in `IMPLEMENTATION_GUIDE_PER_USER_API_KEYS.md`

### Step 3: Ensure Lead Storage
**Current Implementation**: ✅ Already working
- Leads are stored in `leads` collection with `userId` field
- Each lead has: businessName, website, email, country, niche, source, status, jobId, verified, lead_score
- Automatic deduplication prevents duplicate emails per user

### Step 4: Dashboard Display
**File**: `dashboard/src/pages/LeadFinder.jsx`

✅ ALREADY IMPLEMENTED:
- Fetches leads using `getMyLeadFinderLeads()` callable function
- Displays leads in table with columns: Business, Website, Email, Score, Country, Niche, Created
- Shows statistics: Total Leads, High Quality (score ≥ 12), Avg Score, Filtered count
- Supports filtering by: Min Score, Country, Niche, Email Domain, Search Text
- Supports sorting by any column
- Pagination with configurable page size (20, 50, 100)
- Export to CSV and JSON
- Send to Google Sheets via webhook
- Bulk delete with confirmation

## API Key Management

### For Users
1. Go to Lead Finder Settings
2. Enter your SERP API key (get from https://serpapi.com)
3. Click "Save API Key"
4. System validates and stores encrypted key

### For Admins
1. View user's API key status in admin panel
2. Can regenerate or reset user's key if needed
3. Monitor API key usage in activity logs

## Logging & Monitoring

### Activity Logs
All Lead Finder operations are logged:
```
action: 'scrape_started'
metadata: {
  jobId,
  country,
  niche,
  websitesDiscovered,
  userApiKeyUsed: true/false
}
```

### Debugging
Check logs for:
- "Using SERP API key for user: {userId}" - Confirms user key is being used
- "Websites discovered: {count}" - Number of websites found
- "Leads extracted: {count}" - Number of emails extracted
- "SERP API key not configured" - User needs to add API key

## Error Handling

### Missing API Key
**Error**: "SERP API key not configured for this user"
**Solution**: User must add API key in Lead Finder settings

### Invalid API Key
**Error**: API returns 401 or 403
**Solution**: Verify API key is correct and has remaining quota

### Rate Limiting
**Error**: API returns 429 (Too Many Requests)
**Solution**: Increase delay between requests or upgrade SERP API plan

## Testing

### Test Scenario 1: User with API Key
1. Create test user
2. Add SERP API key to `lead_finder_config`
3. Start Lead Finder job
4. Verify logs show "userApiKeyUsed: true"
5. Verify leads are extracted and stored

### Test Scenario 2: User without API Key (Fallback)
1. Create test user without API key
2. Start Lead Finder job
3. System should use global API key or fallback search
4. Verify leads are still extracted

### Test Scenario 3: Dashboard Display
1. Start Lead Finder job
2. Wait for completion
3. Go to Lead Finder Results tab
4. Verify leads display with all fields
5. Test filtering, sorting, pagination
6. Test export to CSV/JSON

## Database Queries

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
  .get();
```

### Get Leads by Job
```javascript
const leads = await db.collection('leads')
  .where('jobId', '==', jobId)
  .get();
```

### Get High-Quality Leads
```javascript
const leads = await db.collection('leads')
  .where('userId', '==', userId)
  .where('lead_score', '>=', 12)
  .orderBy('lead_score', 'desc')
  .get();
```

## Performance Optimization

### Indexing
Create Firestore indexes for:
- `leads`: userId + source + createdAt
- `leads`: userId + lead_score
- `lead_finder_config`: user_id

### Caching
- Cache user's API key in memory for 5 minutes
- Cache lead counts per user
- Cache job status during polling

### Batch Operations
- Batch insert leads (max 500 per batch)
- Batch delete leads
- Batch update lead status

## Security Considerations

### API Key Protection
- Store API keys encrypted in Firestore
- Never log full API keys (mask last 8 chars)
- Rotate keys periodically
- Revoke compromised keys immediately

### Access Control
- Only user can view/edit their own API key
- Admin can view but not edit user keys
- API key never sent to frontend
- All API calls use server-side keys

### Rate Limiting
- Per-user rate limits on job creation
- Global rate limits on API calls
- Exponential backoff on failures
- Queue-based processing to prevent overload

## Deployment Checklist

- [ ] Update `leadFinderWebSearchService.js` with per-user API key support
- [ ] Update `leadFinderService.js` to fetch and use user's API key
- [ ] Verify `lead_finder_config` collection exists
- [ ] Verify `leads` collection has proper indexes
- [ ] Test with user API key
- [ ] Test with global API key fallback
- [ ] Test dashboard display
- [ ] Test filtering and sorting
- [ ] Test export functionality
- [ ] Monitor logs for errors
- [ ] Deploy to production: `firebase deploy --only functions`

## Rollback Plan

If issues occur:
1. Revert `leadFinderWebSearchService.js` to use only global API key
2. Revert `leadFinderService.js` to not fetch user API key
3. Leads already stored will remain in database
4. Users can still view existing leads in dashboard

## Future Enhancements

1. **API Key Rotation**: Automatic key rotation every 90 days
2. **Usage Analytics**: Track API calls per user
3. **Cost Allocation**: Charge users based on API usage
4. **Multiple Keys**: Allow users to add multiple API keys
5. **Key Sharing**: Share API key quota with team members
6. **Webhook Integration**: Send leads to external CRM automatically
7. **Lead Enrichment**: Add phone, LinkedIn, company info
8. **AI Scoring**: Use ML to score leads automatically
9. **Duplicate Detection**: Detect duplicates across jobs
10. **Lead Verification**: Verify emails with third-party service

## Support

For issues or questions:
1. Check activity logs for error messages
2. Verify API key is valid and has quota
3. Check Firestore collections for data
4. Review Cloud Functions logs
5. Contact support with job ID and error message
