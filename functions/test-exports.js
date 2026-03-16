// Test script to verify function exports
const functions = require('./index.js');

console.log('\n=== Checking Function Exports ===\n');

const httpFunctions = [
    'getMyAutomationsHTTP',
    'getLeadFinderConfigHTTP',
    'getMyLeadFinderLeadsHTTP',
    'getClientConfigHTTP',
    'startLeadFinderHTTP',
    'getLeadFinderStatusHTTP',
    'deleteLeadFinderLeadsHTTP'
];

httpFunctions.forEach(funcName => {
    if (functions[funcName]) {
        console.log(`✅ ${funcName} - EXPORTED`);
    } else {
        console.log(`❌ ${funcName} - MISSING`);
    }
});

console.log('\n=== All Exported Functions ===\n');
console.log(Object.keys(functions).filter(key => key.includes('HTTP')).join('\n'));
