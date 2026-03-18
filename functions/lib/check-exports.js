"use strict";
// Simple export checker
const fs = require('fs');
const content = fs.readFileSync('./index.js', 'utf8');
const httpFunctions = [
    'getMyAutomationsHTTP',
    'getLeadFinderConfigHTTP',
    'getMyLeadFinderLeadsHTTP',
    'getClientConfigHTTP',
    'startLeadFinderHTTP',
    'getLeadFinderStatusHTTP',
    'deleteLeadFinderLeadsHTTP'
];
console.log('\n=== Checking Function Exports in index.js ===\n');
httpFunctions.forEach(funcName => {
    const regex = new RegExp(`exports\\.${funcName}\\s*=`, 'g');
    if (regex.test(content)) {
        console.log(`✅ ${funcName} - FOUND`);
    }
    else {
        console.log(`❌ ${funcName} - MISSING`);
    }
});
console.log('\n=== Summary ===');
console.log(`Total HTTP functions checked: ${httpFunctions.length}`);
console.log(`\nNow restart the Firebase emulator to load these functions.`);
//# sourceMappingURL=check-exports.js.map