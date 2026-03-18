# 🎯 Getting Started with WA Automation Platform

Welcome! This guide will help you set up and run the WA Automation Platform in under 10 minutes.

---

## ⚡ Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
install-all.bat
```

### Step 2: Verify Setup
```bash
verify-setup.bat
```

### Step 3: Start Development
```bash
start-dev.bat
```

That's it! Your platform is now running locally.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** - [Download](https://nodejs.org)
- ✅ **npm** - Comes with Node.js
- ✅ **Firebase CLI** - Install: `npm install -g firebase-tools`
- ✅ **Git** - [Download](https://git-scm.com)

---

## 🔧 Detailed Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/wa-automation.git
cd WAAUTOMATION
```

### 2. Install Dependencies
```bash
install-all.bat
```

This installs dependencies for:
- Firebase Cloud Functions
- Admin Panel (Next.js)
- Client Dashboard (React)

### 3. Configure Firebase

#### Option A: Use Existing Project (Recommended)
The project is already configured with `waautomation-13fa6`. Skip to step 4.

#### Option B: Create New Project
```bash
firebase login
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions
- ✅ Hosting

### 4. Add Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `waautomation-13fa6`
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save as `functions/serviceAccountKey.json`

### 5. Verify Setup
```bash
verify-setup.bat
```

This checks:
- Node.js and npm installation
- Firebase CLI
- Environment files
- Service account key
- Dependencies

---

## 🚀 Running the Platform

### Local Development

#### Start All Services
```bash
start-dev.bat
```

This starts:
- **Firebase Emulators**: http://localhost:4000
- **Admin Panel**: http://localhost:3000
- **Client Dashboard**: http://localhost:5173

#### Start Services Individually

**Firebase Emulators**:
```bash
cd functions
firebase emulators:start
```

**Admin Panel**:
```bash
cd apps\admin-panel
npm run dev
```

**Client Dashboard**:
```bash
cd dashboard
npm run dev
```

---

## 🔐 First Login

### 1. Create Super Admin
```bash
cd functions
node scripts\createAdminUser.js
```

**Default Credentials**:
- Email: `cryptosourav23@gmail.com`
- Password: `Agen@2025$$`

### 2. Login to Admin Panel
1. Open http://localhost:3000/login
2. Enter credentials above
3. You'll see the admin dashboard

### 3. Create Test Client User
1. Go to Users → Create User
2. Fill in:
   - Email: `test@example.com`
   - Password: `Test@123`
   - Role: `client_user`
   - Assign tools: Select 1-2 tools
3. Click Create

### 4. Login to Client Dashboard
1. Open http://localhost:5173
2. Login with test user credentials
3. You'll see assigned tools only

---

## 📦 Seed Automation Tools

The platform includes 6 automation tools. Seed them:

```bash
cd functions
node scripts\seedAutomations.js
```

**Available Tools**:
1. SaaS Lead Automation
2. Restaurant Growth
3. Hotel Booking
4. AI WhatsApp Receptionist
5. Lead Finder
6. AI Lead Agent

---

## 🌐 Production Deployment

### Full Deployment
```bash
deploy-all.bat
```

This will:
1. Seed automation tools
2. Create super admin
3. Deploy Cloud Functions
4. Build admin panel
5. Build client dashboard

### Manual Deployment

#### Deploy Functions
```bash
cd functions
firebase deploy --only functions
```

#### Deploy Admin Panel (Vercel)
```bash
cd apps\admin-panel
npm run build
vercel --prod
```

#### Deploy Dashboard (Netlify)
```bash
cd dashboard
npm run build
netlify deploy --prod --dir=dist
```

---

## 🧪 Testing

### Test Admin Panel
1. Login as super admin
2. Create a test user
3. Assign tools
4. Disable/enable user
5. Delete user

### Test Client Dashboard
1. Login as client user
2. View assigned tools
3. Try accessing unassigned tool (should redirect)
4. Check settings page

### Test Cloud Functions
```bash
cd functions
node scripts\verifySystem.js
```

---

## 📁 Project Structure

```
WAAUTOMATION/
├── apps/
│   └── admin-panel/          # Next.js Admin Panel
│       ├── src/app/admin/    # Admin routes
│       └── src/lib/          # Firebase client
│
├── dashboard/                # React Client Dashboard
│   ├── src/pages/            # Dashboard pages
│   ├── src/components/       # UI components
│   └── src/services/         # Firebase services
│
├── functions/                # Firebase Cloud Functions
│   ├── index.js              # All functions
│   ├── scripts/              # Utility scripts
│   └── src/services/         # Business logic
│
├── deploy-all.bat            # Full deployment
├── start-dev.bat             # Local development
├── verify-setup.bat          # System verification
├── install-all.bat           # Install dependencies
└── README.md                 # Main documentation
```

---

## 🛠️ Common Issues

### Issue: Port Already in Use
**Solution**: Kill the process or change port
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Firebase Login Failed
**Solution**: Re-login
```bash
firebase logout
firebase login
```

### Issue: Module Not Found
**Solution**: Reinstall dependencies
```bash
install-all.bat
```

### Issue: Build Failed
**Solution**: Clear cache
```bash
cd dashboard
clear-cache.bat
npm install
npm run build
```

---

## 📚 Documentation

- **[README.md](README.md)** - Project overview
- **[PRODUCTION_READY_SUMMARY.md](PRODUCTION_READY_SUMMARY.md)** - System status
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Test cases
- **[QUICK_COMMANDS.md](QUICK_COMMANDS.md)** - Quick reference

---

## 🎯 Next Steps

After setup:

1. **Explore Admin Panel**
   - Create users
   - Assign tools
   - View dashboard stats

2. **Explore Client Dashboard**
   - View assigned tools
   - Access tool interfaces
   - Configure settings

3. **Customize**
   - Add new automation tools
   - Modify UI components
   - Extend Cloud Functions

4. **Deploy to Production**
   - Run `deploy-all.bat`
   - Configure custom domains
   - Set up monitoring

---

## 💡 Tips

- Use `verify-setup.bat` before deploying
- Check Firebase Console for logs
- Use emulator for local testing
- Keep dependencies updated
- Review security rules regularly

---

## 📞 Support

Need help?
1. Check documentation in `/docs`
2. Review error logs in Firebase Console
3. Check `QUICK_COMMANDS.md` for common tasks

---

**🎉 You're all set! Happy coding!**

**Version**: 1.0.0
**Last Updated**: 2024
**Status**: Production Ready ✅
