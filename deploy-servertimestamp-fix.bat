@echo off
echo ========================================
echo DEPLOYING saveLeadFinderAPIKey FIX
echo ========================================
echo.
echo Fix Applied: Extract FieldValue to local variable
echo This resolves: Cannot read properties of undefined (reading 'serverTimestamp')
echo.

cd functions

echo Checking Firebase project...
firebase use

echo.
echo Deploying saveLeadFinderAPIKey function...
firebase deploy --only functions:saveLeadFinderAPIKey

echo.
echo ========================================
echo DEPLOYMENT COMPLETE
echo ========================================
echo.
echo Next Steps:
echo 1. Test from Lead Finder Settings page
echo 2. Monitor logs: firebase functions:log --only saveLeadFinderAPIKey
echo 3. Verify Firestore document created in lead_finder_config collection
echo.
pause
