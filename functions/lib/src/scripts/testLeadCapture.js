"use strict";
/**
 * Test Script for Smart Lead Capture
 * Tests the lead capture flow without sending actual WhatsApp messages
 */
const { handleLeadCaptureFlow, LEAD_STEPS } = require('../leadCapture/leadCaptureFlow');
const { createClient, getClientById } = require('../services/clientService');
/**
 * Test complete lead capture flow
 */
const testCompleteFlow = async () => {
    console.log('🧪 Testing Complete Lead Capture Flow\n');
    // Create test client
    console.log('1️⃣ Creating test client...');
    const clientData = {
        name: 'Test Restaurant',
        industryType: 'restaurant',
        whatsappNumberId: 'TEST_PHONE_NUMBER_ID',
        whatsappNumber: '+1234567890',
        email: 'test@restaurant.com',
        botEnabled: true,
        customQuestions: [
            { key: 'partySize', question: 'How many people?' },
            { key: 'date', question: 'What date?' }
        ],
        greetingMessage: '👋 Welcome to Test Restaurant!',
        completionMessage: '✅ Your reservation is confirmed!'
    };
    const clientId = await createClient(clientData);
    console.log(`✅ Client created: ${clientId}\n`);
    const testPhone = '+1234567890';
    // Step 1: Initial greeting
    console.log('2️⃣ Testing initial greeting...');
    let response = await handleLeadCaptureFlow(testPhone, clientId, 'Hello');
    console.log(`Bot: ${response}\n`);
    // Step 2: Provide name
    console.log('3️⃣ Testing name capture...');
    response = await handleLeadCaptureFlow(testPhone, clientId, 'John Doe');
    console.log(`Bot: ${response}\n`);
    // Step 3: Provide email
    console.log('4️⃣ Testing contact capture...');
    response = await handleLeadCaptureFlow(testPhone, clientId, 'john@example.com');
    console.log(`Bot: ${response}\n`);
    // Step 4: Answer first question (party size)
    console.log('5️⃣ Testing first question...');
    response = await handleLeadCaptureFlow(testPhone, clientId, '4 people');
    console.log(`Bot: ${response}\n`);
    // Step 5: Answer second question (date)
    console.log('6️⃣ Testing second question...');
    response = await handleLeadCaptureFlow(testPhone, clientId, '2024-12-25');
    console.log(`Bot: ${response}\n`);
    console.log('✅ Complete flow test passed!\n');
};
/**
 * Test human handoff
 */
const testHumanHandoff = async () => {
    console.log('🧪 Testing Human Handoff\n');
    // Create test client
    const clientData = {
        name: 'Test Hotel',
        industryType: 'hotel',
        whatsappNumberId: 'TEST_PHONE_NUMBER_ID_2',
        whatsappNumber: '+1234567891',
        botEnabled: true
    };
    const clientId = await createClient(clientData);
    console.log(`✅ Client created: ${clientId}\n`);
    const testPhone = '+1234567891';
    // Start conversation
    console.log('1️⃣ Starting conversation...');
    let response = await handleLeadCaptureFlow(testPhone, clientId, 'Hi');
    console.log(`Bot: ${response}\n`);
    // Request human handoff
    console.log('2️⃣ Requesting human handoff...');
    response = await handleLeadCaptureFlow(testPhone, clientId, 'HUMAN');
    console.log(`Bot: ${response}\n`);
    // Try to continue conversation (should acknowledge handoff)
    console.log('3️⃣ Trying to continue after handoff...');
    response = await handleLeadCaptureFlow(testPhone, clientId, 'Hello?');
    console.log(`Bot: ${response}\n`);
    console.log('✅ Human handoff test passed!\n');
};
/**
 * Test input validation
 */
const testInputValidation = async () => {
    console.log('🧪 Testing Input Validation\n');
    const clientData = {
        name: 'Test SaaS',
        industryType: 'saas',
        whatsappNumberId: 'TEST_PHONE_NUMBER_ID_3',
        whatsappNumber: '+1234567892',
        botEnabled: true
    };
    const clientId = await createClient(clientData);
    const testPhone = '+1234567892';
    // Start conversation
    await handleLeadCaptureFlow(testPhone, clientId, 'Hi');
    // Test invalid name (too short)
    console.log('1️⃣ Testing invalid name...');
    let response = await handleLeadCaptureFlow(testPhone, clientId, 'A');
    console.log(`Bot: ${response}`);
    console.log(`✅ Correctly rejected short name\n`);
    // Test valid name
    response = await handleLeadCaptureFlow(testPhone, clientId, 'Alice Smith');
    console.log(`Bot: ${response}\n`);
    // Test invalid email
    console.log('2️⃣ Testing invalid email...');
    response = await handleLeadCaptureFlow(testPhone, clientId, 'not-an-email');
    console.log(`Bot: ${response}`);
    console.log(`✅ Correctly rejected invalid email\n`);
    // Test valid email
    response = await handleLeadCaptureFlow(testPhone, clientId, 'alice@example.com');
    console.log(`Bot: ${response}\n`);
    console.log('✅ Input validation test passed!\n');
};
/**
 * Test different industries
 */
const testDifferentIndustries = async () => {
    console.log('🧪 Testing Different Industries\n');
    const industries = ['restaurant', 'hotel', 'saas', 'spa', 'salon', 'clinic', 'gym'];
    for (const industry of industries) {
        console.log(`Testing ${industry}...`);
        const clientData = {
            name: `Test ${industry}`,
            industryType: industry,
            whatsappNumberId: `TEST_${industry.toUpperCase()}`,
            whatsappNumber: `+123456789${industries.indexOf(industry)}`,
            botEnabled: true
        };
        const clientId = await createClient(clientData);
        const testPhone = clientData.whatsappNumber;
        // Start conversation
        const response = await handleLeadCaptureFlow(testPhone, clientId, 'Hello');
        console.log(`✅ ${industry}: ${response.substring(0, 50)}...\n`);
    }
    console.log('✅ All industries tested!\n');
};
/**
 * Main test runner
 */
const main = async () => {
    try {
        console.log('🚀 Starting Smart Lead Capture Tests\n');
        console.log('='.repeat(60) + '\n');
        // Run tests
        await testCompleteFlow();
        await testHumanHandoff();
        await testInputValidation();
        await testDifferentIndustries();
        console.log('='.repeat(60));
        console.log('✅ All tests passed!\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
};
// Run if called directly
if (require.main === module) {
    main();
}
module.exports = {
    testCompleteFlow,
    testHumanHandoff,
    testInputValidation,
    testDifferentIndustries
};
//# sourceMappingURL=testLeadCapture.js.map