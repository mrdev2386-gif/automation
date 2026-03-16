@echo off
echo ========================================
echo CLEARING VITE CACHE AND RESTARTING
echo ========================================
echo.

echo Step 1: Removing node_modules/.vite cache...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo Cache cleared!
) else (
    echo No cache found.
)
echo.

echo Step 2: Removing dist folder...
if exist dist (
    rmdir /s /q dist
    echo Dist cleared!
) else (
    echo No dist found.
)
echo.

echo Step 3: Starting development server...
echo.
echo ========================================
echo IMPORTANT: Look for the RED BANNER
echo If you see a red banner, Tailwind works!
echo ========================================
echo.

npm run dev
