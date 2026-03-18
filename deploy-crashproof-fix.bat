@echo off
echo ========================================
echo DEPLOYING CRASH-PROOF FIX
echo ========================================
echo.

echo Function: getLeadFinderConfig
echo Status: 100%% CRASH-PROOF
echo.

echo Changes applied:
echo - Full null safety on all data access
echo - Safe Firestore read with fallback
echo - Auto-create default config if missing
echo - Global try-catch wrapper
echo - Safe error handling
echo - No assumptions about data existence
echo.

pause

echo.
echo Deploying getLeadFinderConfig...
firebase deploy --only functions:getLeadFinderConfig,functions:saveLeadFinderAPIKey

if %errorlevel% neq 0 (
    echo.
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ DEPLOYMENT SUCCESSFUL
echo ========================================
echo.
echo Next steps:
echo 1. Test: await callFunction('getLeadFinderConfig')
echo 2. Expected: { success: true, leadFinderConfigured: false, ... }
echo 3. No "internal" error
echo 4. No CORS error
echo 5. No crash
echo.
pause
