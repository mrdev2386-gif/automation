# 🔌 Client-Side API Integration Guide

## Quick Reference: HTTP Endpoints with CORS

### Base URL
```javascript
// Local Development
const BASE_URL = 'http://localhost:5001/waautomation-13fa6/us-central1';

// Production
const BASE_URL = 'https://us-central1-waautomation-13fa6.cloudfunctions.net';
```

## 📡 Available Endpoints

### 1. Get My Automations
**Endpoint**: `GET /getMyAutomationsHTTP`

```javascript
async function getMyAutomations() {
  const user = auth.currentUser;
  const token = await user.getIdToken();
  
  const response = await fetch(`${BASE_URL}/getMyAutomationsHTTP`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.automations;
}
```

**Response**:
```json
{
  "automations": [
    {
      "id": "lead_finder",
      "name": "Lead Finder",
      "description": "Find and extract business emails",
      "isActive": true
    }
  ]
}
```

---

### 2. Get Client Config
**Endpoint**: `GET /getClientConfigHTTP`

```javascript
async function getClientConfig() {
  const user = auth.currentUser;
  const token = await user.getIdToken();
  
  const response = await fetch(`${BASE_URL}/getClientConfigHTTP`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.config;
}
```

**Response**:
```json
{
  "config": {
    "clientUserId": "abc123",
    "openaiApiKey": "",
    "openaiApiKeyMasked": true,
    "metaPhoneNumberId": "1234567890",
    "metaAccessToken": "",
    "metaAccessTokenMasked": true,
    "assistantEnabled": true
  }
}
```

---

### 3. Get Lead Finder Leads
**Endpoint**: `GET /getMyLeadFinderLeadsHTTP`

```javascript
async function getLeadFinderLeads() {
  const user = auth.currentUser;
  const token = await user.getIdToken();
  
  const response = await fetch(`${BASE_URL}/getMyLeadFinderLeadsHTTP`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return { leads: data.leads, jobs: data.jobs };
}
```

**Response**:
```json
{
  "leads": [
    {
      "id": "lead_123",
      "email": "contact@example.com",
      "website": "https://example.com",
      "country": "USA",
      "niche": "SaaS"
    }
  ],
  "jobs": [
    {
      "id": "job_456",
      "status": "completed",
      "progress": {
        "websitesScanned": 100,
        "emailsFound": 45
      }
    }
  ]
}
```

---

### 4. Get Lead Finder Config
**Endpoint**: `GET /getLeadFinderConfigHTTP`

```javascript
async function getLeadFinderConfig() {
  const user = auth.currentUser;
  const token = await user.getIdToken();
  
  const response = await fetch(`${BASE_URL}/getLeadFinderConfigHTTP`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}
```

**Response**:
```json
{
  "user_id": "abc123",
  "api_key": "",
  "daily_limit": 500,
  "max_concurrent_jobs": 1,
  "status": "active",
  "hasApiKey": true
}
```

---

## 🛠️ Utility Functions

### API Client Wrapper
```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Convenience methods
  async getMyAutomations() {
    return this.request('/getMyAutomationsHTTP');
  }

  async getClientConfig() {
    return this.request('/getClientConfigHTTP');
  }

  async getLeadFinderLeads() {
    return this.request('/getMyLeadFinderLeadsHTTP');
  }

  async getLeadFinderConfig() {
    return this.request('/getLeadFinderConfigHTTP');
  }
}

// Usage
const api = new APIClient(BASE_URL);
const automations = await api.getMyAutomations();
```

---

## 🔄 React Hook Example

```javascript
import { useState, useEffect } from 'react';
import { auth } from './firebase';

export function useAutomations() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAutomations() {
      try {
        setLoading(true);
        const user = auth.currentUser;
        const token = await user.getIdToken();
        
        const response = await fetch(
          `${BASE_URL}/getMyAutomationsHTTP`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch automations');
        }

        const data = await response.json();
        setAutomations(data.automations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAutomations();
  }, []);

  return { automations, loading, error };
}

// Usage in component
function Dashboard() {
  const { automations, loading, error } = useAutomations();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {automations.map(auto => (
        <div key={auto.id}>{auto.name}</div>
      ))}
    </div>
  );
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process data |
| 401 | Unauthorized | Re-authenticate user |
| 403 | Forbidden | Account disabled |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Retry or contact support |

### Error Response Format
```json
{
  "error": "User account is disabled"
}
```

### Handling Errors
```javascript
try {
  const data = await api.getMyAutomations();
} catch (error) {
  if (error.message.includes('401')) {
    // Re-authenticate
    await auth.signOut();
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // Account disabled
    alert('Your account has been disabled. Contact support.');
  } else {
    // Generic error
    console.error('API Error:', error);
  }
}
```

---

## 🔐 Security Best Practices

1. **Always use HTTPS in production**
2. **Never log tokens to console**
3. **Refresh tokens before expiry**
4. **Handle 401 errors gracefully**
5. **Validate responses before using**

---

## 🧪 Testing

### Test with cURL
```bash
# Get token from Firebase Auth
TOKEN="your-firebase-id-token"

# Test endpoint
curl -X GET http://localhost:5001/waautomation-13fa6/us-central1/getMyAutomationsHTTP \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Test in Browser Console
```javascript
// Get current user token
const token = await firebase.auth().currentUser.getIdToken();

// Test API call
fetch('http://localhost:5001/waautomation-13fa6/us-central1/getMyAutomationsHTTP', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 📝 Migration Checklist

- [ ] Update all API calls to use HTTP endpoints
- [ ] Add Bearer token authentication
- [ ] Update error handling for HTTP status codes
- [ ] Test all endpoints in development
- [ ] Update environment variables for production
- [ ] Deploy and test in production
- [ ] Monitor for errors in Firebase Console

---

**Last Updated**: 2024
**Status**: ✅ Ready for Integration
