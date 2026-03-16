@echo off
echo.
echo ========================================
echo Firebase Functions - Pre-Restart Check
echo ========================================
echo.

cd /d c:\Users\dell\WAAUTOMATION\functions

echo [1/3] Checking syntax...
node -c index.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ SYNTAX ERROR FOUND!
    echo Please fix syntax errors before restarting emulator
    pause
    exit /b 1
)
echo ✅ Syntax check passed
echo.

echo [2/3] Verifying function exports...
node check-exports.js
echo.

echo [3/3] Checking package.json...
if exist package.json (
    echo ✅ package.json found
) else (
    echo ❌ package.json missing!
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ ALL CHECKS PASSED!
echo ========================================
echo.
echo Your functions are ready to load.
echo.
echo Next step: Run restart-emulator.bat
echo.
pause
