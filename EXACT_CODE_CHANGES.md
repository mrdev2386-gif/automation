# Exact Code Changes for leadFinderService.js

## Location: functions/src/services/leadFinderService.js

### Change 1: Update startAutomatedLeadFinder Function

**Find this section** (around line 200-250):
```javascript
const startAutomatedLeadFinder = async (userId, country, niche, limit = 500) => {
    try {
        // Load configuration
        const config = await scraperConfigService.getScraperConfig();
        
        // System health check
        if (config.require_health_check) {
            const health = await scraperConfigService.checkSystemHealth();
            if (!health.healthy) {
                throw new Error(`System unhealthy: ${health.errors.join(', ')}`);
            }
        }
        
        // Validate tool assignment
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        if (!userData.assignedAutomations || !userData.assignedAutomations.includes('lead_finder')) {
            throw new Error('Lead Finder tool not assigned to your account');
        }
        
        // Check global job limit
        const globalLimit = await scraperConfigService.checkGlobalJobLimit();
        if (!globalLimit.allowed) {
            throw new Error(`Global job limit reached (${globalLimit.current}/${globalLimit.limit}). Please try again later.`);
        }
        
        // Check per-user job limit
        const userLimit = await scraperConfigService.checkUserJobLimit(userId);
        if (!userLimit.allowed) {
            throw new Error(`You already have ${userLimit.current} active job(s). Maximum ${userLimit.limit} allowed.`);
        }

        // Get web search service
        const webSearch = getWebSearchService();
        if (!webSearch) {
            throw new Error('Web search service not available. Please try again later.');
        }

        // Discover websites automatically
        console.log(`🔍 Discovering websites for ${niche} in ${country}...`);
        const websites = await webSearch.searchWebsites(niche, country, limit, true);
```

**Replace with this**:
```javascript
const startAutomatedLeadFinder = async (userId, country, niche, limit = 500) => {
    try {
        // Load configuration
        const config = await scraperConfigService.getScraperConfig();
        
        // System health check
        if (config.require_health_check) {
            const health = await scraperConfigService.checkSystemHealth();
            if (!health.healthy) {
                throw new Error(`System unhealthy: ${health.errors.join(', ')}`);
            }
        }
        
        // Validate tool assignment
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        if (!userData.assignedAutomations || !userData.assignedAutomations.includes('lead_finder')) {
            throw new Error('Lead Finder tool not assigned to your account');
        }
        
        // Check global job limit
        const globalLimit = await scraperConfigService.checkGlobalJobLimit();
        if (!globalLimit.allowed) {
            throw new Error(`Global job limit reached (${globalLimit.current}/${globalLimit.limit}). Please try again later.`);
        }
        
        // Check per-user job limit
        const userLimit = await scraperConfigService.checkUserJobLimit(userId);
        if (!userLimit.allowed) {
            throw new Error(`You already have ${userLimit.current} active job(s). Maximum ${userLimit.limit} allowed.`);
        }

        // UPGRADED: Fetch user's SERP API key from Firestore
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

        console.log(`Using SERP API key for user: ${userId}`);

        // Get web search service
        const webSearch = getWebSearchService();
        if (!webSearch) {
            throw new Error('Web search service not available. Please try again later.');
        }

        // Discover websites automatically - PASS USER'S API KEY
        console.log(`🔍 Discovering websites for ${niche} in ${country}...`);
        const websites = await webSearch.searchWebsites(niche, country, limit, true, userSerpApiKey);
```

### Change 2: Update Activity Logging

**Find this section** (around line 280-300):
```javascript
        // Log activity with enhanced details
        await db.collection('activity_logs').add({
            userId,
            action: 'scrape_started',
            message: `Lead Finder job started for ${niche} in ${country}`,
            metadata: {
                jobId: jobRef.id,
                country,
                niche,
                websitesDiscovered: validWebsites.length,
                limit,
                proxyEnabled: config.proxy_enabled,
                emailVerificationEnabled: config.email_verification_enabled
            },
            timestamp: now
        });
```

**Replace with this**:
```javascript
        // Log activity with enhanced details
        await db.collection('activity_logs').add({
            userId,
            action: 'scrape_started',
            message: `Lead Finder job started for ${niche} in ${country}`,
            metadata: {
                jobId: jobRef.id,
                country,
                niche,
                websitesDiscovered: validWebsites.length,
                limit,
                proxyEnabled: config.proxy_enabled,
                emailVerificationEnabled: config.email_verification_enabled,
                userApiKeyUsed: !!userSerpApiKey
            },
            timestamp: now
        });
```

## Summary of Changes

### What's New
1. Fetch user's SERP API key from `lead_finder_config` collection
2. Validate API key exists (user key or global fallback)
3. Pass user's API key to `searchWebsites()` function
4. Log whether user API key was used

### Backward Compatibility
- Falls back to global `process.env.SERPAPI_API_KEY` if user key not set
- Existing jobs continue to work
- No breaking changes to API

### Error Handling
- Clear error message if no API key configured
- Logs warning if user config fetch fails
- Continues with global key as fallback

## Testing the Changes

### Test 1: User with API Key
```javascript
// Setup
const userId = 'test-user-123';
const apiKey = 'your-serp-api-key';

// Add API key to Firestore
await db.collection('lead_finder_config').doc(userId).set({
    user_id: userId,
    api_key: apiKey,
    daily_limit: 500,
    max_concurrent_jobs: 1,
    status: 'active',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp()
});

// Start job
const result = await startAutomatedLeadFinder(userId, 'USA', 'Software Companies', 100);

// Verify
console.log('Job started:', result.jobId);
console.log('Websites discovered:', result.websitesDiscovered);
```

### Test 2: User without API Key (Fallback)
```javascript
// Setup
const userId = 'test-user-456';
// Don't add API key to Firestore

// Start job (should use global API key)
const result = await startAutomatedLeadFinder(userId, 'USA', 'Software Companies', 100);

// Verify
console.log('Job started:', result.jobId);
console.log('Using global API key as fallback');
```

### Test 3: No API Key Available
```javascript
// Setup
const userId = 'test-user-789';
// Don't add API key to Firestore
// Don't set process.env.SERPAPI_API_KEY

// Start job (should fail)
try {
    await startAutomatedLeadFinder(userId, 'USA', 'Software Companies', 100);
} catch (error) {
    console.log('Expected error:', error.message);
    // Should output: "SERP API key not configured for this user..."
}
```

## Deployment

### Step 1: Update Code
Replace the `startAutomatedLeadFinder` function in `functions/src/services/leadFinderService.js` with the changes above.

### Step 2: Test Locally
```bash
firebase emulators:start
# Run the three test cases above
```

### Step 3: Deploy
```bash
firebase deploy --only functions
```

### Step 4: Verify
```bash
firebase functions:log
# Look for "Using SERP API key for user: {userId}"
# Look for "Websites discovered: {count}"
```

## Rollback

If issues occur:
```bash
# Revert to previous version
git checkout HEAD~1 functions/src/services/leadFinderService.js
firebase deploy --only functions
```

## Files Modified

- ✅ `functions/src/services/leadFinderWebSearchService.js` - Already updated
- ⏳ `functions/src/services/leadFinderService.js` - Apply changes above

## Next Steps

1. Apply the code changes above
2. Test with user API key
3. Test with global API key fallback
4. Deploy to production
5. Monitor logs for errors
6. Gather user feedback
