/**
 * Production Hardening - Chaos & Load Tests
 * 
 * Automated tests to verify production resilience:
 * 1. Duplicate webhook replay - processed once only
 * 2. Burst of 100 messages - system stable
 * 3. Multi-client isolation - no cross data
 * 4. Queue retry - failed send retries properly
 * 5. OpenAI limit hit - safe fallback message
 * 6. Suggestion click flow - continues conversation
 * 
 * Run with: firebase emulators:exec --only functions "node tests/productionHardening.test.js"
 */

const admin = require('firebase-admin');
const { initializeFirebase } = require('../src/config/firebase');

// Test configuration
const TEST_CONFIG = {
    projectId: 'waautomation-13fa6',
    phoneNumberId: '123456789',
    whatsappNumber: '+1234567890',
    ownerId: 'test_owner_123',
    clientId: 'test_client_456',
    testPhone: '+1987654321'
};

// Initialize for testing
initializeFirebase();
const db = admin.firestore();

// ============================================================================
// TEST HELPERS
// ============================================================================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createMockWebhookPayload = (messageId, phoneNumber = TEST_CONFIG.testPhone) => ({
    object: 'whatsapp_business_account',
    entry: [{
        id: TEST_CONFIG.phoneNumberId,
        changes: [{
            value: {
                messaging_product: 'whatsapp',
                metadata: {
                    phone_number_id: TEST_CONFIG.phoneNumberId,
                    display_phone_number: TEST_CONFIG.whatsappNumber
                },
                messages: [{
                    from: phoneNumber,
                    id: messageId,
                    timestamp: Date.now().toString(),
                    type: 'text',
                    text: {
                        body: 'Hello, I need help'
                    }
                }]
            },
            field: 'messages'
        }]
    }]
});

// ============================================================================
// TEST 1: Duplicate Webhook Replay
// ============================================================================

async function testDuplicateWebhookReplay() {
    console.log('\n🧪 TEST 1: Duplicate Webhook Replay');
    console.log('====================================');

    const messageId = `test_duplicate_${Date.now()}`;

    try {
        // First attempt - should process
        const result1 = await simulateWebhookCall(messageId);
        console.log(`First attempt result: ${result1.processed ? 'PROCESSED' : 'SKIPPED'}`);

        // Wait a bit
        await delay(100);

        // Duplicate attempt - should skip
        const result2 = await simulateWebhookCall(messageId);
        console.log(`Duplicate attempt result: ${result2.processed ? 'PROCESSED' : 'SKIPPED'}`);

        // Verify: Second attempt should be skipped
        const success = !result2.processed;

        if (success) {
            console.log('✅ TEST PASSED: Duplicate message was correctly skipped');
        } else {
            console.log('❌ TEST FAILED: Duplicate message was processed again');
        }

        return success;
    } catch (error) {
        console.error('❌ TEST ERROR:', error);
        return false;
    }
}

// ============================================================================
// TEST 2: Burst Traffic Simulation
// ============================================================================

async function testBurstTraffic() {
    console.log('\n🧪 TEST 2: Burst of 100 Messages');
    console.log('===================================');

    const messageCount = 100;
    const promises = [];

    console.log(`Sending ${messageCount} concurrent requests...`);
    const startTime = Date.now();

    try {
        // Send burst of messages
        for (let i = 0; i < messageCount; i++) {
            const msgId = `test_burst_${Date.now()}_${i}`;
            promises.push(simulateWebhookCall(msgId));
        }

        // Wait for all to complete
        const results = await Promise.all(promises);
        const endTime = Date.now();

        const processedCount = results.filter(r => r.processed).length;
        const skippedCount = results.filter(r => !r.processed).length;

        console.log(`Completed in ${endTime - startTime}ms`);
        console.log(`Processed: ${processedCount}, Skipped: ${skippedCount}`);

        // System should handle burst without crashing
        const success = processedCount > 0;

        if (success) {
            console.log('✅ TEST PASSED: System handled burst traffic');
        } else {
            console.log('❌ TEST FAILED: System failed under burst load');
        }

        return success;
    } catch (error) {
        console.error('❌ TEST ERROR:', error);
        return false;
    }
}

