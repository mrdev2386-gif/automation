@echo off
echo ========================================
echo CLEARING ALL CACHES
echo ========================================
echo.

echo [1/4] Stopping any running dev server...
echo Press Ctrl+C if dev server is running, then run this script again
echo.

echo [2/4] Deleting Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✅ Vite cache deleted
) else (
    echo ⚠️  Vite cache not found
)
echo.

echo [3/4] Deleting dist folder...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ Dist folder deleted
) else (
    echo ⚠️  Dist folder not found
)
echo.

echo [4/4] Deleting .cache folder...
if exist ".cache" (
    rmdir /s /q ".cache"
    echo ✅ Cache folder deleted
) else (
    echo ⚠️  Cache folder not found
)
echo.

echo ========================================
echo CACHE CLEARED SUCCESSFULLY
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm install
echo 2. Run: npm run dev
echo 3. Hard reload browser: Ctrl + Shift + R
echo 4. Check console for: "🔥 USING httpsCallable"
echo.
pause
