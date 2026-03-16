@echo off
echo ========================================
echo DEPLOYING saveLeadFinderAPIKey FIX
echo ========================================
echo.

echo PHASE 6: Deploying Cloud Functions...
echo.

cd functions

echo Checking Firebase login status...
firebase projects:list

echo.
echo Deploying saveLeadFinderAPIKey function...
firebase deploy --only functions:saveLeadFinderAPIKey

echo.
echo ========================================
echo DEPLOYMENT COMPLETE
echo ========================================
echo.
echo PHASE 7: Verify deployment with:
echo firebase functions:log --only saveLeadFinderAPIKey
echo.
echo Test the function from the dashboard:
echo 1. Go to Lead Finder Settings
echo 2. Enter a SERP API key
echo 3. Click Save
echo 4. Check logs for debug output
echo.
pause
