@echo off
echo ========================================
echo DEPLOYING BACKEND FIXES
echo ========================================
echo.

echo This will deploy the fixed Cloud Functions to production.
echo.
echo Fixes applied:
echo - Added test function for debugging
echo - Enhanced error handling with try-catch
echo - Safe data access with optional chaining
echo - Better error messages
echo - Comprehensive logging
echo.

pause

echo.
echo [1/2] Building TypeScript (if needed)...
cd functions
if exist "tsconfig.json" (
    call npm run build
)

echo.
echo [2/2] Deploying Cloud Functions...
firebase deploy --only functions

if %errorlevel% neq 0 (
    echo.
    echo ❌ Deployment failed!
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Next steps:
echo 1. Test the 'test' function from your frontend
echo 2. Check Firebase Console for logs
echo 3. Try calling other functions
echo.
echo Test function call:
echo   const result = await callFunction('test', { message: 'hello' });
echo   console.log(result); // Should return { ok: true, ... }
echo.
pause
