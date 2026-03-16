# WA Automation - Admin Panel (Next.js)

## Setup

1. Install dependencies:
```bash
cd apps/admin-panel
npm install
```

2. Configure environment variables:
Copy `.env.local` and update with your Firebase config.

3. Run development server:
```bash
npm run dev
```

## Routes

- `/login` - Admin login (super_admin only)
- `/admin` - Dashboard
- `/admin/users` - User management
- `/admin/automations` - Automation management

## Security

- Route protection via middleware
- Client-side role verification
- Only super_admin can access admin routes
- Rate limiting on login (5 attempts/15 min)

## Firebase Functions Used

- `createUser` - Create new user
- `updateUser` - Update user details
- `deleteUser` - Delete user
- `resetUserPassword` - Reset password
- `getAllUsers` - List all users
- `getDashboardStats` - Get platform stats
- `createAutomation` - Create automation
- `updateAutomation` - Update automation
- `deleteAutomation` - Delete automation
- `getAllAutomations` - List automations
