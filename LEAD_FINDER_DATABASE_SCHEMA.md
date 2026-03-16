# Lead Finder Tool - Database Schema & Setup Guide

## Database Collections

### 1. `automations` Collection
Stores all available tools/automations in the system.

**Document ID:** `lead_finder` (for Lead Finder tool)

```json
{
  "id": "lead_finder",
  "name": "Lead Finder",
  "description": "Find and extract business emails from websites using web scraping",
  "category": "lead_generation",
  "icon": "search",
  "isActive": true,
  "features": [
    "Search by country and niche",
    "Automatic website scraping",
    "Email extraction",
    "CSV export",
    "Batch processing"
  ],
  "maxResults": 500,
  "rateLimit": {
    "jobsPerDay": 5,
    "websitesPerJob": 500
  },
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### 2. `users` Collection
Platform users with their tool assignments.

**Important Fields:**
- `uid` (string): Firebase Auth UID
- `email` (string): User email
- `role` (string): "super_admin" or "client_user"
- `isActive` (boolean): Account status
- `assignedAutomations` (array): Tool IDs assigned to this user (e.g., ["lead_finder"])
- `createdAt` (Timestamp): Account creation date

**Example with Lead Finder assigned:**
```json
{
  "uid": "user123",
  "email": "john@example.com",
  "role": "client_user",
  "isActive": true,
  "assignedAutomations": ["lead_finder", "whatsapp_chatbot"],
  "createdAt": "Timestamp",
  "lastLogged": "Timestamp"
}
```

### 3. `lead_finder_jobs` Collection
Stores Lead Finder search jobs and their progress.

**Document ID:** Auto-generated

```json
{
  "id": "job123",
  "userId": "user123",
  "country": "UAE",
  "niche": "Real Estate",
  "limit": 500,
  "status": "in_progress", // queued, in_progress, completed, failed
  "progress": {
    "websitesScanned": 45,
    "emailsFound": 120,
    "startedAt": "Timestamp",
    "updatedAt": "Timestamp"
  },
  "results": [
    {
      "url": "https://example-realestate.com",
      "businessName": "Example Real Estate",
      "emails": ["contact@example-realestate.com"],
      "success": true,
      "error": null
    }
  ],
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "error": null // Only if status = "failed"
}
```

### 4. `leads` Collection
Stores extracted leads/emails from Lead Finder.

**Document ID:** Auto-generated

```json
{
  "id": "lead123",
  "userId": "user123",
  "businessName": "Example Real Estate Company",
  "website": "https://example-realestate.com",
  "email": "contact@example-realestate.com",
  "country": "UAE",
  "niche": "Real Estate",
  "source": "lead_finder",
  "status": "new", // new, contacted, qualified
  "jobId": "job123",
  "createdAt": "Timestamp"
}
```

### 5. `activity_logs` Collection
Logs all platform activities for audit trail.

**Fields for Lead Finder actions:**
- `LEAD_FINDER_STARTED`: When user starts a search job
- `WEBSITES_SUBMITTED_FOR_SCRAPING`: When websites are submitted
- `LEADS_DELETED`: When user deletes leads

```json
{
  "userId": "user123",
  "action": "LEAD_FINDER_STARTED",
  "metadata": {
    "jobId": "job123",
    "country": "UAE",
    "niche": "Real Estate",
    "limit": 500
  },
  "timestamp": "Timestamp"
}
```

## Security & Access Control

### Tool Assignment
- **Admin assigns tools to users** via admin panel
- Users can only access tools in their `assignedAutomations` array
- Lead Finder route `/lead-finder` is protected and only accessible if user has "lead_finder" in `assignedAutomations`

### Data Isolation
- Users can only view their own leads (filtered by `userId`)
- Users can only see their own jobs
- Admin can view all leads and jobs
- Deleting leads only works for the user's own data

### Rate Limiting
- **1 active scraping job per user** at a time
- **Maximum 500 websites per run**
- **2-3 second delay** between website requests (configurable in leadFinderService.js)

## Firestore Security Rules

Add these rules to your `firestore.rules`:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Lead Finder Jobs - User can only access their own jobs
    match /lead_finder_jobs/{jobId} {
      allow read: if request.auth.uid == resource.data.userId 
                     || isAdmin(request.auth.uid);
      allow create: if request.auth.uid == request.resource.data.userId
                       && hasLeadFinderAccess(request.auth.uid);
      allow update: if request.auth.uid == resource.data.userId 
                       || isAdmin(request.auth.uid);
    }

    // Leads - User can only access their own leads
    match /leads/{leadId} {
      allow read: if request.auth.uid == resource.data.userId 
                     || isAdmin(request.auth.uid);
      allow delete: if request.auth.uid == resource.data.userId;
      allow update: if request.auth.uid == resource.data.userId;
    }

    // Helper functions
    function isAdmin(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data.role == 'super_admin';
    }

    function hasLeadFinderAccess(uid) {
      let automations = get(/databases/$(database)/documents/users/$(uid)).data.assignedAutomations;
      return automations != null && 'lead_finder' in automations;
    }
  }
}
```

## Setup Instructions

### 1. Initialize Database Collections

Run the setup script to create the Lead Finder automation:

```bash
cd functions
node src/scripts/initializeSystem.js
```

Or call the Cloud Function:

```javascript
const { getFunctions, httpsCallable } = require('firebase/functions');
const functions = getFunctions();
const ensureLeadFinder = httpsCallable(functions, 'ensureLeadFinderAutomation');

await ensureLeadFinder();
```

### 2. Assign Lead Finder to Users

