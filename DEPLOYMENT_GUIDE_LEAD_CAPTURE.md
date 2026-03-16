# Smart Lead Capture - Deployment Guide

## 🚀 Production Deployment Checklist

### Prerequisites

- ✅ Firebase project created
- ✅ WhatsApp Business Account
- ✅ WhatsApp Phone Number ID
- ✅ WhatsApp Access Token
- ✅ Node.js 18+ installed
- ✅ Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Environment Setup

### 1.1 Configure Environment Variables

Create `functions/.env`:

```bash
# WhatsApp Configuration
WHATSAPP_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
VERIFY_TOKEN=your_custom_verify_token

# OpenAI Configuration (for legacy intent detection)
OPENAI_API_KEY=your_openai_api_key

# Environment
NODE_ENV=production
```

### 1.2 Set Firebase Functions Config

```bash
cd functions

# Set WhatsApp config
firebase functions:config:set \
  whatsapp.token="your_whatsapp_access_token" \
  whatsapp.phone_number_id="your_phone_number_id" \
  whatsapp.verify_token="your_custom_verify_token" \
  openai.api_key="your_openai_api_key"

# View config
firebase functions:config:get
```

## Step 2: Deploy Firestore Rules

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Verify rules deployed
firebase firestore:rules get
```

## Step 3: Deploy Cloud Functions

```bash
# Install dependencies
cd functions
npm install

# Deploy functions
firebase deploy --only functions

# Get function URL
firebase functions:list
```

Your webhook URL will be:
```
https://<region>-<project-id>.cloudfunctions.net/whatsappWebhook/webhook
```

## Step 4: Configure WhatsApp Webhook

### 4.1 Set Webhook URL

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app
3. Go to WhatsApp > Configuration
4. Click "Edit" next to Webhook
5. Enter your webhook URL:
   ```
   https://<region>-<project-id>.cloudfunctions.net/whatsappWebhook/webhook
   ```
6. Enter your `VERIFY_TOKEN`
7. Click "Verify and Save"

### 4.2 Subscribe to Webhook Fields

Subscribe to:
- ✅ messages
- ✅ message_status (optional)

## Step 5: Create Your First Client

### Option A: Using Setup Script

```bash
cd functions

# Edit src/scripts/setupClient.js
# Uncomment the client type you want to create
# Update whatsappNumberId with your actual ID

# Run script
node src/scripts/setupClient.js
```

### Option B: Using Firestore Console

1. Go to Firebase Console > Firestore
2. Create collection: `clients`
3. Add document with auto-ID:

```json
{
  "industryType": "restaurant",
  "whatsappNumberId": "YOUR_WHATSAPP_PHONE_NUMBER_ID",
  "profile": {
    "name": "My Restaurant",
    "whatsappNumber": "+1234567890",
    "email": "contact@myrestaurant.com",
    "address": "123 Main St",
    "website": "https://myrestaurant.com"
  },
  "botConfig": {
    "botEnabled": true,
    "customQuestions": [
      {
        "key": "partySize",
        "question": "How many people will be dining?"
      },
      {
        "key": "preferredDate",
        "question": "What date would you prefer?"
      },
      {
        "key": "preferredTime",
        "question": "What time works best for you?"
      }
    ],
    "greetingMessage": "👋 Welcome! Let's book your table.",
    "completionMessage": "✅ Reservation received! We'll confirm shortly."
  },
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Step 6: Test the Bot

### 6.1 Send Test Message

Send a WhatsApp message to your business number:
```
Hello
```

Expected response:
```
👋 Welcome! Let's book your table.

To get started, may I have your name?
```

### 6.2 Complete Flow Test

1. Send: `John Doe`
2. Bot asks for contact
3. Send: `john@example.com`
4. Bot asks first question
5. Answer all questions
6. Bot confirms and saves lead

### 6.3 Test Human Handoff

Send: `HUMAN`

Expected response:
```
🤝 I've notified our team. Someone will reach out to you shortly!

In the meantime, feel free to share any additional details.
```

## Step 7: Monitor & Verify

### 7.1 Check Cloud Functions Logs

```bash
# View logs
firebase functions:log

# Stream logs in real-time
firebase functions:log --only whatsappWebhook
```

### 7.2 Check Firestore Data

1. Go to Firebase Console > Firestore
2. Check collections:
   - `clients/{clientId}/leads` - Should have new lead
   - `clients/{clientId}/messages` - Should have conversation
   - `leadCaptureStates` - Should have state records

### 7.3 Verify Lead Captured

```javascript
// Query leads
const db = admin.firestore();
const leads = await db.collection('clients')
  .doc(clientId)
  .collection('leads')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

leads.forEach(doc => {
  console.log(doc.id, doc.data());
});
```

## Step 8: Production Optimization

### 8.1 Enable Firestore Indexes

Create composite indexes for common queries:

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

Add to `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 8.2 Set Function Memory & Timeout

Update `functions/index.js`:

```javascript
exports.whatsappWebhook = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
    maxInstances: 100
  })
  .https.onRequest(app);
