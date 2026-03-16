# 🚀 WA Automation Platform - Production Deployment Guide

## Overview

This guide walks you through deploying the WA Automation SaaS platform to production. Follow each step carefully to ensure a smooth deployment.

---

## Prerequisites

Before starting, ensure you have:

- ✅ Firebase project created
- ✅ Firebase CLI installed (`npm install -g firebase-tools`)
- ✅ Node.js 18+ installed
- ✅ Git repository set up
- ✅ Domain names configured (optional)
- ✅ Service account key downloaded (`serviceAccountKey.json`)

---

## Phase 1: Firebase Setup

### Step 1.1: Initialize Firebase Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in project root
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting (optional)
```

### Step 1.2: Configure Firebase

Update `functions/.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
```

### Step 1.3: Deploy Firestore Security Rules

Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read their own
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Automations - authenticated users can read
    match /automations/{automationId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Activity logs - only super_admin can read
    match /activity_logs/{logId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
      allow write: if false;
    }
    
    // Lead Finder collections
    match /lead_finder_jobs/{jobId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false;
    }
    
    match /lead_finder_leads/{leadId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false;
    }
    
    // AI Lead Agent collections
    match /ai_lead_campaigns/{campaignId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false;
      
      match /leads/{leadId} {
        allow read: if request.auth != null;
        allow write: if false;
      }
    }
    
    // Client configs - users can only read their own
    match /client_configs/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }
    
    // FAQ knowledge base - users can only read their own
    match /faq_knowledge/{faqId} {
      allow read: if request.auth != null && resource.data.clientUserId == request.auth.uid;
      allow write: if false;
    }
    
    // Assistant suggestions - users can only read their own
    match /assistant_suggestions/{suggestionId} {
      allow read: if request.auth != null && resource.data.clientUserId == request.auth.uid;
      allow write: if false;
    }
    
    // All other collections - deny by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

---

## Phase 2: Cloud Functions Deployment

### Step 2.1: Install Dependencies

```bash
cd functions
npm install
```

### Step 2.2: Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:createUser,functions:getAllUsers
```

### Step 2.3: Verify Functions Deployment

```bash
# List deployed functions
firebase functions:list

# Check function logs
firebase functions:log
```

---

## Phase 3: Initialize Database

### Step 3.1: Seed Default Automations

```bash
cd functions
node scripts/seedAutomations.js
```

Expected output:
```
🌱 Starting automation seeding...
📦 Processing: SaaS Lead Automation
   ✅ Created: saas_automation
...
✅ Automation seeding complete!
```

### Step 3.2: Create Super Admin Account

```bash
cd functions
node scripts/createAdminUser.js
```

Follow prompts:
```
Enter admin email: admin@yourcompany.com
Enter admin password: [secure password]
✅ Super admin created successfully!
```

### Step 3.3: Verify System

```bash
cd functions
node scripts/verifySystem.js
```

Expected output:
```
✅ SYSTEM FULLY READY FOR PRODUCTION
All checks passed!
```

---

## Phase 4: Admin Panel Deployment

### Step 4.1: Configure Environment

Create `apps/admin-panel/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FUNCTIONS_URL=https://us-central1-your-project.cloudfunctions.net
```

### Step 4.2: Build Admin Panel

```bash
cd apps/admin-panel
npm install
npm run build
```

### Step 4.3: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or use Vercel dashboard:
1. Import GitHub repository
2. Select `apps/admin-panel` as root directory
3. Add environment variables
4. Deploy

### Step 4.4: Configure Custom Domain (Optional)

In Vercel dashboard:
1. Go to Project Settings → Domains
2. Add custom domain: `admin.yourcompany.com`
3. Update DNS records as instructed

---

## Phase 5: Client Dashboard Deployment

### Step 5.1: Configure Environment

Create `dashboard/.env`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Step 5.2: Build Dashboard

```bash
cd dashboard
npm install
npm run build
```

### Step 5.3: Deploy to Netlify (Recommended)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

Or use Netlify dashboard:
1. Import GitHub repository
2. Select `dashboard` as base directory
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Deploy

### Step 5.4: Configure Custom Domain (Optional)

In Netlify dashboard:
1. Go to Domain Settings
2. Add custom domain: `app.yourcompany.com`
3. Update DNS records as instructed

---

## Phase 6: Post-Deployment Testing

### Test 1: Admin Login

1. Navigate to admin panel URL
2. Login with super admin credentials
3. Verify dashboard loads with statistics
4. Check users list is accessible

### Test 2: Create Test User

1. Click "Create User" in admin panel
2. Fill form:
   - Email: test@example.com
   - Password: Test1234!
   - Role: client_user
   - Tools: Select "Lead Finder" and "AI Lead Agent"
3. Submit form
4. Verify user appears in users list

### Test 3: Client Login

1. Navigate to client dashboard URL
2. Login with test user credentials
3. Verify dashboard shows 2 tool cards
4. Click on "Lead Finder" - should load successfully
5. Try accessing `/saas-automation` directly - should redirect to dashboard

### Test 4: Admin User Management

1. In admin panel, go to Users
2. Find test user
3. Click "Edit Tools" - verify modal opens
4. Change tool assignments
5. Click "Disable User"
6. Try logging in as test user - should fail with "Account disabled" message
7. Re-enable user
8. Test password reset - verify email is sent

### Test 5: Tool Access Control

1. Login as test user
2. Open browser DevTools → Network tab
3. Try calling `getMyAutomations` function
4. Verify only assigned tools are returned
5. Try accessing unassigned tool route
6. Verify redirect to dashboard

---

## Phase 7: Production Configuration

