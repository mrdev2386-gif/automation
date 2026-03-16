@echo off
echo 🚨 UNDICI COMPILATION FIX SCRIPT
echo ================================

cd /d "c:\Users\dell\WAAUTOMATION\dashboard"

echo.
echo 📋 Step 1: Clean existing installation
echo -------------------------------------
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo 📋 Step 2: Install with legacy peer deps
echo ----------------------------------------
echo Installing dependencies...
npm install --legacy-peer-deps

echo.
echo 📋 Step 3: Try building
echo -----------------------
echo Attempting build...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Build completed successfully.
    echo Your API key fix is ready to deploy.
    goto :success
) else (
    echo.
    echo ❌ Build failed. Trying alternative approach...
    goto :alternative
)

:alternative
echo.
echo 📋 Step 4: Alternative fix - Downgrade Firebase
echo -----------------------------------------------
echo Downgrading Firebase to compatible version...
npm install firebase@9.23.0 --save

echo Trying build again...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Build completed with Firebase downgrade.
    goto :success
) else (
    echo.
    echo ❌ Still failing. Manual intervention needed.
    goto :manual
)

:success
echo.
echo 🎉 BUILD SUCCESSFUL!
echo ===================
echo.
echo Your API key validation fix is now compiled and ready.
echo.
echo Next steps:
echo 1. Deploy the dashboard: npm run preview (to test locally)
echo 2. Deploy to production hosting
echo 3. Test the Lead Finder Settings page
echo.
goto :end

:manual
echo.
echo 🔧 MANUAL FIX REQUIRED
echo =====================
echo.
echo The automatic fix didn't work. Try these manual steps:
echo.
echo 1. Check your Node.js version: node --version
echo    - Recommended: Node.js 18.x or 20.x
echo.
echo 2. If using older Node.js, upgrade:
echo    - Download from: https://nodejs.org
echo.
echo 3. Alternative: Use yarn instead of npm:
echo    - npm install -g yarn
echo    - yarn install
echo    - yarn build
echo.
echo 4. If still failing, consider using Firebase v9:
echo    - npm install firebase@9.23.0
echo.
echo 5. Contact support with your Node.js version and error details.
echo.

:end
echo.
echo Press any key to exit...
pause >nul