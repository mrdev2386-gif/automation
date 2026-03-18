@echo off
echo ========================================
echo FIREBASE IMPLEMENTATION VERIFICATION
echo ========================================
echo.

echo [1/5] Checking for HTTP fetch calls...
findstr /s /i /n "fetch(" "src\*.js" "src\*.jsx" 2>nul
if %errorlevel% equ 0 (
    echo ❌ FOUND: Direct fetch calls exist
) else (
    echo ✅ PASS: No direct fetch calls found
)
echo.

echo [2/5] Checking for axios calls...
findstr /s /i /n "axios" "src\*.js" "src\*.jsx" 2>nul
if %errorlevel% equ 0 (
    echo ❌ FOUND: Axios calls exist
) else (
    echo ✅ PASS: No axios calls found
)
echo.

echo [3/5] Checking for cloudfunctions.net URLs...
findstr /s /i /n "cloudfunctions.net" "src\*.js" "src\*.jsx" 2>nul
if %errorlevel% equ 0 (
    echo ❌ FOUND: Direct cloudfunctions.net URLs exist
) else (
    echo ✅ PASS: No direct cloudfunctions.net URLs found
)
echo.

echo [4/5] Checking for httpsCallable usage...
findstr /s /i /n "httpsCallable" "src\services\firebase.js" 2>nul
if %errorlevel% equ 0 (
    echo ✅ PASS: httpsCallable is being used
) else (
    echo ❌ FAIL: httpsCallable NOT found
)
echo.

echo [5/5] Checking for duplicate firebase.js files...
dir /s /b firebase.js 2>nul
echo.

echo ========================================
echo VERIFICATION COMPLETE
echo ========================================
echo.
echo Next steps:
echo 1. Clear Vite cache: rmdir /s /q node_modules\.vite
echo 2. Clear browser cache: Ctrl + Shift + R
echo 3. Restart dev server: npm run dev
echo 4. Check console for: "🔥 USING httpsCallable PATH"
echo.
pause