### Step 7.1: Enable Firebase Authentication Methods

In Firebase Console:
1. Go to Authentication → Sign-in method
2. Enable Email/Password
3. Configure email templates (optional)
4. Set authorized domains

### Step 7.2: Configure CORS for Cloud Functions

Update `functions/index.js` if needed:

```javascript
// Add CORS headers to webhook endpoints
res.set('Access-Control-Allow-Origin', 'https://app.yourcompany.com');
res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

### Step 7.3: Set Up Monitoring

1. Enable Firebase Performance Monitoring
2. Set up Cloud Functions logging
3. Configure error alerts
4. Set up uptime monitoring (e.g., UptimeRobot)

### Step 7.4: Configure Backups

```bash
# Set up automated Firestore backups
gcloud firestore export gs://your-backup-bucket
```

---

## Phase 8: Security Hardening

### Step 8.1: Review Security Rules

```bash
# Test security rules
firebase emulators:start --only firestore

# Run security rules tests
npm test
```

### Step 8.2: Enable App Check (Recommended)

In Firebase Console:
1. Go to App Check
2. Register your web apps
3. Enable reCAPTCHA v3
4. Update Cloud Functions to enforce App Check

### Step 8.3: Set Up Rate Limiting

Already implemented in Cloud Functions:
- Login attempts: 5 per 15 minutes
- API calls: Configurable per endpoint

### Step 8.4: Rotate Service Account Keys

```bash
# Generate new service account key
gcloud iam service-accounts keys create new-key.json \
  --iam-account=your-service-account@your-project.iam.gserviceaccount.com

# Update functions/serviceAccountKey.json
# Delete old key from Google Cloud Console
```

---

## Phase 9: Documentation & Training

### Step 9.1: Create User Documentation

Document for clients:
- How to login
- How to use each tool
- How to request new tools
- Support contact information

### Step 9.2: Create Admin Documentation

Document for admins:
- How to create users
- How to assign tools
- How to manage user access
- How to monitor system health

### Step 9.3: Train Support Team

Ensure support team knows:
- How to reset user passwords
- How to enable/disable users
- How to troubleshoot common issues
- How to escalate technical problems

---

## Phase 10: Go Live Checklist

### Pre-Launch

- [ ] All Cloud Functions deployed and tested
- [ ] Firestore security rules deployed
- [ ] Admin panel deployed and accessible
- [ ] Client dashboard deployed and accessible
- [ ] Super admin account created and tested
- [ ] Test user created and verified
- [ ] All 6 automations seeded in Firestore
- [ ] System verification script passed
- [ ] Custom domains configured (if applicable)
- [ ] SSL certificates active
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Documentation completed

### Launch Day

- [ ] Announce platform availability
- [ ] Create initial client accounts
- [ ] Monitor error logs closely
- [ ] Be available for support
- [ ] Track user feedback
- [ ] Monitor performance metrics

### Post-Launch (Week 1)

- [ ] Review error logs daily
- [ ] Gather user feedback
- [ ] Address critical issues immediately
- [ ] Monitor system performance
- [ ] Check backup integrity
- [ ] Review security logs

---

## Troubleshooting

### Issue: Functions deployment fails

**Solution**:
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
cd functions
rm -rf node_modules package-lock.json
npm install

# Try deploying again
firebase deploy --only functions
```

### Issue: Admin panel shows "Not authenticated"

**Solution**:
1. Check browser console for errors
2. Verify Firebase config in `.env.local`
3. Clear browser cache and localStorage
4. Try logging in again
5. Check Cloud Functions logs for errors

### Issue: Client can't see assigned tools

**Solution**:
1. Verify user document in Firestore has `assignedAutomations` array
2. Check automation IDs match exactly (case-sensitive)
3. Verify automations exist in `automations` collection
4. Check `getMyAutomations` function logs
5. Verify user's `isActive` field is `true`

### Issue: Password reset email not sending

**Solution**:
1. Check Firebase Authentication email templates
2. Verify email provider settings
3. Check spam folder
4. Review Cloud Functions logs for errors
5. Test with different email address

---

## Maintenance

### Daily Tasks

- Check error logs
- Monitor system performance
- Review user activity

### Weekly Tasks

- Review security logs
- Check backup integrity
- Update documentation as needed
- Review user feedback

### Monthly Tasks

- Review and optimize Cloud Functions
- Update dependencies
- Review and update security rules
- Analyze usage patterns
- Plan feature updates

---

## Support

### Getting Help

- **Documentation**: Check this guide and other docs in `/docs`
- **Logs**: Review Cloud Functions logs in Firebase Console
- **Community**: Firebase community forums
- **Professional Support**: Contact Firebase support

### Reporting Issues

When reporting issues, include:
1. Error message (full stack trace)
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser/environment details
5. Relevant logs from Firebase Console

---

## Success Metrics

Track these metrics to measure platform success:

- **User Adoption**: Number of active users
- **Tool Usage**: Which tools are most used
- **System Uptime**: Target 99.9%
- **Response Time**: Average API response time
- **Error Rate**: Target < 0.1%
- **User Satisfaction**: Feedback scores

---

## Next Steps

After successful deployment:

1. **Onboard First Clients**: Create accounts and assign tools
2. **Gather Feedback**: Collect user feedback on UX and features
3. **Monitor Performance**: Track metrics and optimize as needed
4. **Plan Enhancements**: Prioritize feature requests
5. **Scale Infrastructure**: Adjust resources based on usage

---

## Congratulations! 🎉

Your WA Automation platform is now live and ready to serve clients!

For questions or support, refer to the documentation or contact your development team.
