@echo off
echo 🔧 Fixing undici compilation issue...

cd /d "c:\Users\dell\WAAUTOMATION\dashboard"

echo 📦 Clearing node_modules and package-lock...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo 📥 Installing dependencies with fixed undici version...
npm install

echo 🔨 Trying to build...
npm run build

echo ✅ Fix complete! If build still fails, try:
echo 1. Delete node_modules and package-lock.json again
echo 2. Run: npm install --legacy-peer-deps
echo 3. Run: npm run build

pause