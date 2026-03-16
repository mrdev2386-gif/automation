# Smart Lead Capture - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Deploy Functions (2 min)

```bash
cd functions

# Install dependencies
npm install

# Deploy to Firebase
firebase deploy --only functions,firestore:rules
```

### Step 2: Get Your Webhook URL (30 sec)

```bash
firebase functions:list
```

Copy the URL:
```
https://<region>-<project-id>.cloudfunctions.net/whatsappWebhook/webhook
```

### Step 3: Configure WhatsApp (1 min)

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app → WhatsApp → Configuration
3. Click "Edit" next to Webhook
4. Paste your webhook URL
5. Enter your VERIFY_TOKEN
6. Click "Verify and Save"
7. Subscribe to "messages"

### Step 4: Create Your First Client (1 min)

Open Firebase Console → Firestore → Create collection `clients`:

```json
{
  "industryType": "restaurant",
  "whatsappNumberId": "YOUR_WHATSAPP_PHONE_NUMBER_ID",
  "profile": {
    "name": "My Restaurant",
    "whatsappNumber": "+1234567890",
    "email": "contact@myrestaurant.com"
  },
  "botConfig": {
    "botEnabled": true,
    "customQuestions": [
      { "key": "partySize", "question": "How many people?" },
      { "key": "date", "question": "What date?" },
      { "key": "time", "question": "What time?" }
    ],
    "greetingMessage": "👋 Welcome! Let's book your table.",
    "completionMessage": "✅ Reservation received!"
  },
  "status": "active"
}
```

### Step 5: Test! (30 sec)

Send a WhatsApp message to your business number:
```
Hello
```

Expected response:
```
👋 Welcome! Let's book your table.

To get started, may I have your name?
```

## ✅ That's It!

Your Smart Lead Capture bot is now live and capturing leads!

---

## 📊 View Your Leads

Go to Firebase Console → Firestore:
```
clients/{your-client-id}/leads
```

---

## 🆘 Need Help?

- **Full Documentation:** `functions/SMART_LEAD_CAPTURE_README.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE_LEAD_CAPTURE.md`
- **Summary:** `SMART_LEAD_CAPTURE_SUMMARY.md`

---

## 🎯 Next Steps

1. ✅ Test human handoff (send "HUMAN")
2. ✅ Customize questions for your industry
3. ✅ Add more clients
4. ✅ Monitor leads in Firestore
5. ✅ Set up notifications

---

**Happy Lead Capturing! 🎉**
