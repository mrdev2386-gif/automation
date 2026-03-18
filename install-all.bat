@echo off
echo ========================================
echo WA AUTOMATION - INSTALL DEPENDENCIES
echo ========================================
echo.

echo Installing dependencies for all projects...
echo.

echo [1/3] Installing Functions dependencies...
cd functions
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install functions dependencies
    pause
    exit /b 1
)
echo ✅ Functions dependencies installed
echo.

echo [2/3] Installing Admin Panel dependencies...
cd ..\apps\admin-panel
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install admin panel dependencies
    pause
    exit /b 1
)
echo ✅ Admin Panel dependencies installed
echo.

echo [3/3] Installing Dashboard dependencies...
cd ..\..\dashboard
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dashboard dependencies
    pause
    exit /b 1
)
echo ✅ Dashboard dependencies installed
echo.

cd ..

echo ========================================
echo ✅ ALL DEPENDENCIES INSTALLED
echo ========================================
echo.
echo Next steps:
echo 1. Run verification: verify-setup.bat
echo 2. Start development: start-dev.bat
echo 3. Or deploy: deploy-all.bat
echo.
pause
