# 🚀 Admin Panel Quick Start Guide

## ⚡ Get Started in 5 Minutes

### 1. Access Admin Panel
```
URL: http://localhost:3000/admin
```

### 2. Login as Super Admin
- Use your super admin credentials
- Role must be `super_admin`

### 3. Create Your First User

**Step-by-Step**:
1. Click "Manage Users" or navigate to `/admin/users`
2. Click "Create User" button (top right)
3. Fill in the form:
   - **Email**: `client@example.com`
   - **Password**: `password123` (min 8 chars)
   - **Role**: Client User
   - **Tools**: Select at least one tool
4. Click "Create Client Account"
5. Done! ✅

---

## 📋 Common Tasks

### Create a User
```
/admin/users → Create User → Fill Form → Submit
```

### Edit User Tools
```
/admin/users → Find User → Click Edit (✏️) → Toggle Tools → Save
```

### Reset Password
```
/admin/users → Find User → Click Reset Password (🔑) → Confirm
```

### Disable User
```
/admin/users → Find User → Click Disable (⚡) → Confirm
```

### Delete User
```
/admin/users → Find User → Click Delete (🗑️) → Confirm
```

---

## 🎯 Available Tools

When creating a user, you can assign these tools:

1. **🚀 SaaS Lead Automation**
   - Lead capture and nurturing
   - CRM integration

2. **🍽️ Restaurant Growth Automation**
   - Table bookings
   - Review management

3. **🏨 Hotel Booking Automation**
   - Guest inquiries
   - Booking management

4. **🤖 AI WhatsApp Receptionist**
   - Automated customer support
   - Intent recognition

5. **🔍 Lead Finder**
   - Business email discovery
   - Web scraping

6. **⚡ AI Lead Agent**
   - Lead generation campaigns
   - AI-powered outreach

---

## 🔐 User Roles

### Super Admin
- Full admin panel access
- Can create/edit/delete users
- Can assign tools
- Can view all statistics

### Client User
- Dashboard access only
- Sees only assigned tools
- Cannot access admin panel
- Cannot create users

---

## 📊 Dashboard Overview

Navigate to `/admin` to see:
- Total Users
- Active Users
- Total Automations
- Active Automations
- Recent Users
- Recent Automations

---

## ⚠️ Important Notes

### Password Requirements
- Minimum 8 characters
- No special requirements
- Can be reset via email

### Tool Assignment
- Client users MUST have at least 1 tool
- Super admins don't need tools
- Tools can be changed anytime

### User Status
- **Active**: Can login and use platform
- **Inactive**: Cannot login, blocked

### Deletion
- Deletes from Firebase Auth
- Deletes from Firestore
- Cannot be undone
- Cannot delete yourself

---

## 🐛 Troubleshooting

### User Cannot Login
1. Check if user is Active
2. Verify email is correct
3. Try password reset
4. Check Firebase Auth console

### Tools Not Showing
1. Verify tools are assigned
2. Check `assignedAutomations` array
3. Refresh dashboard
4. Clear browser cache

### Cannot Create User
1. Check you're logged in as super_admin
2. Verify email format
3. Check password length
4. Select at least 1 tool for client users

---

## 📞 Quick Reference

### Key Routes
```
/admin                    → Dashboard
/admin/users              → Users List
/admin/users/create       → Create User
/admin/automations        → Automations
/login                    → Admin Login
```

### Action Icons
```
✏️  Edit Tools
🔑  Reset Password
⚡  Disable User
🔌  Enable User
🗑️  Delete User
```

---

## ✅ Checklist for New Users

When creating a new user:
- [ ] Valid email address
- [ ] Password ≥ 8 characters
- [ ] Role selected
- [ ] At least 1 tool selected (for client users)
- [ ] Confirm creation
- [ ] Verify user appears in list
- [ ] Test user can login

---

## 🎉 You're Ready!

You now have a fully functional admin user management system.

**Next Steps**:
1. Create your first client user
2. Assign them some tools
3. Have them login to the dashboard
4. They'll see only their assigned tools

---

## 📚 More Documentation

- **Full Documentation**: `ADMIN_USER_MANAGEMENT.md`
- **Implementation Summary**: `ADMIN_IMPLEMENTATION_SUMMARY.md`
- **Visual Flow Guide**: `ADMIN_VISUAL_FLOW_GUIDE.md`

---

**Happy Managing! 🚀**
