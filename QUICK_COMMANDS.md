# 🚀 WA Automation Platform - Quick Reference

## 📋 Quick Commands

### System Verification
```bash
verify-setup.bat
```

### Local Development
```bash
# Start all services
start-dev.bat

# Or start individually:
cd functions && firebase emulators:start
cd apps\admin-panel && npm run dev
cd dashboard && npm run dev
```

### Production Deployment
```bash
# Full deployment
deploy-all.bat

# Or deploy individually:
cd functions && firebase deploy --only functions
cd apps\admin-panel && vercel --prod
cd dashboard && netlify deploy --prod --dir=dist
```

---

## 🔧 Common Tasks

### 1. Create New User (Admin Panel)
1. Login to admin panel: http://localhost:3000/login
2. Navigate to Users → Create User
3. Fill in email, password, role, and assign tools
4. Submit

### 2. Seed Automation Tools
```bash
cd functions
node scripts\seedAutomations.js
```

### 3. Create Super Admin
```bash
cd functions
node scripts\createAdminUser.js
```

### 4. Clear Cache (Dashboard)
```bash
cd dashboard
clear-cache.bat
```

### 5. View Logs
```bash
# Firebase Functions logs
firebase functions:log

# Local emulator logs
# Check the emulator console at http://localhost:4000
```

---

## 🌐 URLs

### Local Development
- **Firebase Emulator UI**: http://localhost:4000
- **Admin Panel**: http://localhost:3000
- **Client Dashboard**: http://localhost:5173
- **Functions Emulator**: http://localhost:5001

### Production
- **Admin Panel**: https://your-admin-panel.vercel.app
- **Client Dashboard**: https://your-dashboard.netlify.app
- **Cloud Functions**: https://us-central1-waautomation-13fa6.cloudfunctions.net

---

## 🔐 Default Credentials

### Super Admin
- **Email**: cryptosourav23@gmail.com
- **Password**: Agen@2025$$
- **Role**: super_admin

---

## 📦 Available Automation Tools

1. **SaaS Lead Automation** (`saas_automation`)
2. **Restaurant Growth** (`restaurant_automation`)
3. **Hotel Booking** (`hotel_automation`)
4. **AI WhatsApp Receptionist** (`whatsapp_ai_assistant`)
5. **Lead Finder** (`lead_finder`)
6. **AI Lead Agent** (`ai_lead_agent`)

---

## 🛠️ Troubleshooting

### Issue: CORS Errors
**Solution**: Ensure you're using `httpsCallable` from Firebase SDK, not HTTP fetch

### Issue: Unauthenticated Error
**Solution**: 
1. Check if user is logged in
2. Verify Firebase Auth token is valid
3. Check Firestore security rules

### Issue: Function Not Found
**Solution**:
1. Deploy functions: `firebase deploy --only functions`
2. Check function name spelling
3. Verify function is exported in `functions/index.js`

### Issue: Build Errors
**Solution**:
```bash
# Clear cache and rebuild
cd dashboard
clear-cache.bat
npm install
npm run build
```

### Issue: Emulator Connection Failed
**Solution**:
1. Check if emulator is running: http://localhost:4000
2. Verify `VITE_USE_EMULATOR=true` in `.env`
3. Restart emulator: `firebase emulators:start`

---

## 📁 Project Structure

```
WAAUTOMATION/
├── apps/admin-panel/      # Next.js Admin Panel
├── dashboard/             # React Client Dashboard
├── functions/             # Firebase Cloud Functions
├── deploy-all.bat         # Full deployment script
├── start-dev.bat          # Local development script
├── verify-setup.bat       # System verification
└── README.md              # Main documentation
```

---

## 🔄 Development Workflow

### 1. Initial Setup
```bash
verify-setup.bat
cd functions && npm install
cd apps\admin-panel && npm install
cd dashboard && npm install
```

### 2. Local Development
```bash
start-dev.bat
```

### 3. Testing
- Test admin panel: http://localhost:3000
- Test dashboard: http://localhost:5173
- Check emulator: http://localhost:4000

### 4. Deployment
```bash
deploy-all.bat
```

---

## 📊 Monitoring

### Firebase Console
- **URL**: https://console.firebase.google.com
- **Project**: waautomation-13fa6
- **Check**: Functions, Firestore, Authentication

### Vercel Dashboard
- **URL**: https://vercel.com/dashboard
- **Check**: Admin panel deployments and logs

### Netlify Dashboard
- **URL**: https://app.netlify.com
- **Check**: Dashboard deployments and logs

---

## 🔑 Environment Variables

### Admin Panel (`.env.local`)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_USE_EMULATOR=false
```

### Dashboard (`.env`)
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_USE_EMULATOR=false
```

### Functions (`.env`)
```env
WHATSAPP_TOKEN=...
OPENAI_API_KEY=...
VERIFY_TOKEN=...
```

---

## 📞 Support

For issues or questions:
1. Check documentation in `/docs` folder
2. Review `PRODUCTION_READY_SUMMARY.md`
3. Check `DEPLOYMENT_GUIDE.md`
4. Review `TESTING_GUIDE.md`

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
