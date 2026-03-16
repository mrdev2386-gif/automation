@echo off
echo ========================================
echo Restarting Firebase Emulator
echo ========================================
echo.

echo Step 1: Stopping existing emulator processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing emulator cache...
if exist "%USERPROFILE%\.cache\firebase\emulators" (
    echo Clearing emulator cache...
    rd /s /q "%USERPROFILE%\.cache\firebase\emulators" 2>nul
)

echo Step 3: Starting Firebase emulator...
cd /d c:\Users\dell\WAAUTOMATION
start "Firebase Emulator" cmd /k "firebase emulators:start"

echo.
echo ========================================
echo Emulator restart initiated!
echo Check the new window for emulator logs
echo ========================================
echo.
echo Wait 10-15 seconds for emulator to fully start
echo Then test: http://localhost:5001/waautomation-13fa6/us-central1/getMyAutomationsHTTP
pause