```

### 8.3 Enable Error Reporting

```bash
# Install error reporting
npm install @google-cloud/error-reporting

# Add to functions
const {ErrorReporting} = require('@google-cloud/error-reporting');
const errors = new ErrorReporting();
```

## Step 9: Scaling Considerations

### 9.1 Rate Limiting

Current limits:
- 10 messages per minute per phone number
- Adjust in `webhookUnified.js`:

```javascript
const RATE_LIMIT_MAX_MESSAGES = 20; // Increase if needed
```

### 9.2 Duplicate Prevention

Current window:
- 24 hours for duplicate leads
- 5 minutes for duplicate messages

Adjust in `leadCaptureFlow.js`:

```javascript
const oneDayAgo = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours
```

### 9.3 Message Queue (Optional)

For high volume, consider using Cloud Tasks:

```javascript
const {CloudTasksClient} = require('@google-cloud/tasks');
const client = new CloudTasksClient();

// Queue message processing
await client.createTask({
  parent: queuePath,
  task: {
    httpRequest: {
      httpMethod: 'POST',
      url: processingUrl,
      body: Buffer.from(JSON.stringify(messageData)).toString('base64')
    }
  }
});
```

## Step 10: Monitoring & Alerts

### 10.1 Set Up Cloud Monitoring

```bash
# View metrics
gcloud monitoring dashboards list

# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="WhatsApp Bot Errors" \
  --condition-display-name="Error Rate" \
  --condition-threshold-value=10 \
  --condition-threshold-duration=60s
```

### 10.2 Set Up Log-Based Metrics

1. Go to Cloud Console > Logging
2. Create log-based metric:
   - Name: `whatsapp_lead_captured`
   - Filter: `textPayload:"Lead created"`
   - Metric type: Counter

### 10.3 Dashboard Metrics

Track:
- Total leads captured
- Leads per client
- Human handoff requests
- Error rate
- Response time
- Rate limit hits

## Troubleshooting

### Issue: Webhook Not Receiving Messages

**Check:**
1. Webhook URL is correct
2. VERIFY_TOKEN matches
3. Webhook is subscribed to "messages"
4. Cloud Function is deployed
5. Check function logs for errors

**Fix:**
```bash
# Redeploy function
firebase deploy --only functions:whatsappWebhook

# Check logs
firebase functions:log --only whatsappWebhook
```

### Issue: Leads Not Saving

**Check:**
1. Client exists in Firestore
2. whatsappNumberId matches
3. Firestore rules allow writes
4. Check function logs

**Fix:**
```bash
# Verify client
firebase firestore:get clients/{clientId}

# Check rules
firebase firestore:rules get
```

### Issue: Bot Not Responding

**Check:**
1. botEnabled is true
2. Client status is "active"
3. Rate limit not exceeded
4. Message type is supported

**Fix:**
```javascript
// Check client config
const client = await getClientById(clientId);
console.log(client.botConfig.botEnabled);
console.log(client.status);
```

## Security Checklist

- ✅ Environment variables secured
- ✅ Firestore rules deployed
- ✅ HTTPS only (enforced by Cloud Functions)
- ✅ Input validation enabled
- ✅ Rate limiting enabled
- ✅ Duplicate prevention enabled
- ✅ Error handling implemented
- ✅ Logging enabled
- ✅ No hardcoded secrets

## Performance Checklist

- ✅ Async message processing
- ✅ 200 OK response before processing
- ✅ In-memory caching for rate limits
- ✅ Efficient Firestore queries
- ✅ Composite indexes created
- ✅ Function memory optimized
- ✅ Timeout configured

## Compliance Checklist

- ✅ WhatsApp Business Policy compliant
- ✅ GDPR compliant (data retention)
- ✅ User consent obtained
- ✅ Privacy policy linked
- ✅ Opt-out mechanism available
- ✅ Data encryption at rest
- ✅ Audit logging enabled

## Next Steps

1. ✅ Deploy to production
2. ✅ Test with real users
3. ✅ Monitor metrics
4. ✅ Set up alerts
5. ✅ Create dashboard
6. ✅ Document processes
7. ✅ Train support team
8. ✅ Plan scaling strategy

## Support

For issues or questions:
- Check logs: `firebase functions:log`
- Review documentation: `functions/SMART_LEAD_CAPTURE_README.md`
- Contact: [your-email@example.com]

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Production URL:** _____________

**Status:** ✅ DEPLOYED
