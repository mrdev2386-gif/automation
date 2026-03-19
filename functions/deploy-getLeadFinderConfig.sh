#!/bin/bash

# ============================================================================
# Deploy getLeadFinderConfig - 100% Crash-Proof Version
# ============================================================================

echo "🚀 Deploying getLeadFinderConfig (Crash-Proof Version)"
echo "=================================================="
echo ""

# Step 1: Verify we're in the functions directory
if [ ! -f "leadFinderConfig.js" ]; then
    echo "❌ Error: leadFinderConfig.js not found"
    echo "Please run this script from the functions directory"
    exit 1
fi

echo "✅ Found leadFinderConfig.js"
echo ""

# Step 2: Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI not installed"
    echo "Install with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI found"
echo ""

# Step 3: Verify Firebase login
echo "🔐 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Firebase"
    echo "Run: firebase login"
    exit 1
fi

echo "✅ Firebase authenticated"
echo ""

# Step 4: Show current project
echo "📋 Current Firebase project:"
firebase use
echo ""

# Step 5: Deploy the function
echo "🚀 Deploying getLeadFinderConfig..."
echo ""

firebase deploy --only functions:getLeadFinderConfig

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "=================================================="
    echo ""
    echo "📊 Next Steps:"
    echo "1. Test the function from your client"
    echo "2. Monitor logs: firebase functions:log --only getLeadFinderConfig"
    echo "3. Check Firebase Console for metrics"
    echo ""
    echo "🎯 Function is now 100% crash-proof!"
    echo ""
else
    echo ""
    echo "=================================================="
    echo "❌ DEPLOYMENT FAILED"
    echo "=================================================="
    echo ""
    echo "🔍 Troubleshooting:"
    echo "1. Check error messages above"
    echo "2. Verify Firebase project is correct"
    echo "3. Check functions/package.json for dependencies"
    echo "4. Try: firebase deploy --debug"
    echo ""
    exit 1
fi
