@echo off
echo ========================================
echo WA Automation - Complete Setup Script
echo ========================================
echo.

echo [1/3] Installing Functions Dependencies...
cd functions
call npm install
echo.

echo [2/3] Installing Dashboard Dependencies...
cd ..\dashboard
call npm install
echo.

echo [3/3] Checking for Missing Dependencies...
cd ..\functions

echo.
echo Checking Puppeteer...
call npm list puppeteer >nul 2>&1
if errorlevel 1 (
    echo Installing Puppeteer...
    call npm install puppeteer
) else (
    echo Puppeteer already installed
)

echo.
echo Checking Cheerio...
call npm list cheerio >nul 2>&1
if errorlevel 1 (
    echo Installing Cheerio...
    call npm install cheerio
) else (
    echo Cheerio already installed
)

echo.
echo Checking Axios...
call npm list axios >nul 2>&1
if errorlevel 1 (
    echo Installing Axios...
    call npm install axios
) else (
    echo Axios already installed
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Start Firebase Emulators: firebase emulators:start
echo 2. Start Dashboard: cd dashboard ^&^& npm run dev
echo 3. Open browser: http://localhost:5173
echo.
echo Optional Dependencies (for advanced features):
echo - BullMQ + Redis: npm install bullmq redis
echo - OpenAI: npm install openai
echo - SendGrid: npm install @sendgrid/mail
echo.
pause
