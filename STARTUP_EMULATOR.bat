@echo off
REM =========================================
REM Firebase Emulator Full Setup & Startup
REM =========================================
REM This script will:
REM 1. Start Firebase Emulators
REM 2. Initialize test data
REM 3. Start the frontend

echo.
echo =========================================
echo Firebase Emulator Startup
echo =========================================
echo.

REM Check if emulators are already running
echo [1/4] Checking if emulators are already running...
netstat -ano | findstr ":5001" > nul
if %errorlevel% equ 0 (
    echo ✓ Emulators already running
    goto skip_emulator
)

echo [2/4] Starting Firebase Emulators...
echo This will run in the background. Wait for "All emulators started successfully"
echo.

REM Start emulators in a new window
start cmd /k "echo Emulators starting... Press Ctrl+C to stop emulators when done testing && firebase emulators:start"

REM Wait for emulators to start
echo.
echo ⏳ Waiting for emulators to start (up to 30 seconds)...
timeout /t 5 /nobreak

REM Check if emulators started
setlocal EnableDelayedExpansion
set "retry=0"
:wait_for_emulator
netstat -ano | findstr ":5001" > nul
if %errorlevel% neq 0 (
    set /a retry=!retry!+1
    if !retry! lss 6 (
        timeout /t 5 /nobreak
        goto wait_for_emulator
    ) else (
        echo ✗ Emulators failed to start. Check the emulator window for errors.
        echo.
        echo Common fixes:
        echo   - Ensure port 5001 is not in use
        echo   - Run: firebase emulators:start --clear
        exit /b 1
    )
)

:skip_emulator
echo ✓ Emulators are running
echo.

echo [3/4] Initializing test data...
REM Wait a bit more to ensure emulators are fully ready
timeout /t 3 /nobreak

node EMULATOR_INIT.js
if %errorlevel% neq 0 (
    echo.
    echo ✗ Initialization failed. Check errors above.
    exit /b 1
)

echo.
echo [4/4] Starting frontend...
echo Opening http://localhost:5173 in 5 seconds...
timeout /t 5 /nobreak

REM Start frontend in new window
cd dashboard
if exist "node_modules" (
    echo ✓ Dependencies already installed
) else (
    echo Installing frontend dependencies (npm install)...
    call npm install
)

echo.
echo 🚀 Starting development server...
call npm run dev

REM This will block until dev server stops

