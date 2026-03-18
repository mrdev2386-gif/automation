@echo off
echo ========================================
echo WA AUTOMATION - SYSTEM VERIFICATION
echo ========================================
echo.

set ERROR_COUNT=0

echo Checking system requirements...
echo.

REM Check Node.js
echo [1/8] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
    set /a ERROR_COUNT+=1
) else (
    node --version
    echo ✅ Node.js installed
)
echo.

REM Check npm
echo [2/8] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found
    set /a ERROR_COUNT+=1
) else (
    npm --version
    echo ✅ npm installed
)
echo.

REM Check Firebase CLI
echo [3/8] Checking Firebase CLI...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI not found
    echo    Install: npm install -g firebase-tools
    set /a ERROR_COUNT+=1
) else (
    firebase --version
    echo ✅ Firebase CLI installed
)
echo.

REM Check environment files
echo [4/8] Checking environment files...
if exist "apps\admin-panel\.env.local" (
    echo ✅ Admin panel .env.local exists
) else (
    echo ❌ Admin panel .env.local missing
    set /a ERROR_COUNT+=1
)

if exist "dashboard\.env" (
    echo ✅ Dashboard .env exists
) else (
    echo ❌ Dashboard .env missing
    set /a ERROR_COUNT+=1
)

if exist "functions\.env" (
    echo ✅ Functions .env exists
) else (
    echo ❌ Functions .env missing
    set /a ERROR_COUNT+=1
)
echo.

REM Check service account key
echo [5/8] Checking service account key...
if exist "functions\serviceAccountKey.json" (
    echo ✅ Service account key exists
) else (
    echo ❌ Service account key missing
    echo    Download from Firebase Console
    set /a ERROR_COUNT+=1
)
echo.

REM Check dependencies
echo [6/8] Checking dependencies...
if exist "functions\node_modules" (
    echo ✅ Functions dependencies installed
) else (
    echo ⚠️  Functions dependencies not installed
    echo    Run: cd functions ^&^& npm install
)

if exist "apps\admin-panel\node_modules" (
    echo ✅ Admin panel dependencies installed
) else (
    echo ⚠️  Admin panel dependencies not installed
    echo    Run: cd apps\admin-panel ^&^& npm install
)

if exist "dashboard\node_modules" (
    echo ✅ Dashboard dependencies installed
) else (
    echo ⚠️  Dashboard dependencies not installed
    echo    Run: cd dashboard ^&^& npm install
)
echo.

REM Check Firebase project
echo [7/8] Checking Firebase project...
if exist ".firebaserc" (
    echo ✅ Firebase project configured
    type .firebaserc | findstr "waautomation-13fa6"
) else (
    echo ❌ Firebase project not configured
    echo    Run: firebase init
    set /a ERROR_COUNT+=1
)
echo.

REM Check build outputs
echo [8/8] Checking build outputs...
if exist "apps\admin-panel\.next" (
    echo ✅ Admin panel built
) else (
    echo ⚠️  Admin panel not built
    echo    Run: cd apps\admin-panel ^&^& npm run build
)

if exist "dashboard\dist" (
    echo ✅ Dashboard built
) else (
    echo ⚠️  Dashboard not built
    echo    Run: cd dashboard ^&^& npm run build
)
echo.

echo ========================================
echo VERIFICATION SUMMARY
echo ========================================
echo.

if %ERROR_COUNT% equ 0 (
    echo ✅ All critical checks passed!
    echo.
    echo You can now:
    echo 1. Run local development: start-dev.bat
    echo 2. Deploy to production: deploy-all.bat
) else (
    echo ❌ Found %ERROR_COUNT% critical issues
    echo.
    echo Please fix the issues above before proceeding.
)
echo.

pause
