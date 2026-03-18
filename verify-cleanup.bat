@echo off
echo ========================================
echo POST-CLEANUP VERIFICATION
echo ========================================
echo.

echo Verifying codebase after cleanup...
echo.

echo [1/5] Checking if deleted files are gone...
if exist "functions\getLeadFinderConfig_fix.js" (
    echo ❌ getLeadFinderConfig_fix.js still exists
    set /a ERRORS+=1
) else (
    echo ✅ getLeadFinderConfig_fix.js deleted
)

if exist "functions\temp_function.txt" (
    echo ❌ temp_function.txt still exists
    set /a ERRORS+=1
) else (
    echo ✅ temp_function.txt deleted
)

if exist "functions\temp_lead_finder.txt" (
    echo ❌ temp_lead_finder.txt still exists
    set /a ERRORS+=1
) else (
    echo ✅ temp_lead_finder.txt deleted
)

echo.
echo [2/5] Checking if required files exist...
if exist "functions\leadFinderConfig.js" (
    echo ✅ leadFinderConfig.js exists
) else (
    echo ❌ leadFinderConfig.js missing
    set /a ERRORS+=1
)

if exist "functions\index.js" (
    echo ✅ index.js exists
) else (
    echo ❌ index.js missing
    set /a ERRORS+=1
)

if exist "dashboard\src\services\firebase.js" (
    echo ✅ firebase.js exists
) else (
    echo ❌ firebase.js missing
    set /a ERRORS+=1
)

echo.
echo [3/5] Checking functions exports...
cd functions
node -e "const idx = require('./index.js'); console.log('✅ index.js loads successfully'); console.log('✅ Exports:', Object.keys(idx).length, 'functions');" 2>nul
if %errorlevel% neq 0 (
    echo ❌ index.js has errors
    set /a ERRORS+=1
)
cd ..

echo.
echo [4/5] Checking leadFinderConfig module...
cd functions
node -e "const lfc = require('./leadFinderConfig.js'); console.log('✅ leadFinderConfig.js loads successfully'); console.log('✅ Exports:', Object.keys(lfc).join(', '));" 2>nul
if %errorlevel% neq 0 (
    echo ❌ leadFinderConfig.js has errors
    set /a ERRORS+=1
)
cd ..

echo.
echo [5/5] Checking for duplicate exports...
cd functions
node -e "const idx = require('./index.js'); const exports = Object.keys(idx); const duplicates = exports.filter((item, index) => exports.indexOf(item) !== index); if (duplicates.length > 0) { console.log('❌ Duplicate exports found:', duplicates); process.exit(1); } else { console.log('✅ No duplicate exports'); }" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Duplicate exports detected
    set /a ERRORS+=1
)
cd ..

echo.
echo ========================================
echo VERIFICATION COMPLETE
echo ========================================
echo.

if %ERRORS% equ 0 (
    echo ✅ All checks passed!
    echo.
    echo Codebase is clean and ready for deployment.
    echo.
    echo Next steps:
    echo 1. Run: deploy-backend-fix.bat
    echo 2. Test functions in production
    echo 3. Monitor Firebase Console logs
) else (
    echo ❌ %ERRORS% errors found
    echo.
    echo Please review the errors above.
)

echo.
pause
