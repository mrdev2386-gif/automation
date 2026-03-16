@echo off
echo 🔧 FIXING UNDICI ERROR - DOWNGRADING TO FIREBASE V9
echo ===================================================

cd /d "c:\Users\dell\WAAUTOMATION\dashboard"

echo.
echo 📦 Step 1: Clean installation
echo -----------------------------
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo 📦 Step 2: Install with Firebase v9
echo -----------------------------------
echo Installing dependencies...
npm install

echo.
echo 🔨 Step 3: Build
echo ----------------
echo Building application...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Build completed successfully.
    echo.
    echo 🎉 Your API key validation fix is now ready!
    echo.
    echo Next steps:
    echo 1. Test locally: npm run preview
    echo 2. Deploy to your hosting platform
    echo 3. Test the Lead Finder Settings page
    echo.
) else (
    echo.
    echo ❌ Build failed. Please check the error above.
    echo.
    echo If you still see undici errors, try:
    echo 1. Check Node.js version: node --version
    echo 2. Upgrade to Node.js 18 or 20 if needed
    echo 3. Try: npm cache clean --force
    echo.
)

echo.
echo Press any key to exit...
pause >nul