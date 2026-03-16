# Smart Lead Capture WhatsApp Bot

## 🎯 Overview

Production-ready WhatsApp automation system that captures leads across multiple industries:
- **Restaurants** - Dining reservations
- **Hotels** - Room bookings
- **SaaS/Services** - Lead generation
- **Spa/Salon** - Appointment booking
- **Clinics** - Medical appointments
- **Gyms** - Membership inquiries

## ✨ Key Features

### ✅ Universal Lead Flow
1. Greet user
2. Ask name
3. Ask phone/email
4. Ask business requirement (dynamic per client)
5. Store lead in Firestore under correct client
6. Offer human handoff option

### ✅ Client-Based Configuration
Each client has:
- `industryType` - Determines default questions
- `customQuestions[]` - Override default questions
- `whatsappNumberId` - WhatsApp Phone Number ID
- `botEnabled` - Enable/disable bot
- `greetingMessage` - Custom greeting
- `completionMessage` - Custom completion message

### ✅ Firestore Structure
```
clients/{clientId}
├── profile
│   ├── name
│   ├── whatsappNumber
│   ├── email
│   └── address
├── botConfig
│   ├── botEnabled
│   ├── customQuestions[]
│   ├── greetingMessage
│   └── completionMessage
├── leads/{leadId}
│   ├── name
│   ├── phone
│   ├── email
│   ├── requirement (dynamic fields)
│   ├── source = "whatsapp"
│   ├── timestamp
│   ├── clientId
│   └── status
└── messages/{messageId}
    ├── from
    ├── text
    ├── direction
    └── timestamp
```

### ✅ Industry-Specific Questions

**Restaurant:**
- How many people will be dining?
- What date would you prefer?
- What time works best for you?

**Hotel:**
- What is your check-in date?
- What is your check-out date?
- How many guests will be staying?

**SaaS/Service:**
- What service are you interested in?
- What is your approximate monthly budget?
- When would you like to get started?

**Spa/Salon:**
- What type of service are you interested in?
- What date would you prefer?
- How many people will be joining?

**Clinic:**
- What type of appointment do you need?
- What date would you prefer?
- Please briefly describe your concern

**Gym:**
- What type of membership are you interested in?
- What are your fitness goals?
- When would you like to start?

### ✅ Human Handoff
- User can type "HUMAN" at any time
- Bot marks conversation: `needsHuman = true`
- Bot stops automated replies
- Team is notified to take over

### ✅ Production Safety
- ✅ No hardcoded client IDs
- ✅ No global state
- ✅ Input validation
- ✅ Duplicate lead prevention (24-hour window)
- ✅ Rate limiting (10 messages/minute)
- ✅ Duplicate message protection
- ✅ Works in Firebase emulator and production

## 🚀 Quick Start

### 1. Create a Client

```javascript
const { createClient } = require('./src/services/clientService');

const clientData = {
    name: 'My Restaurant',
    industryType: 'restaurant',
    whatsappNumberId: 'YOUR_WHATSAPP_PHONE_NUMBER_ID',
    whatsappNumber: '+1234567890',
    email: 'contact@myrestaurant.com',
    botEnabled: true,
    customQuestions: [
        { key: 'partySize', question: 'How many people?' },
        { key: 'date', question: 'What date?' },
        { key: 'time', question: 'What time?' }
    ],
    greetingMessage: '👋 Welcome! Let\'s book your table.',
    completionMessage: '✅ Reservation received! We\'ll confirm shortly.'
};

const clientId = await createClient(clientData);
```

### 2. Configure WhatsApp Webhook

Point your WhatsApp webhook to:
```
https://<region>-<project-id>.cloudfunctions.net/whatsappWebhook/webhook
```

### 3. Test

Send a message to your WhatsApp number and the bot will:
1. Greet you
2. Ask for your name
3. Ask for contact info
4. Ask industry-specific questions
5. Save lead to Firestore
6. Offer human handoff

## 📁 File Structure

```
functions/
├── src/
│   ├── leadCapture/
│   │   └── leadCaptureFlow.js      # Main lead capture logic
│   ├── services/
│   │   ├── clientService.js        # Client management
│   │   ├── restaurantService.js    # Legacy restaurant (backward compat)
│   │   └── userService.js          # User state management
│   ├── whatsapp/
│   │   ├── webhookUnified.js       # New unified webhook
│   │   ├── webhook.js              # Legacy webhook
│   │   └── sender.js               # WhatsApp message sender
│   └── scripts/
│       └── setupClient.js          # Client setup helper
└── index.js                        # Firebase Functions entry point
```

