@echo off
echo ========================================
echo WA AUTOMATION PLATFORM - DEPLOYMENT
echo ========================================
echo.

echo This script will deploy the complete platform:
echo 1. Seed automation tools in Firestore
echo 2. Create super admin user
echo 3. Deploy Firebase Cloud Functions
echo 4. Build admin panel
echo 5. Build client dashboard
echo.

pause

echo.
echo ========================================
echo STEP 1: SEED AUTOMATION TOOLS
echo ========================================
echo.

cd functions
node scripts\seedAutomations.js
if %errorlevel% neq 0 (
    echo ❌ Failed to seed automations
    pause
    exit /b 1
)

echo.
echo ========================================
echo STEP 2: CREATE SUPER ADMIN USER
echo ========================================
echo.

node scripts\createAdminUser.js
if %errorlevel% neq 0 (
    echo ❌ Failed to create admin user
    pause
    exit /b 1
)

echo.
echo ========================================
echo STEP 3: DEPLOY CLOUD FUNCTIONS
echo ========================================
echo.

cd ..
firebase deploy --only functions
if %errorlevel% neq 0 (
    echo ❌ Failed to deploy functions
    pause
    exit /b 1
)

echo.
echo ========================================
echo STEP 4: DEPLOY FIRESTORE RULES
echo ========================================
echo.

firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo ⚠️  Warning: Failed to deploy Firestore rules
)

echo.
echo ========================================
echo STEP 5: BUILD ADMIN PANEL
echo ========================================
echo.

cd apps\admin-panel
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install admin panel dependencies
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build admin panel
    pause
    exit /b 1
)

echo.
echo ✅ Admin panel built successfully
echo 📁 Build output: apps\admin-panel\.next
echo.

echo.
echo ========================================
echo STEP 6: BUILD CLIENT DASHBOARD
echo ========================================
echo.

cd ..\..\dashboard
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dashboard dependencies
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build dashboard
    pause
    exit /b 1
)

echo.
echo ✅ Dashboard built successfully
echo 📁 Build output: dashboard\dist
echo.

cd ..

echo.
echo ========================================
echo ✅ DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Deploy Admin Panel to Vercel:
echo    cd apps\admin-panel
echo    vercel --prod
echo.
echo 2. Deploy Dashboard to Netlify:
echo    cd dashboard
echo    netlify deploy --prod --dir=dist
echo.
echo 3. Test the deployment:
echo    - Admin Panel: https://your-admin-panel.vercel.app
echo    - Dashboard: https://your-dashboard.netlify.app
echo.
echo 4. Login credentials:
echo    Email: cryptosourav23@gmail.com
echo    Password: Agen@2025$$
echo.
pause
