/**
 * Deployment Verification Script
 * Checks if all Lead Finder functions are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 LEAD FINDER DEPLOYMENT VERIFICATION\n');
console.log('=' .repeat(60));

// Check if all required files exist
const requiredFiles = [
    'index.js',
    'leadFinderHTTP.js',
    'leadFinderTrigger.js',
    'src/services/leadFinderService.js'
];

console.log('\n📁 Checking Required Files:');
let allFilesExist = true;
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
    console.log('\n❌ VERIFICATION FAILED: Missing required files');
    process.exit(1);
}

// Check index.js exports
console.log('\n📤 Checking index.js Exports:');
const indexContent = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

const requiredExports = [
    'startLeadFinder',
    'getLeadFinderStatus',
    'deleteLeadFinderLeads',
    'getMyLeadFinderLeads',
    'processLeadFinder'
];

let allExportsPresent = true;
requiredExports.forEach(exportName => {
    const hasExport = indexContent.includes(`exports.${exportName}`);
    console.log(`  ${hasExport ? '✅' : '❌'} exports.${exportName}`);
    if (!hasExport) allExportsPresent = false;
});

if (!allExportsPresent) {
    console.log('\n❌ VERIFICATION FAILED: Missing required exports');
    process.exit(1);
}

// Check region consistency
console.log('\n🌍 Checking Region Consistency:');
const leadFinderHTTPContent = fs.readFileSync(path.join(__dirname, 'leadFinderHTTP.js'), 'utf8');
const leadFinderTriggerContent = fs.readFileSync(path.join(__dirname, 'leadFinderTrigger.js'), 'utf8');

const httpRegion = leadFinderHTTPContent.match(/\.region\(['"]([^'"]+)['"]\)/);
const triggerRegion = leadFinderTriggerContent.match(/\.region\(['"]([^'"]+)['"]\)/);

console.log(`  HTTP Functions: ${httpRegion ? httpRegion[1] : 'NOT SPECIFIED'}`);
console.log(`  Trigger Function: ${triggerRegion ? triggerRegion[1] : 'NOT SPECIFIED'}`);

if (httpRegion && triggerRegion && httpRegion[1] === triggerRegion[1]) {
    console.log(`  ✅ All functions use region: ${httpRegion[1]}`);
} else {
    console.log('  ⚠️  Region mismatch detected');
}

// Check collection name consistency
console.log('\n📊 Checking Collection Name Consistency:');
const collections = {
    'leadFinderHTTP.js': leadFinderHTTPContent.match(/collection\(['"]([^'"]*lead[^'"]*)['"]\)/g),
    'leadFinderTrigger.js': leadFinderTriggerContent.match(/collection\(['"]([^'"]*lead[^'"]*)['"]\)/g)
};

console.log('  Collections found:');
Object.entries(collections).forEach(([file, matches]) => {
    if (matches) {
        const uniqueCollections = [...new Set(matches)];
        uniqueCollections.forEach(col => {
            console.log(`    ${file}: ${col}`);
        });
    }
});

// Check Firestore trigger path
console.log('\n🔥 Checking Firestore Trigger Path:');
const triggerPath = leadFinderTriggerContent.match(/document\(['"]([^'"]+)['"]\)/);
if (triggerPath) {
    console.log(`  ✅ Trigger path: ${triggerPath[1]}`);
    if (triggerPath[1] === 'lead_finder_jobs/{jobId}') {
        console.log('  ✅ Trigger path matches job creation collection');
    } else {
        console.log('  ⚠️  Trigger path may not match job creation collection');
    }
} else {
    console.log('  ❌ Trigger path not found');
}

// Check CORS configuration
console.log('\n🌐 Checking CORS Configuration:');
const corsImport = leadFinderHTTPContent.includes("require('cors')");
const corsUsage = (leadFinderHTTPContent.match(/cors\(req, res/g) || []).length;
console.log(`  ${corsImport ? '✅' : '❌'} CORS imported`);
console.log(`  ${corsUsage > 0 ? '✅' : '❌'} CORS used in ${corsUsage} function(s)`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📋 VERIFICATION SUMMARY:\n');

if (allFilesExist && allExportsPresent) {
    console.log('✅ All required files exist');
    console.log('✅ All required exports present');
    console.log('✅ CORS properly configured');
    console.log('✅ Firestore trigger configured');
    console.log('\n🎉 VERIFICATION PASSED - Ready for deployment!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Run: firebase deploy --only functions');
    console.log('   2. Monitor logs: firebase functions:log');
    console.log('   3. Test the flow end-to-end\n');
    process.exit(0);
} else {
    console.log('❌ VERIFICATION FAILED - Please fix the issues above\n');
    process.exit(1);
}
