@echo off
REM ============================================================================
REM Deploy getLeadFinderConfig - 100% Crash-Proof Version (Windows)
REM ============================================================================

echo.
echo ============================================================
echo   Deploying getLeadFinderConfig (Crash-Proof Version)
echo ============================================================
echo.

REM Step 1: Verify we're in the functions directory
if not exist "leadFinderConfig.js" (
    echo [ERROR] leadFinderConfig.js not found
    echo Please run this script from the functions directory
    pause
    exit /b 1
)

echo [OK] Found leadFinderConfig.js
echo.

REM Step 2: Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Firebase CLI not installed
    echo Install with: npm install -g firebase-tools
    pause
    exit /b 1
)

echo [OK] Firebase CLI found
echo.

REM Step 3: Show current project
echo Current Firebase project:
firebase use
echo.

REM Step 4: Deploy the function
echo Deploying getLeadFinderConfig...
echo.

firebase deploy --only functions:getLeadFinderConfig

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   DEPLOYMENT SUCCESSFUL!
    echo ============================================================
    echo.
    echo Next Steps:
    echo 1. Test the function from your client
    echo 2. Monitor logs: firebase functions:log --only getLeadFinderConfig
    echo 3. Check Firebase Console for metrics
    echo.
    echo Function is now 100%% crash-proof!
    echo.
) else (
    echo.
    echo ============================================================
    echo   DEPLOYMENT FAILED
    echo ============================================================
    echo.
    echo Troubleshooting:
    echo 1. Check error messages above
    echo 2. Verify Firebase project is correct
    echo 3. Check functions/package.json for dependencies
    echo 4. Try: firebase deploy --debug
    echo.
)

pause
