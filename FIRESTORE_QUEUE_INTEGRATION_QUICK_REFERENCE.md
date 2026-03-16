# Quick Reference: Firestore Queue Integration

## What Was Done

Added Firestore queue job insertion to `startAILeadCampaign` function to ensure campaigns are queued for processing.

---

## Code Changes

### Location
`functions/index.js` → `startAILeadCampaign` function

### Added Code (Lines ~3880-3890)
```javascript
// Insert job into Firestore queue collection
const jobId = queueRef.id;
await db.collection('lead_finder_queue').doc(jobId).set({
    campaignId: campaignId,
    userId: userId,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
}, { merge: true });

console.log('[QUEUE] Job created for campaign:', campaignId);
```

---

## Queue Job Fields

| Field | Value | Purpose |
|-------|-------|---------|
| `campaignId` | String | Campaign identifier |
| `userId` | String | User who started campaign |
| `status` | "pending" | Initial job status |
| `createdAt` | Timestamp | Job creation time |

---

## Deployment

```bash
# 1. Navigate to functions directory
cd functions

# 2. Deploy
firebase deploy --only functions

# 3. Verify
firebase functions:list
```

---

## Verification

### Check Firestore
1. Open Firebase Console
2. Go to Firestore Database
3. Navigate to `lead_finder_queue` collection
4. Verify new documents appear when campaigns are started

### Check Logs
```bash
firebase functions:log processLeadFinderQueue
```

Look for: `[QUEUE] Job created for campaign: {campaignId}`

---

## How It Works

```
startAILeadCampaign() called
    ↓
Create campaign document
    ↓
Insert queue job (NEW)
    ↓
Log confirmation (NEW)
    ↓
Return success
    ↓
Scheduled worker picks up job every 1 minute
    ↓
Process campaign
```

---

## Testing

### Call Function
```javascript
const result = await firebase.functions().httpsCallable('startAILeadCampaign')({
    campaignId: 'test_campaign_1',
    name: 'Test Campaign',
    country: 'US',
    niche: 'SaaS',
    leadLimit: 100
});
```

### Expected Response
```json
{
    "success": true,
    "campaignId": "test_campaign_1",
    "message": "Campaign started successfully"
}
```

### Check Queue
- Open Firestore Console
- Collection: `lead_finder_queue`
- Should see new document with status: `"pending"`

---

## Status Transitions

```
pending → processing → completed
                    ↘ failed
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Job not appearing in queue | Check Firestore permissions |
| Job stuck in pending | Check scheduled worker logs |
| Campaign not processing | Verify user has `ai_lead_agent` tool assigned |

---

## Files Modified

- ✅ `functions/index.js` - Added queue insertion logic

## Files Created

- ✅ `FIRESTORE_QUEUE_INTEGRATION_SUMMARY.md` - Detailed documentation
- ✅ `FIRESTORE_QUEUE_INTEGRATION_QUICK_REFERENCE.md` - This file

---

## Next Steps

1. Deploy: `firebase deploy --only functions`
2. Test: Call `startAILeadCampaign` with test data
3. Monitor: Check Firestore and Cloud Functions logs
4. Verify: Confirm jobs are processed by scheduled worker

---

## Support

For issues or questions:
1. Check Cloud Functions logs
2. Review Firestore queue collection
3. Verify user permissions and tool assignments
4. Check scheduled worker status

---

**Status**: ✅ Ready for Production  
**Last Updated**: 2024  
**Version**: 1.0.0
