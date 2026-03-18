@echo off
title WA Automation Platform - Setup Wizard
color 0A

:MENU
cls
echo ========================================
echo   WA AUTOMATION PLATFORM
echo   Setup Wizard v1.0
echo ========================================
echo.
echo What would you like to do?
echo.
echo [1] First Time Setup (Install + Verify)
echo [2] Start Local Development
echo [3] Deploy to Production
echo [4] Verify System
echo [5] Install Dependencies Only
echo [6] View Documentation
echo [7] Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto FIRST_TIME_SETUP
if "%choice%"=="2" goto START_DEV
if "%choice%"=="3" goto DEPLOY
if "%choice%"=="4" goto VERIFY
if "%choice%"=="5" goto INSTALL
if "%choice%"=="6" goto DOCS
if "%choice%"=="7" goto EXIT
goto MENU

:FIRST_TIME_SETUP
cls
echo ========================================
echo FIRST TIME SETUP
echo ========================================
echo.
echo This will:
echo 1. Install all dependencies
echo 2. Verify system configuration
echo 3. Guide you through next steps
echo.
pause

echo.
echo Step 1/2: Installing dependencies...
echo.
call install-all.bat

echo.
echo Step 2/2: Verifying system...
echo.
call verify-setup.bat

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Ensure you have serviceAccountKey.json in functions/
echo 2. Run option [2] to start local development
echo 3. Or run option [3] to deploy to production
echo.
pause
goto MENU

:START_DEV
cls
echo ========================================
echo START LOCAL DEVELOPMENT
echo ========================================
echo.
echo This will start:
echo - Firebase Emulators (port 4000)
echo - Admin Panel (port 3000)
echo - Client Dashboard (port 5173)
echo.
echo Press any key to start...
pause > nul

call start-dev.bat
goto MENU

:DEPLOY
cls
echo ========================================
echo DEPLOY TO PRODUCTION
echo ========================================
echo.
echo This will:
echo 1. Seed automation tools
echo 2. Create super admin user
echo 3. Deploy Cloud Functions
echo 4. Build admin panel
echo 5. Build client dashboard
echo.
echo WARNING: This will deploy to production!
echo.
set /p confirm="Are you sure? (yes/no): "

if /i "%confirm%"=="yes" (
    call deploy-all.bat
) else (
    echo Deployment cancelled.
    pause
)
goto MENU

:VERIFY
cls
echo ========================================
echo VERIFY SYSTEM
echo ========================================
echo.
call verify-setup.bat
pause
goto MENU

:INSTALL
cls
echo ========================================
echo INSTALL DEPENDENCIES
echo ========================================
echo.
call install-all.bat
pause
goto MENU

:DOCS
cls
echo ========================================
echo DOCUMENTATION
echo ========================================
echo.
echo Available documentation:
echo.
echo 1. GETTING_STARTED.md - Complete setup guide
echo 2. QUICK_COMMANDS.md - Quick reference
echo 3. README.md - Project overview
echo 4. PRODUCTION_READY_SUMMARY.md - System status
echo 5. DEPLOYMENT_GUIDE.md - Deployment instructions
echo 6. IMPLEMENTATION_COMPLETE.md - What was implemented
echo.
echo Opening GETTING_STARTED.md...
start GETTING_STARTED.md
echo.
pause
goto MENU

:EXIT
cls
echo ========================================
echo Thank you for using WA Automation!
echo ========================================
echo.
echo Quick commands:
echo - setup-wizard.bat - Run this wizard again
echo - start-dev.bat - Start local development
echo - deploy-all.bat - Deploy to production
echo - verify-setup.bat - Verify system
echo.
pause
exit

:ERROR
echo.
echo ❌ An error occurred!
echo Please check the error message above.
echo.
pause
goto MENU
