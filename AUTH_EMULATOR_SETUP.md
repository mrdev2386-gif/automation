# Firebase Auth Emulator Setup

## Quick Setup - Automatic Test User

### 1. Start Emulators
```bash
cd functions
firebase emulators:start
```

### 2. Create Test User (Automatic)
Open in browser:
```
http://localhost:5001/waautomation-13fa6/us-central1/seedTestUser
```

This creates:
- **Email:** test@example.com
- **Password:** test123456
- **Role:** client_user
- **Tools:** lead_finder, ai_lead_agent

### 3. Login to Dashboard
```
http://localhost:5173
```

Use credentials:
- Email: test@example.com
- Password: test123456

---

## Manual Setup (Alternative)

### 1. Open Emulator UI
```
http://localhost:4001
```

### 2. Go to Authentication → Users

### 3. Click "Add User"

### 4. Enter Details
- Email: test@example.com
- Password: test123456

### 5. Save User

### 6. Add Firestore Document

Go to Firestore tab and create:

**Collection:** users
**Document ID:** [copy UID from Auth]
**Fields:**
```json
{
  "uid": "[paste UID]",
  "email": "test@example.com",
  "role": "client_user",
  "isActive": true,
  "clientKey": "client_test_123",
  "assignedAutomations": ["lead_finder", "ai_lead_agent"],
  "createdAt": [timestamp]
}
```

---

## Troubleshooting

### User Already Exists
If you see "email-already-exists", the test user is already created. Just login.

### Can't Login
1. Check emulators are running: http://localhost:4001
2. Verify Auth emulator shows the user
3. Check browser console for errors
4. Ensure dashboard is connected to emulator (see console logs)

### Clear Emulator Data
Stop emulators and delete:
```
functions/.firebase/
```

Then restart emulators.

---

## Production Users

For production, use the admin panel to create users:
1. Login as super_admin
2. Go to Users page
3. Click "Create User"
4. Assign tools
5. User receives credentials

---

**Quick Test:** http://localhost:5001/waautomation-13fa6/us-central1/seedTestUser
