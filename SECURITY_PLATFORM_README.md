# WA Automation - Production-Grade Closed Access Platform

## Overview

This is a production-grade closed-access automation platform with Firebase authentication and role-based access control.

## Features

### 🔐 Security Features
- **Public Signup Disabled**: Only admins can create users
- **Role-Based Access Control**: `super_admin` and `client_user` roles
- **Rate Limiting**: 5 login attempts per 15 minutes
- **Firestore Security Rules**: Strict RBAC enforcement
- **App Check Ready**: Pre-configured for Firebase App Check

### 👥 User Management
- Admin-only user creation
- User activation/deactivation
- Automation assignment (multi-select)
- Password reset capability
- User deletion

### 🤖 Automation Management
- Create/edit/delete automations
- Enable/disable automations
- Assignment to users

### 📊 Dashboards
- **Admin Dashboard**: Full platform stats, user management, automation management
- **Client Dashboard**: Only shows assigned automations

## Project Structure

```
WAAUTOMATION/
├── functions/              # Firebase Cloud Functions
│   ├── index.js          # Callable functions (user, automation, stats)
│   └── src/config/       # Firebase admin config
│
├── dashboard/             # React Frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── AdminDashboard.jsx    # Admin main dashboard
│       │   ├── AdminUsers.jsx       # User management
│       │   ├── AdminAutomations.jsx # Automation management
│       │   ├── ClientDashboard.jsx  # Client dashboard
│       │   └── Login.jsx            # Login page
│       └── services/
│           ├── adminFirebase.js     # Admin Firebase service
│           └── firebase-config.js   # Firebase config
│
├── firestore.rules        # Firestore security rules
└── firebase.json         # Firebase configuration
```

## Setup Instructions

### 1. Firebase Configuration

Update `dashboard/.env` with your Firebase config:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Deploy Firebase Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

### 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore
```

### 4. Create Initial Super Admin

Since public signup is disabled, you need to create the first super_admin manually:

1. Go to Firebase Console → Authentication
2. Enable Email/Password authentication
3. Use the Firebase Admin SDK or create a temporary function to create the first user:

```javascript
// In Firebase Console → Firestore
// Create a user document manually:
users/{uid} = {
  uid: "your_uid",
  email: "admin@example.com",
  role: "super_admin",
  isActive: true,
  assignedAutomations: [],
  createdAt: serverTimestamp()
}
```

### 5. Build and Deploy Frontend

```bash
cd dashboard
npm install
npm run build
firebase deploy --only hosting
```

## Firestore Collections

### users
```javascript
{
  uid: string,
  email: string,
  role: "super_admin" | "client_user",
  isActive: boolean,
  assignedAutomations: string[],
  createdAt: timestamp
}
```

### automations
```javascript
{
  id: string,
  name: string,
  description: string,
  isActive: boolean,
  createdAt: timestamp
}
```

### activity_logs
```javascript
{
  userId: string,
  action: string,
  metadata: object,
  timestamp: timestamp
}
```

## API Endpoints (Callable Functions)

### User Management
- `createUser` - Create new user (admin only)
- `updateUser` - Update user details (admin only)
- `deleteUser` - Delete user (admin only)
- `resetUserPassword` - Reset password (admin only)
- `getAllUsers` - List all users (admin only)
- `getUserProfile` - Get current user profile

### Automation Management
- `createAutomation` - Create automation (admin only)
- `updateAutomation` - Update automation (admin only)
- `deleteAutomation` - Delete automation (admin only)
- `getAllAutomations` - List all automations (admin only)
- `getMyAutomations` - Get assigned automations (client)

### Dashboard
- `getDashboardStats` - Get platform statistics (admin only)

## Security Rules

The Firestore security rules enforce:
- Only super_admin can create/update/delete users
- Client users can only read their own data
- All user data is protected
- Activity logs are immutable

## Rate Limiting

- 5 login attempts per 15 minutes
- Rate limit is per email address
- After limit exceeded, user must wait 15 minutes

## Enabling App Check

1. Go to Firebase Console → App Check
2. Register your app (reCAPTCHA v3 or SafetyNet)
3. Enable enforcement for Firestore

## Development

### Run Functions Locally
```bash
cd functions
npm run serve
```

### Run Frontend Locally
```bash
cd dashboard
npm run dev
```

## License

Proprietary - All rights reserved
