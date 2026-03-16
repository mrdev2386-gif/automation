# 🚀 Quick Start - Cloud-Ready WA Automation

## Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account (already configured)

## Installation

```bash
# Navigate to dashboard
cd dashboard

# Install dependencies
npm install
```

## Start Development

```bash
npm run dev
```

**Output**:
```
VITE v5.1.0  ready in 123 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

## Access Application

1. Open browser: `http://localhost:5173`
2. Login with admin-created account
3. Dashboard loads automations from Firebase Cloud

## What Changed

✅ **Removed**:
- Firebase Emulator connections
- Auto-account creation
- Auto-profile creation
- Localhost:5001 requests

✅ **Added**:
- Direct Firebase Cloud connection
- Security checks for admin-created users
- Proper error handling

## Verify It Works

1. **Login**: Use admin-created email/password
2. **Dashboard**: Automations load from Firebase
3. **Lead Finder**: Connects to Cloud Functions
4. **No Errors**: Check browser console for CORS errors (should be none)

## Build for Production

```bash
npm run build
```

## Environment

- **Firebase Project**: waautomation-13fa6
- **Region**: us-central1
- **Auth**: Cloud Firebase Authentication
- **Database**: Cloud Firestore
- **Functions**: Cloud Functions

## Troubleshooting

### "User not found" error
- Admin must create user first
- Cannot auto-create accounts anymore

### "User profile not found" error
- Admin must create Firestore profile
- Cannot auto-create profiles anymore

### CORS errors
- Should not occur - all calls use Firebase SDK
- Check browser console for details

## Support

See `FIREBASE_EMULATOR_REMOVAL_REPORT.md` for detailed changes.
