# Admin Panel Authentication Investigation

## Problem Summary
Admin panel login fails with:
- "Error: Not authenticated"
- "Rate limit check failed"

## Root Cause Analysis

### 1. Collection Used for Admin Verification
- **Collection**: `users`
- **Location**: Firestore root collection
- **Required Fields**:
  - `uid` (string) - Firebase Auth UID
  - `email` (string) - User email
  - `role` (string) - Must be "super_admin" for admin access
  - `isActive` (boolean) - Must be true
  - `clientKey` (string) - Unique client identifier
  - `assignedAutomations` (array) - List of automation IDs

### 2. Authentication Flow
```
1. User enters email/password on /login page
2. adminSignIn() calls Firebase Auth REST API
3. getUserProfile() Cloud Function fetches user from 'users' collection
4. Login page checks: role === 'super_admin' && isActive === true
5. If valid, redirect to /admin dashboard
```

### 3. Why Login Fails

**Issue 1: Rate Limit Function Called Before Auth**
- `verifyLoginAttempt` is called in useEffect on login page
- This function requires authentication token
- Called before user has signed in
- Results in "Not authenticated" error

**Issue 2: Missing Admin User Document**
- Email `cryptosourav23@gmail.com` doesn't exist in `users` collection
- Or exists but doesn't have `role: 'super_admin'`
- Or exists but has `isActive: false`

## Required Firestore Document Structure

### Collection: `users`
### Document ID: `<firebase_auth_uid>`

```javascript
{
  uid: "abc123xyz...",                    // Firebase Auth UID
  email: "cryptosourav23@gmail.com",      // Admin email
  role: "super_admin",                    // CRITICAL: Must be "super_admin"
  isActive: true,                         // CRITICAL: Must be true
  clientKey: "client_1234567890_abc123",  // Unique identifier
  assignedAutomations: [],                // Empty array for super_admin
  createdAt: Timestamp,                   // Server timestamp
  updatedAt: Timestamp                    // Server timestamp
}
```

## Solution Steps

### Option 1: Run Setup Script (Recommended)
```bash
cd functions
node scripts/createAdminUser.js
```

Follow prompts to enter:
- Admin email: cryptosourav23@gmail.com
- Admin password: (min 8 characters)

### Option 2: Manual Firestore Setup

1. **Create user in Firebase Auth Console**
   - Go to Firebase Console > Authentication > Users
   - Add user with email: cryptosourav23@gmail.com
   - Set password (min 8 chars)
   - Copy the UID

2. **Create document in Firestore**
   - Go to Firebase Console > Firestore Database
   - Collection: `users`
   - Document ID: `<paste_uid_from_step_1>`
   - Fields:
     ```
     uid: <paste_uid>
     email: "cryptosourav23@gmail.com"
     role: "super_admin"
     isActive: true
     clientKey: "client_1234567890_abc123"
     assignedAutomations: []
     createdAt: <server_timestamp>
     ```

### Option 3: Fix Rate Limit Issue

Edit `apps/admin-panel/src/app/login/page.tsx`:

**Remove or comment out the rate limit check in useEffect:**
```javascript
// Comment out lines 17-28
/*
useEffect(() => {
    const checkRateLimit = async () => {
        try {
            const result = await verifyLoginAttempt(email || 'check');
            if (!result.allowed) {
                setRateLimited(true);
                setError('Too many login attempts. Please try again later.');
            }
        } catch (err) {
            console.error('Rate limit check failed:', err);
        }
    };

    const timer = setTimeout(checkRateLimit, 500);
    return () => clearTimeout(timer);
}, [email]);
*/
```

## Verification Steps

After creating admin user:

1. **Check Firebase Auth**
   ```
   Firebase Console > Authentication > Users
   Should see: cryptosourav23@gmail.com
   ```

2. **Check Firestore**
   ```
   Firebase Console > Firestore > users > <uid>
   Should see: role: "super_admin", isActive: true
   ```

3. **Test Login**
   ```
   Navigate to: http://localhost:3000/login
   Enter: cryptosourav23@gmail.com + password
   Should redirect to: http://localhost:3000/admin
   ```

## Admin Panel URLs

- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/admin
- **Users**: http://localhost:3000/admin/users
- **Automations**: http://localhost:3000/admin/automations

## Role Types

- **super_admin**: Full access to admin panel, can manage users and automations
- **client_user**: Regular user, no admin panel access

## Security Notes

- Only users with `role: 'super_admin'` can access admin panel
- All admin functions check `isSuperAdmin()` before execution
- Rate limiting prevents brute force attacks
- Activity logs track all admin actions
