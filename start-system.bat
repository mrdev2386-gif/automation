@echo off
echo ========================================
echo Lead Finder System Startup
echo ========================================
echo.

echo [1/8] Installing Backend Dependencies...
cd functions
call npm install

echo.
echo [2/8] Verifying Required Dependencies...
call npm list puppeteer bullmq redis cheerio axios 2>nul
if errorlevel 1 (
    echo Installing missing dependencies...
    call npm install puppeteer bullmq redis cheerio axios --save
)

echo.
echo [3/8] Checking package.json...
if exist package.json (
    echo ✓ package.json found
) else (
    echo ✗ package.json not found
    exit /b 1
)

echo.
echo [4/8] Backend dependencies installed successfully
echo.

cd ..

echo [5/8] Starting Firebase Emulators...
echo This will start:
echo   - Firestore
echo   - Cloud Functions
echo   - Authentication
echo   - Hosting
echo.
echo Press Ctrl+C to stop emulators when done testing
echo.

start cmd /k "firebase emulators:start"

echo.
echo [6/8] Waiting for emulators to start (30 seconds)...
timeout /t 30 /nobreak

echo.
echo [7/8] Starting Frontend Dashboard...
cd dashboard
start cmd /k "npm install && npm run dev"

echo.
echo [8/8] System Startup Complete!
echo.
echo ========================================
echo Services Running:
echo ========================================
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:5173
echo Firestore UI: http://localhost:4000
echo ========================================
echo.
echo Next Steps:
echo 1. Open http://localhost:5173 in browser
echo 2. Login with test credentials
echo 3. Navigate to Lead Finder Settings
echo 4. Configure and test Lead Finder
echo.
echo Press any key to open dashboard...
pause
start http://localhost:5173