Via Admin Panel:
1. Navigate to Users management
2. Create or edit a user
3. In "Assigned Tools", select "Lead Finder"
4. Click Save

Via Cloud Function:
```javascript
const { getFunctions, httpsCallable } = require('firebase/functions');
const functions = getFunctions();
const updateUser = httpsCallable(functions, 'updateUser');

await updateUser({
  userId: 'user123',
  assignedAutomations: ['lead_finder', 'whatsapp_chatbot']
});
```

### 3. User Login Flow

1. User logs in with their credentials
2. Firebase Auth verifies credentials
3. App loads user profile from `users` collection
4. App checks `assignedAutomations` array
5. If "lead_finder" is present:
   - Show "Lead Finder" nav item in sidebar
   - Allow access to `/lead-finder` route
   - Show Lead Finder in "Your Automations" dashboard

### 4. Installation & Deployment

**Install Dependencies:**
```bash
cd functions
npm install
```

**Deploy Functions:**
```bash
firebase deploy --only functions
```

**Update Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

## API Endpoints (Cloud Functions)

### `startLeadFinder`
Initiates a new Lead Finder job.

**Input:**
```json
{
  "country": "UAE",
  "niche": "Real Estate",
  "limit": 500
}
```

**Output:**
```json
{
  "jobId": "job123",
  "status": "started"
}
```

### `getLeadFinderStatus`
Gets current status of a job.

**Input:**
```json
{
  "jobId": "job123"
}
```

**Output:**
```json
{
  "job": {
    "id": "job123",
    "status": "in_progress",
    "progress": {
      "websitesScanned": 45,
      "emailsFound": 120
    }
  }
}
```

### `submitWebsitesForScraping`
Submits websites to scrape.

**Input:**
```json
{
  "jobId": "job123",
  "websites": [
    "https://example1.com",
    "https://example2.com"
  ]
}
```

**Output:**
```json
{
  "jobId": "job123",
  "websitesScanned": 50,
  "emailsFound": 125,
  "status": "completed"
}
```

### `getMyLeadFinderLeads`
Retrieves user's leads and jobs.

**Output:**
```json
{
  "leads": [
    {
      "id": "lead123",
      "businessName": "Example Co",
      "email": "contact@example.com",
      "website": "https://example.com"
    }
  ],
  "jobs": [
    {
      "id": "job123",
      "country": "UAE",
      "niche": "Real Estate",
      "status": "completed"
    }
  ]
}
```

### `deleteLeadFinderLeads`
Deletes specific leads.

**Input:**
```json
{
  "leadIds": ["lead123", "lead456"]
}
```

**Output:**
```json
{
  "deleted": 2
}
```

## Configuration

### Max Settings (in `leadFinderService.js`)

```javascript
const MAX_WEBSITES_PER_RUN = 500;              // Max websites to scan
const REQUEST_DELAY_MS = 2000;                 // Delay between requests (2-3 sec)
const SCRAPE_TIMEOUT_MS = 30000;               // Page load timeout (30 sec)
const MAX_CONCURRENT_JOBS = 1;                 // Jobs per user
```

### To adjust settings:

Edit `functions/src/services/leadFinderService.js`:

```javascript
// Increase max websites per run to 1000
const MAX_WEBSITES_PER_RUN = 1000;

// Increase delay to 5 seconds between requests
const REQUEST_DELAY_MS = 5000;
```

## Monitoring & Debugging

### Check Job Progress

Open Firebase Console → Firestore → `lead_finder_jobs` collection

Monitor:
- `status` field (should be "in_progress" → "completed")
- `progress.websitesScanned` (increases as scraping progresses)
- `progress.emailsFound` (total emails extracted)

### View Extracted Leads

Firebase Console → Firestore → `leads` collection

Filter by:
- `userId`: See specific user's leads
- `source`: "lead_finder" (to see only Lead Finder leads)
- `status`: "new" (uncontacted leads)

### Check Logs

```bash
firebase functions:log
```

Look for:
- `Scraping [X/Y]:` messages to see scraping progress
- Errors in email extraction or page loading

## Troubleshooting

### Problem: "Lead Finder tool not assigned to your account"
**Solution:** Admin needs to assign the "lead_finder" tool to the user in admin panel

### Problem: Jobs not completing
**Solution:** 
1. Check Firebase logs for errors
2. Ensure Puppeteer is installed: `npm install puppeteer`
3. Check rate limiting - user may have concurrent jobs

### Problem: No emails found
**Solution:**
1. Check website URLs are valid (include https://)
2. Check email extraction regex in service
3. Verify websites have contact/about pages with email visible

### Problem: Slow scraping
**Solution:**
1. Reduce number of websites per job
2. Increase REQUEST_DELAY_MS for stability
3. Consider using a proxy service for large-scale scraping

## Best Practices

1. **Always validate URLs** before submitting for scraping
2. **Start with small batches** (50-100 websites) to test
3. **Monitor Firestore costs** - web scraping uses bandwidth
4. **Implement custom search logic** if needed (integrate with search APIs)
5. **Add email verification** before using extracted emails
6. **Set rate limits appropriately** for your use case
7. **Back up leads periodically** via CSV export

## Next Steps

1. Run the initialization script to create the Lead Finder automation
2. Assign the tool to a test user
3. Log in as that user and navigate to Lead Finder
4. Create a test job with a small number of websites
5. Monitor the scraping process via Firebase Console
6. Verify leads are stored correctly

## Support & Documentation

For more information:
- See `LEAD_FINDER_SERVICE.md` for detailed service documentation
- Check `Cloud Functions` in Firebase Console for real-time logs
- Review Firestore security rules setup
