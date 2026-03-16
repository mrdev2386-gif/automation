@echo off
REM ============================================================================
REM Firebase Rules Deployment Script
REM Deploys Firestore security rules to fix permission errors
REM ============================================================================

echo.
echo ========================================
echo   Firebase Rules Deployment
echo ========================================
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Firebase CLI not found!
    echo Please install: npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking Firebase project...
firebase use
echo.

echo [2/4] Validating firestore.rules...
if not exist "firestore.rules" (
    echo [ERROR] firestore.rules file not found!
    echo Please run this script from the project root directory.
    echo.
    pause
    exit /b 1
)
echo [OK] firestore.rules found
echo.

echo [3/4] Deploying Firestore rules...
firebase deploy --only firestore:rules
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Deployment failed!
    echo Please check the error message above.
    echo.
    pause
    exit /b 1
)
echo.

echo [4/4] Verifying deployment...
echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open Firebase Console: https://console.firebase.google.com
echo 2. Navigate to: Firestore Database ^> Rules
echo 3. Verify rules are deployed (should see ~450 lines)
echo 4. Test the AI Lead Agent page
echo 5. Check browser console for debug logs
echo.
echo If you still see permission errors:
echo - Clear browser cache and re-login
echo - Check user's isActive field in Firestore
echo - Review FIREBASE_PERMISSION_FIX.md for troubleshooting
echo.
pause
