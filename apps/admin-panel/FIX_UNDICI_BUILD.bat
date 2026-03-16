@echo off
echo ========================================
echo WA Automation - Undici Build Error Fix
echo ========================================
echo.
echo This script will fix the "Module parse failed: Unexpected token in undici" error
echo by downgrading Firebase from v10.8.0 to v9.23.0
echo.
echo STEP 1: Cleaning build artifacts...
if exist .next rmdir /s /q .next
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo ✓ Cleaned
echo.

echo STEP 2: Installing dependencies with Firebase v9.23.0...
npm install --fetch-timeout=120000
if errorlevel 1 (
    echo.
    echo ✗ Installation failed. Please check your network connection and try again.
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo STEP 3: Building admin panel...
npm run build
if errorlevel 1 (
    echo.
    echo ✗ Build failed. Please check the error messages above.
    pause
    exit /b 1
)
echo ✓ Build successful
echo.

echo ========================================
echo SUCCESS! The undici build error is fixed.
echo ========================================
echo.
echo You can now:
echo   - Run: npm run dev (for development)
echo   - Run: npm run build (for production)
echo   - Deploy to Vercel
echo.
pause
