# ✅ CORS Fix Testing Checklist

## 🎯 Quick Start

```bash
# Terminal 1: Backend
cd functions
firebase emulators:start

# Terminal 2: Frontend
cd dashboard
npm run dev

# Browser
http://localhost:5173/lead-finder
```

---

## ✅ Testing Checklist

### 1. Initial Load
- [ ] Page loads without errors
- [ ] No CORS errors in console
- [ ] Statistics cards show "0" (if no data)
- [ ] Tabs are visible (New Search, Jobs, Results)

### 2. Start New Search
- [ ] Fill in Country: "UAE"
- [ ] Fill in Niche: "Real Estate"
- [ ] Click "🚀 Start Lead Collection"
- [ ] Toast notification appears: "🚀 Search started!"
- [ ] Automatically switches to "Jobs" tab
- [ ] Job card appears with progress bar

### 3. Job Status Polling
- [ ] Progress bar updates every 3 seconds
- [ ] "Websites Scanned" counter increases
- [ ] "Emails Found" counter increases
- [ ] Status badge shows "⏳ Running"
- [ ] No CORS errors during polling

### 4. Job Completion
- [ ] Status changes to "✅ Done"
- [ ] Toast notification: "✅ Job completed successfully!"
- [ ] Results tab shows new leads
- [ ] Statistics cards update with counts

### 5. View Results
- [ ] Switch to "Results" tab
- [ ] Leads table populated with data
- [ ] Statistics cards show correct counts
- [ ] Pagination works (if > 20 leads)
- [ ] Sorting works (click column headers)

### 6. Filter Results
- [ ] Min Score filter works
- [ ] Country dropdown filters correctly
- [ ] Niche dropdown filters correctly
- [ ] Domain filter works
- [ ] Search text filters name/email

### 7. Select Leads
- [ ] Click checkbox to select lead
- [ ] "Select All" checkbox works
- [ ] Selected count updates
- [ ] Delete button enables when leads selected

### 8. Delete Leads
- [ ] Click "Delete (X)" button
- [ ] Confirmation dialog appears
- [ ] Click "OK"
- [ ] Toast notification: "✅ Deleted X leads"
- [ ] Leads removed from table
- [ ] Statistics update

### 9. Export Functions
- [ ] Click "CSV" button
- [ ] File downloads successfully
- [ ] Click "JSON" button
- [ ] File downloads successfully
- [ ] Toast notifications appear

### 10. Lead Details
- [ ] Click on a lead row
- [ ] Detail drawer opens from right
- [ ] All lead information displayed
- [ ] "Copy Email" button works
- [ ] "Open Website" button works
- [ ] Close drawer with X button

---

## 🔍 Console Checks

### Expected Console Output
```
✅ 🔧 Connected to Firebase Emulators
✅ 🔧 Functions: localhost:5001
✅ 🔧 Firestore: 127.0.0.1:8085
✅ 🔧 Auth: localhost:9100
✅ 🔥 Firebase Project: waautomation-13fa6
```

### No Errors Should Appear
```
❌ Access to fetch at '...' has been blocked by CORS policy
❌ No 'Access-Control-Allow-Origin' header is present
❌ Failed to fetch
❌ Network error
```

---

## 🌐 Network Tab Checks

### Open DevTools → Network Tab

#### OPTIONS Request (Preflight)
```
Request URL: http://localhost:5001/.../startLeadFinderHTTP
Request Method: OPTIONS
Status Code: 204 No Content

Response Headers:
  Access-Control-Allow-Origin: http://localhost:5173
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
```

#### POST Request
```
Request URL: http://localhost:5001/.../startLeadFinderHTTP
Request Method: POST
Status Code: 200 OK

Request Headers:
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json

Response Headers:
  Access-Control-Allow-Origin: http://localhost:5173
  Content-Type: application/json
```

---

## 🧪 Manual API Testing

### Test with curl

```bash
# 1. Get your Firebase ID token from browser console
# Open DevTools → Console → Run:
await firebase.auth().currentUser.getIdToken()

# 2. Set token variable
TOKEN="your-token-here"

# 3. Test Start Search
curl -X POST \
  http://localhost:5001/waautomation-13fa6/us-central1/startLeadFinderHTTP \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"country":"UAE","niche":"Real Estate","limit":500}'

# Expected: {"jobId":"job_...","status":"in_progress"}

# 4. Test Get Status (use jobId from above)
curl -X POST \
  http://localhost:5001/waautomation-13fa6/us-central1/getLeadFinderStatusHTTP \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"job_..."}'

# Expected: {"job":{"id":"job_...","status":"in_progress",...}}

# 5. Test Get Leads
curl -X GET \
  http://localhost:5001/waautomation-13fa6/us-central1/getMyLeadFinderLeadsHTTP \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected: {"leads":[...],"jobs":[...]}

# 6. Test Delete Leads
curl -X POST \
  http://localhost:5001/waautomation-13fa6/us-central1/deleteLeadFinderLeadsHTTP \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"leadIds":["lead_1","lead_2"]}'

# Expected: {"deleted":2,"success":true}
```

---

## 🔧 Troubleshooting Tests

### Test 1: Clear Cache
1. Press `Ctrl+Shift+Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Press `Ctrl+Shift+R` (hard reload)
5. Verify: Page loads correctly

### Test 2: Restart Services
1. Stop emulator: `Ctrl+C`
2. Stop dev server: `Ctrl+C`
3. Start emulator: `firebase emulators:start`
4. Start dev server: `npm run dev`
5. Verify: Everything works

### Test 3: Token Refresh
1. Open DevTools → Console
2. Run: `await firebase.auth().currentUser.getIdToken(true)`
3. Verify: New token generated
4. Test API call
5. Verify: Works correctly

---

## 📊 Success Criteria

### All Tests Pass ✅
- [ ] No CORS errors in console
- [ ] All API calls return 200 OK
- [ ] OPTIONS requests return 204
- [ ] Data loads and displays correctly
- [ ] All CRUD operations work
- [ ] Toast notifications appear
- [ ] No JavaScript errors
- [ ] Network tab shows correct headers

### Performance ✅
- [ ] Page loads in < 2 seconds
- [ ] API calls respond in < 1 second
- [ ] Job polling updates every 3 seconds
- [ ] No memory leaks
- [ ] No infinite loops

### User Experience ✅
- [ ] Smooth navigation
- [ ] Clear feedback messages
- [ ] Intuitive interface
- [ ] No broken features
- [ ] Professional appearance

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Environment: [ ] Emulator [ ] Production

Initial Load:           [ ] Pass [ ] Fail
Start Search:           [ ] Pass [ ] Fail
Job Polling:            [ ] Pass [ ] Fail
View Results:           [ ] Pass [ ] Fail
Filter Results:         [ ] Pass [ ] Fail
Delete Leads:           [ ] Pass [ ] Fail
Export Functions:       [ ] Pass [ ] Fail
CORS Errors:            [ ] None [ ] Present
Console Errors:         [ ] None [ ] Present
Network Tab:            [ ] Correct [ ] Issues

Overall Status:         [ ] ✅ PASS [ ] ❌ FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🎉 Final Verification

### Before Marking Complete
- [ ] All checklist items tested
- [ ] No CORS errors anywhere
- [ ] All features working
- [ ] Documentation reviewed
- [ ] Code committed
- [ ] Team notified

### Sign-Off
```
Tested by: ___________
Date: ___________
Status: [ ] ✅ APPROVED [ ] ❌ NEEDS WORK
```

---

**Status**: 🧪 READY FOR TESTING  
**Version**: 1.0.3  
**Last Updated**: 2024