## 🔧 Configuration

### Environment Variables

Required in `.env` or Firebase Functions config:

```bash
WHATSAPP_TOKEN=your_whatsapp_token
PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_verify_token
OPENAI_API_KEY=your_openai_key
```

### Client Configuration

```javascript
{
    industryType: 'restaurant' | 'hotel' | 'saas' | 'service' | 'spa' | 'salon' | 'clinic' | 'gym',
    whatsappNumberId: 'string',
    profile: {
        name: 'string',
        whatsappNumber: 'string',
        email: 'string',
        address: 'string',
        website: 'string'
    },
    botConfig: {
        botEnabled: boolean,
        customQuestions: [
            { key: 'string', question: 'string' }
        ],
        greetingMessage: 'string',
        completionMessage: 'string'
    },
    status: 'active' | 'suspended'
}
```

## 🧪 Testing

### Test with Firebase Emulator

```bash
# Start emulator
firebase emulators:start

# Send test message
curl -X POST http://localhost:5001/<project-id>/<region>/whatsappWebhook/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
        "changes": [{
            "value": {
                "metadata": { "phone_number_id": "YOUR_ID" },
                "messages": [{
                    "from": "1234567890",
                    "id": "test123",
                    "type": "text",
                    "text": { "body": "Hello" }
                }]
            }
        }]
    }]
}'
```

### Test Human Handoff

Send message: `HUMAN`

Expected response:
```
🤝 I've notified our team. Someone will reach out to you shortly!

In the meantime, feel free to share any additional details.
```

## 📊 Monitoring

### View Leads

```javascript
const { getClientLeads } = require('./src/services/clientService');

const leads = await getClientLeads(clientId, 50);
console.log(leads);
```

### View Client Stats

```javascript
const { getClientStats } = require('./src/services/clientService');

const stats = await getClientStats(clientId);
console.log(stats);
// {
//     totalLeads: 150,
//     leadsLast30Days: 45,
//     pendingHumanHandoff: 3
// }
```

## 🔄 Migration from Legacy System

The system maintains backward compatibility with the legacy restaurant booking system.

### Routing Logic

1. Check if `phoneNumberId` matches a **client** (new system)
   - If yes → Use Smart Lead Capture
2. If not, check if `phoneNumberId` matches a **restaurant** (legacy)
   - If yes → Use legacy booking flow
3. If neither → Log error and exit safely

### Migrating a Restaurant to Client

```javascript
// 1. Create client from restaurant data
const clientData = {
    name: restaurant.name,
    industryType: 'restaurant',
    whatsappNumberId: restaurant.whatsappNumberId,
    whatsappNumber: restaurant.whatsappNumber,
    botEnabled: true
};

const clientId = await createClient(clientData);

// 2. Update WhatsApp webhook (if needed)
// 3. Test with new client
// 4. Archive old restaurant record
```

## 🛡️ Security & Best Practices

### Input Validation
- All user input is sanitized
- Email format validation
- Phone number format validation
- Name length validation

### Rate Limiting
- 10 messages per minute per phone number
- Automatic cleanup of old rate limit records

### Duplicate Prevention
- Duplicate message detection (5-minute cache)
- Duplicate lead prevention (24-hour window)

### Error Handling
- All errors are caught and logged
- No uncaught exceptions
- Graceful degradation
- Never crashes on invalid input

## 📈 Scaling

### Multi-Tenant Architecture
- Each client is isolated
- No shared state between clients
- Firestore subcollections for tenant isolation

### Performance
- In-memory caching for rate limits
- Efficient Firestore queries
- Async message processing
- 200 OK response before processing

## 🆘 Troubleshooting

### Bot Not Responding

1. Check client exists:
   ```javascript
   const client = await getClientByPhoneNumberId(phoneNumberId);
   console.log(client);
   ```

2. Check bot is enabled:
   ```javascript
   console.log(client.botConfig.botEnabled);
   ```

3. Check WhatsApp webhook configuration

### Leads Not Saving

1. Check Firestore rules allow writes to `clients/{clientId}/leads`
2. Check client ID is correct
3. Check for duplicate lead prevention (24-hour window)

### Human Handoff Not Working

1. Check user typed exactly "HUMAN" (case-insensitive)
2. Check `leadCaptureStates` collection for `needsHuman = true`
3. Check client messages for handoff notification

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For support, contact: [your-email@example.com]

---

**Built with ❤️ for multi-industry WhatsApp automation**