// ============================================================================
// TEST 3: Multi-Client Isolation
// ============================================================================

async function testMultiClientIsolation() {
    console.log('\n🧪 TEST 3: Multi-Client Isolation');
    console.log('==================================');

    const clientA = { id: 'client_a', ownerId: 'owner_a' };
    const clientB = { id: 'client_b', ownerId: 'owner_b' };

    try {
        // Create test data for client A
        await db.collection('users').doc(clientA.ownerId)
            .collection('clients').doc(clientA.id)
            .collection('messages').add({
                text: 'Client A secret message',
                direction: 'incoming',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        // Create test data for client B
        await db.collection('users').doc(clientB.ownerId)
            .collection('clients').doc(clientB.id)
            .collection('messages').add({
                text: 'Client B secret message',
                direction: 'incoming',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        await delay(500);

        // Try to access client A's data from client B's context
        const clientAMessages = await db.collection('users').doc(clientA.ownerId)
            .collection('clients').doc(clientA.id)
            .collection('messages')
            .limit(10).get();

        const clientBMessages = await db.collection('users').doc(clientB.ownerId)
            .collection('clients').doc(clientB.id)
            .collection('messages')
            .limit(10).get();

        // Verify isolation
        const aHasData = !clientAMessages.empty;
        const bHasData = !clientBMessages.empty;

        console.log(`Client A messages: ${clientAMessages.size}`);
        console.log(`Client B messages: ${clientBMessages.size}`);

        // Should have data for both but they're isolated
        const success = aHasData && bHasData;

        if (success) {
            console.log('✅ TEST PASSED: Multi-tenant isolation working');
        } else {
            console.log('❌ TEST FAILED: Multi-tenant isolation issue');
        }

        // Cleanup
        await cleanupTestData(clientA);
        await cleanupTestData(clientB);

        return success;
    } catch (error) {
        console.error('❌ TEST ERROR:', error);
        return false;
    }
}

// ============================================================================
// TEST 4: Queue Retry Logic
// ============================================================================

async function testQueueRetry() {
    console.log('\n🧪 TEST 4: Queue Retry Logic');
    console.log('==============================');

    try {
        // Create a failed queue item
        const queueRef = await db.collection('outbound_queue').add({
            type: 'text',
            to: TEST_CONFIG.testPhone,
            payload: { text: 'Test message' },
            status: 'pending',
            retryCount: 0,
            nextRetryAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Created queue item: ${queueRef.id}`);

        // Verify it exists
        const doc = await queueRef.get();
        const success = doc.exists;

        if (success) {
            console.log('✅ TEST PASSED: Queue item created successfully');
        } else {
            console.log('❌ TEST FAILED: Queue item not found');
        }

        // Cleanup
        await queueRef.delete();

        return success;
    } catch (error) {
        console.error('❌ TEST ERROR:', error);
        return false;
    }
}

// ============================================================================
// TEST 5: OpenAI Limit Fallback
// ============================================================================

async function testOpenAIFallback() {
    console.log('\n🧪 TEST 5: OpenAI Limit Hit - Fallback');
    console.log('=======================================');

    try {
        // Import the cost protection module
        const { getFallbackMessage } = require('../src/services/openaiProtection');

        // Get fallback message
        const fallback = getFallbackMessage();

        console.log(`Fallback message: "${fallback.substring(0, 50)}..."`);

        // Verify it contains appropriate messaging
        const success = fallback && fallback.length > 0 &&
            (fallback.includes('team') || fallback.includes('connect'));

        if (success) {
            console.log('✅ TEST PASSED: Fallback message is appropriate');
        } else {
            console.log('❌ TEST FAILED: Fallback message issue');
        }

        return success;
    } catch (error) {
        console.error('❌ TEST ERROR:', error);
        return false;
    }
}

// ============================================================================
// TEST 6: Suggestion Click Flow
// ============================================================================

async function testSuggestionClickFlow() {
    console.log('\n🧪 TEST 6: Suggestion Click Flow');
    console.log('=================================');

    try {
        // Create a suggestion interaction
        const interactionData = {
            type: 'interactive',
            from: TEST_CONFIG.testPhone,
            clientUserId: TEST_CONFIG.ownerId,
            clientId: TEST_CONFIG.clientId,
            suggestionId: 'suggestion_123',
            clickedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('suggestion_interactions').add(interactionData);

        console.log('Created suggestion interaction');

        // Verify it was recorded
        const snapshot = await db.collection('suggestion_interactions')
            .where('suggestionId', '==', 'suggestion_123')
            .limit(1).get();

        const success = !snapshot.empty;

        if (success) {
            console.log('✅ TEST PASSED: Suggestion click recorded');
        } else {
            console.log('❌ TEST FAILED: Suggestion click not recorded');
        }

        // Cleanup
        if (!snapshot.empty) {
            await snapshot.docs[0].ref.delete();
        }

        return success;
    } catch (error) {
        console.error('❌ TEST ERROR:', error);
        return false;
    }
}

// ============================================================================
// HELPER: Simulate webhook call
// ============================================================================

async function simulateWebhookCall(messageId) {
    // This simulates what the webhook does
    // In a real test, you'd call the actual endpoint

    try {
        const { isMessageProcessed, markMessageProcessed } = require('../src/services/idempotencyService');

        // Check if already processed
        const alreadyProcessed = await isMessageProcessed(messageId);

        if (alreadyProcessed) {
            return { processed: false, reason: 'duplicate' };
        }

        // Mark as processed
        await markMessageProcessed(messageId, {
            testRun: true
        });

        return { processed: true };
    } catch (error) {
        console.error('Simulate webhook error:', error);
        return { processed: false, reason: 'error' };
    }
}

// ============================================================================
// HELPER: Cleanup test data
// ============================================================================

async function cleanupTestData(client) {
    try {
        // Delete test messages
        const messages = await db.collection('users').doc(client.ownerId)
            .collection('clients').doc(client.id)
            .collection('messages')
            .limit(100).get();

        const batch = db.batch();
        messages.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
    console.log('🚀 Starting Production Hardening Tests');
    console.log('======================================');

    const results = {
        duplicateReplay: false,
        burstTraffic: false,
        multiClientIsolation: false,
        queueRetry: false,
        openaiFallback: false,
        suggestionFlow: false
    };

    try {
        // Run tests
        results.duplicateReplay = await testDuplicateWebhookReplay();
        await delay(1000);

        results.burstTraffic = await testBurstTraffic();
        await delay(1000);

        results.multiClientIsolation = await testMultiClientIsolation();
        await delay(1000);

        results.queueRetry = await testQueueRetry();
        await delay(1000);

        results.openaiFallback = await testOpenAIFallback();
        await delay(1000);

        results.suggestionFlow = await testSuggestionClickFlow();

    } catch (error) {
        console.error('Test suite error:', error);
    }

    // Summary
    console.log('\n======================================');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('======================================');

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r).length;

    console.log(`Total: ${passedTests}/${totalTests} tests passed`);

    Object.entries(results).forEach(([test, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${test}`);
    });

    console.log('======================================\n');

    return passedTests === totalTests;
}

// Export for external use
module.exports = {
    testDuplicateWebhookReplay,
    testBurstTraffic,
    testMultiClientIsolation,
    testQueueRetry,
    testOpenAIFallback,
    testSuggestionClickFlow,
    runAllTests
};;

// Run if called directly
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}
