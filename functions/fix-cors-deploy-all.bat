@echo off
REM ============================================================================
REM Deploy ALL Firebase Functions - Fix CORS Errors
REM ============================================================================

echo.
echo ============================================================
echo   Deploying ALL Firebase Functions to Fix CORS Errors
echo ============================================================
echo.

REM Check if we're in the functions directory
if not exist "index.js" (
    echo [ERROR] index.js not found
    echo Please run this script from the functions directory
    echo.
    echo Current directory: %CD%
    echo Expected directory: c:\Users\dell\WAAUTOMATION\functions
    echo.
    pause
    exit /b 1
)

echo [OK] Found index.js
echo.

REM Check Firebase CLI
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Firebase CLI not installed
    echo Install with: npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo [OK] Firebase CLI found
echo.

REM Check Firebase authentication
echo Checking Firebase authentication...
firebase login:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Not logged in to Firebase
    echo Run: firebase login
    echo.
    pause
    exit /b 1
)

echo [OK] Firebase authenticated
echo.

REM Show current project
echo Current Firebase project:
firebase use
echo.

REM Confirm deployment
echo.
echo ============================================================
echo   READY TO DEPLOY
echo ============================================================
echo.
echo This will deploy ALL functions to fix CORS errors:
echo   - getMyAutomations
echo   - getLeadFinderConfig
echo   - ensureLeadFinderAutomation
echo   - And all other functions
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo ============================================================
echo   DEPLOYING FUNCTIONS...
echo ============================================================
echo.

firebase deploy --only functions

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   DEPLOYMENT SUCCESSFUL!
    echo ============================================================
    echo.
    
    echo Verifying deployment...
    echo.
    firebase functions:list
    
    echo.
    echo ============================================================
    echo   CORS ERROR FIX COMPLETE!
    echo ============================================================
    echo.
    echo Next steps to test:
    echo.
    echo 1. Clear browser cache:
    echo    - Press Ctrl+Shift+Delete
    echo    - Select "Cached images and files"
    echo    - Click "Clear data"
    echo.
    echo 2. Hard refresh your client app:
    echo    - Press Ctrl+F5 in browser
    echo.
    echo 3. Test function calls:
    echo    - Try loading automations
    echo    - Try accessing Lead Finder
    echo.
    echo 4. Check function logs if issues persist:
    echo    firebase functions:log --only getMyAutomations --limit 10
    echo.
    echo The CORS errors should now be GONE!
    echo.
) else (
    echo.
    echo ============================================================
    echo   DEPLOYMENT FAILED
    echo ============================================================
    echo.
    echo Troubleshooting:
    echo.
    echo 1. Check error messages above
    echo.
    echo 2. Verify Firebase project:
    echo    firebase use
    echo.
    echo 3. Check functions directory:
    echo    dir *.js
    echo.
    echo 4. Try with debug mode:
    echo    firebase deploy --only functions --debug
    echo.
    echo 5. Check Firebase Console:
    echo    https://console.firebase.google.com
    echo.
)

pause
