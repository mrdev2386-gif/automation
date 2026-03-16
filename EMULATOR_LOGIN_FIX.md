# Quick Fix: Login with Firebase Auth Emulator

## Automatic Setup (Recommended)

### 1. Start Emulators
```bash
cd functions
firebase emulators:start
```

### 2. Create Test User
Open in browser:
```
http://localhost:5001/waautomation-13fa6/us-central1/seedTestUser
```

You should see:
```json
{
  "success": true,
  "uid": "...",
  "email": "mrdev2386@gmail.com",
  "message": "Test user created successfully"
}
```

### 3. Login to Dashboard
```
http://localhost:5173
```

**Credentials:**
- Email: mrdev2386@gmail.com
- Password: test123456

---

## Manual Setup (Alternative)

### 1. Open Emulator UI
```
http://localhost:4001
```

### 2. Go to Authentication → Users

### 3. Click "Add User"

### 4. Enter:
- Email: mrdev2386@gmail.com
- Password: test123456

### 5. Click "Save"

### 6. Add Firestore Document

Go to Firestore tab:
- Collection: `users`
- Document ID: [copy UID from Auth tab]
- Fields:
```json
{
  "uid": "[paste UID here]",
  "email": "mrdev2386@gmail.com",
  "role": "client_user",
  "isActive": true,
  "clientKey": "client_test_123",
  "assignedAutomations": ["lead_finder", "ai_lead_agent"]
}
```

---

## Important Notes

⚠️ **Emulator vs Production:**
- Emulator users (localhost:9100) are separate from production
- Production users from Firebase Console won't work in emulator
- Emulator data is cleared when you stop the emulator

✅ **Quick Test:**
1. Visit: http://localhost:5001/waautomation-13fa6/us-central1/seedTestUser
2. Login: http://localhost:5173
3. Use: mrdev2386@gmail.com / test123456

---

## Troubleshooting

### "User already exists"
Good! Just login with the credentials.

### Can't see user in emulator
1. Open http://localhost:4001
2. Go to Authentication tab
3. User should be listed there

### Login fails
1. Check emulators are running
2. Check browser console for errors
3. Verify dashboard shows: "🔧 Connected to Firebase Emulators"

### Clear emulator data
```bash
# Stop emulators (Ctrl+C)
# Delete emulator data
rm -rf functions/.firebase
# Restart
firebase emulators:start
```

---

**Quick Start:** http://localhost:5001/waautomation-13fa6/us-central1/seedTestUser
