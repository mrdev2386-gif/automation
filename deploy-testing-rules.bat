@echo off
REM ============================================================================
REM Firestore Diagnostic and Fix Script
REM ============================================================================

echo.
echo ========================================
echo   FIRESTORE PERMISSION DIAGNOSTIC
echo ========================================
echo.

echo [STEP 1] Backing up current rules...
copy firestore.rules firestore.rules.backup
echo   Backup created: firestore.rules.backup
echo.

echo [STEP 2] Deploying TESTING RULES (open access)...
echo   This will temporarily allow all authenticated users full access
echo.
copy firestore.rules.testing firestore.rules
firebase deploy --only firestore:rules

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to deploy testing rules!
    echo Restoring original rules...
    copy firestore.rules.backup firestore.rules
    pause
    exit /b 1
)

echo.
echo ========================================
echo   TESTING RULES DEPLOYED!
echo ========================================
echo.
echo Testing rules are now active. These rules allow:
echo - All authenticated users can read/write any collection
echo - No role or isActive checks
echo - Perfect for debugging
echo.
echo NEXT STEPS:
echo 1. Open your app in browser
echo 2. Login to your account
echo 3. Navigate to AI Lead Agent page
echo 4. Try creating a campaign
echo 5. Check browser console for logs
echo.
echo If it WORKS now:
echo   - The issue was production rules requiring user document
echo   - Solution: Keep testing rules OR fix user document
echo.
echo If it STILL FAILS:
echo   - The issue is NOT rules
echo   - Check Firebase config, auth state, or code logic
echo.
echo To restore production rules:
echo   copy firestore.rules.backup firestore.rules
echo   firebase deploy --only firestore:rules
echo.
pause
