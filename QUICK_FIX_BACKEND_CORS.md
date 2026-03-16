# ⚡ Quick Fix - Backend CORS

## 🎯 What Was Fixed

**Issue**: CORS errors when calling HTTP endpoints  
**Solution**: Added HTTP versions with CORS middleware  
**File**: `functions/index.js`

---

## 📊 New Endpoints Added

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `startLeadFinderHTTP` | POST | Start lead search |
| `getLeadFinderStatusHTTP` | POST | Get job status |
| `deleteLeadFinderLeadsHTTP` | POST | Delete leads |

---

## 🔄 CORS Pattern

```javascript
const cors = require('cors')({ origin: true });

exports.myFunctionHTTP = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // Handle OPTIONS preflight
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        // Verify auth token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Function logic
        return res.status(200).json({ success: true });
    });
});
```

---

## 🧪 Test Commands

### Deploy
```bash
# Emulator
firebase emulators:start

# Production
firebase deploy --only functions
```

### Test with curl
```bash
# Get token first
TOKEN="your-firebase-id-token"

# Start search
curl -X POST \
  http://localhost:5001/waautomation-13fa6/us-central1/startLeadFinderHTTP \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"country":"UAE","niche":"Real Estate","limit":500}'
```

---

## ✅ Verification

### Console (F12)
```
✅ No CORS errors
✅ OPTIONS returns 204
✅ POST returns 200
✅ Headers include Access-Control-Allow-Origin
```

### Network Tab
```
Request Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Response Headers:
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS error | Restart emulator |
| 401 Unauthorized | Check token format |
| 403 Forbidden | Verify user has tool assigned |
| 404 Not Found | Check function name spelling |

---

## 📝 Complete Flow

```
Frontend → HTTP Request with Bearer token
    ↓
Firebase Functions → CORS middleware
    ↓
Verify ID token → Get user ID
    ↓
Check permissions → Execute logic
    ↓
Return JSON response with CORS headers
```

---

**Status**: 🟢 FIXED  
**Version**: 1.0.3
