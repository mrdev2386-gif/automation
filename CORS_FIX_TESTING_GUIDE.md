# Testing Guide - CORS Fix Verification

## Quick Test (2 minutes)

### 1. Start the Dashboard

```bash
cd dashboard
npm run dev
```

### 2. Open Browser Console

- Press `F12` to open DevTools
- Go to the **Console** tab

### 3. Navigate to AI Lead Agent

- Go to: `http://localhost:5173/ai-lead-agent`
- Login if needed

### 4. Check for Success

**✅ Expected Results:**

1. **No CORS errors in console**
2. **Setup checklist loads:**
   - ✅ Account Active
   - ⚠️ Lead Finder Configured (or ✅ if API key is set)
   - ⚠️ Automation Tools Assigned (or ✅ if tools are assigned)

3. **Console shows successful calls:**
   ```
   🔄 useEffect triggered - User state: { user: "...", hasUser: true }
   📞 loadCampaigns called
   ✅ Query successful! Found X campaigns
   ```

**❌ Old Error (Should NOT appear):**
```
CORS error calling:
https://us-central1-waautomation-13fa6.cloudfunctions.net/getLeadFinderConfig

Error:
"No 'Access-Control-Allow-Origin' header is present on the requested resource."
```

---

## Detailed Test (5 minutes)

### Test 1: Setup Checklist Loads

1. Navigate to `/ai-lead-agent`
2. Verify the "AI Lead Agent Setup" card appears
3. Check that all 3 requirements show status:
   - Account Active
   - Lead Finder Configured
   - Automation Tools Assigned

**Expected:** No errors, checklist loads within 2 seconds

---

### Test 2: Create Campaign Form

1. Scroll to "Create New Campaign" card
2. Verify form fields are visible:
   - Campaign Name
   - Target Country
   - Target Niche
   - Lead Limit
   - Minimum Lead Score
   - Email/WhatsApp toggles

**Expected:** Form renders correctly, no console errors

---

### Test 3: Network Tab Verification

1. Open DevTools → **Network** tab
2. Filter by "getLeadFinderConfig"
3. Refresh the page
4. Check the request:
   - **Status:** 200 OK
   - **Type:** xhr or fetch
   - **Response:** JSON with config data

**Expected:** Successful API call, no CORS preflight failures

---

### Test 4: Authentication Context

1. Open Console
2. Run:
   ```javascript
   firebase.auth().currentUser
   ```
3. Verify user is authenticated

**Expected:** User object with uid, email, etc.

---

## Troubleshooting

### If CORS Error Still Appears

1. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete`
   - Clear cached images and files
   - Reload page

2. **Check Firebase Functions region:**
   ```javascript
   // In firebase.js, verify:
   const functions = getFunctions(app, 'us-central1');
   ```

3. **Verify Cloud Functions are deployed:**
   ```bash
   firebase functions:list
   ```
   Should show `getLeadFinderConfig` in `us-central1`

4. **Check authentication:**
   - Make sure you're logged in
   - Callable functions require authentication

---

### If Setup Checklist Shows "Not Configured"

This is **expected** if:
- Lead Finder API key is not set
- User doesn't have automation tools assigned

**To fix:**
1. Go to `/lead-finder-settings`
2. Add your SerpAPI key
3. Contact admin to assign automation tools

---

## Success Criteria

✅ **CORS Fix Verified When:**

1. No CORS errors in browser console
2. Setup checklist loads without errors
3. Network tab shows successful API calls
4. Campaign creation form is accessible
5. All tabs (Create, Dashboard, Pipeline, etc.) work

---

## Next Steps After Verification

Once CORS is fixed:

1. **Configure Lead Finder:**
   - Go to `/lead-finder-settings`
   - Add SerpAPI key

2. **Assign Automation Tools:**
   - Admin needs to assign `ai_lead_agent` tool
   - Or use admin panel to assign tools

3. **Create First Campaign:**
   - Fill out campaign form
   - Click "Start AI Campaign"
   - Monitor progress in Dashboard tab

---

## Common Issues

### Issue: "User not authenticated"

**Solution:**
- Logout and login again
- Check Firebase Auth is working
- Verify token is valid

### Issue: "Lead Finder not configured"

**Solution:**
- This is expected if API key is not set
- Go to Lead Finder Settings to configure

### Issue: "Automation Tools not assigned"

**Solution:**
- Contact admin to assign tools
- Or use admin panel if you're super_admin

---

## Contact

If issues persist after following this guide:
1. Check `CORS_FIX_SUMMARY.md` for technical details
2. Review `functions/index.js` for function implementation
3. Verify Firebase project configuration

---

**Last Updated**: 2024
**Status**: ✅ CORS Issue Resolved
