# WA Automation - Multi-App Architecture

## Project Structure

```
waautomation/
├── apps/
│   ├── admin-panel/         # Next.js Admin Panel (TypeScript)
│   │   ├── src/
│   │   │   ├── app/       # Next.js App Router
│   │   │   ├── lib/       # Firebase admin service
│   │   │   └── middleware.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── client-app/         # React Client App (Vite)
│       ├── src/
│       │   ├── pages/     # Client pages
│       │   ├── components/
│       │   └── services/
│       ├── package.json
│       └── vite.config.js
│
├── packages/
│   └── shared/            # Shared code
│       ├── src/
│       │   ├── types/     # TypeScript interfaces
│       │   └── firebase/  # Firebase config
│       └── package.json
│
├── functions/             # Firebase Cloud Functions
├── firestore.rules        # Firestore security rules
└── firebase.json
```

## Quick Start

### 1. Install Root Dependencies
```bash
npm install
```

### 2. Install App Dependencies

**Admin Panel:**
```bash
cd apps/admin-panel
npm install
```

**Client App:**
```bash
cd apps/client-app
npm install
```

**Shared Package:**
```bash
cd packages/shared
npm install
```

### 3. Environment Setup

Create `.env.local` in `apps/admin-panel/`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy

**Cloud Functions:**
```bash
cd functions
npm install
firebase deploy --only functions
```

**Firestore Rules:**
```bash
firebase deploy --only firestore
```

**Admin Panel:**
```bash
cd apps/admin-panel
npm run build
firebase deploy --only hosting
```

**Client App:**
```bash
cd apps/client-app
npm run build
firebase deploy --only hosting
```

## Security

- **Public Signup**: Disabled (only super_admin can create users)
- **Role-Based Access**: super_admin and client_user
- **Firestore Rules**: Strict RBAC enforcement
- **Rate Limiting**: 5 login attempts per 15 minutes
- **App Check**: Ready to enable in Firebase Console

## Roles

### super_admin
- Full access to admin panel
- Can create/update/delete users
- Can manage automations
- Can view dashboard stats
- Can access all routes

### client_user
- Access to client dashboard only
- Can view assigned automations only
- Cannot access admin routes

## Development

### Admin Panel (Next.js)
```bash
cd apps/admin-panel
npm run dev
# Runs on http://localhost:3000
```

### Client App (Vite)
```bash
cd apps/client-app
npm run dev
# Runs on http://localhost:5173
```

## Deployment

### Firebase Hosting

Admin Panel is deployed to `/admin` path, Client App to `/` path.

Configure firebase.json rewrites:
```json
{
  "hosting": {
    "public": "apps/client-app/dist",
    "ignore": ["firebase.json"],
    "rewrites": [
      {
        "source": "/admin/**",
        "function": "adminPanel"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Migration from Monolith

The existing dashboard at `dashboard/` has been restructured into:

1. `apps/admin-panel/` - Next.js admin (new)
2. `apps/client-app/` - Client app (from dashboard/)
3. `packages/shared/` - Shared code (new)

To migrate:
1. Copy `dashboard/src` to `apps/client-app/src`
2. Move admin pages to `apps/admin-panel/src/app/`
3. Create shared package with common types

## API Functions

All functions are in `functions/index.js`:

- `createUser` / `updateUser` / `deleteUser`
- `getAllUsers` / `getUserProfile`
- `resetUserPassword`
- `createAutomation` / `updateAutomation` / `deleteAutomation`
- `getAllAutomations` / `getMyAutomations`
- `getDashboardStats`
- `verifyLoginAttempt`

## Firestore Schema

```javascript
// users/{uid}
{
  uid: string,
  email: string,
  role: 'super_admin' | 'client_user',
  isActive: boolean,
  assignedAutomations: string[],
  createdAt: timestamp
}

// automations/{id}
{
  name: string,
  description: string,
  isActive: boolean,
  createdAt: timestamp
}

// activity_logs/{id}
{
  userId: string,
  action: string,
  metadata: object,
  timestamp: timestamp
}
```
