@echo off
echo ========================================
echo WA AUTOMATION - LOCAL DEVELOPMENT
echo ========================================
echo.

echo Starting all services...
echo.

echo [1/3] Starting Firebase Emulators...
start "Firebase Emulators" cmd /k "cd functions && firebase emulators:start"
timeout /t 5

echo [2/3] Starting Admin Panel (Next.js)...
start "Admin Panel" cmd /k "cd apps\admin-panel && npm run dev"
timeout /t 3

echo [3/3] Starting Client Dashboard (Vite)...
start "Client Dashboard" cmd /k "cd dashboard && npm run dev"

echo.
echo ========================================
echo ✅ ALL SERVICES STARTED
echo ========================================
echo.
echo Services running:
echo - Firebase Emulators: http://localhost:4000
echo - Admin Panel: http://localhost:3000
echo - Client Dashboard: http://localhost:5173
echo.
echo Press any key to stop all services...
pause > nul

taskkill /FI "WindowTitle eq Firebase Emulators*" /T /F
taskkill /FI "WindowTitle eq Admin Panel*" /T /F
taskkill /FI "WindowTitle eq Client Dashboard*" /T /F

echo.
echo All services stopped.
pause
