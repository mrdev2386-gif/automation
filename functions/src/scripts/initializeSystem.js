/**
 * System Initialization Script
 * Ensures all required automations/tools exist in the system
 * This should be run once during setup
 */

const admin = require('firebase-admin');
const { initializeFirebase } = require('../config/firebase');

// Initialize Firebase Admin
initializeFirebase();
const db = admin.firestore();

/**
 * Initialize default automations/tools
 */
const initializeAutomations = async () => {
    try {
        console.log('🔄 Initializing automations...');

        const automations = [
            {
                id: 'lead_finder',
                name: 'Lead Finder',
                description: 'Find and extract business emails from websites using web scraping',
                category: 'lead_generation',
                icon: 'search',
                isActive: true,
                features: [
                    'Search by country and niche',
                    'Automatic website scraping',
                    'Email extraction',
                    'CSV export',
                    'Batch processing'
                ],
                maxResults: 500,
                rateLimit: {
                    jobsPerDay: 5,
                    websitesPerJob: 500
                }
            },
            {
                id: 'whatsapp_chatbot',
                name: 'WhatsApp Chatbot',
                description: 'AI-powered WhatsApp chatbot for customer interactions',
                category: 'communication',
                icon: 'message-circle',
                isActive: true,
                features: [
                    'AI-powered responses',
                    'Lead capture',
                    'Automated workflows',
                    'Multi-language support'
                ]
            },
            {
                id: 'booking_system',
                name: 'Booking System',
                description: 'WhatsApp-based booking and reservation system',
                category: 'sales',
                icon: 'calendar',
                isActive: true,
                features: [
                    'Automated scheduling',
                    'Calendar integration',
                    'Confirmation messages',
                    'Reminders'
                ]
            },
            {
                id: 'smart_lead_capture',
                name: 'Smart Lead Capture',
                description: 'Capture leads through WhatsApp conversations',
                category: 'lead_generation',
                icon: 'users',
                isActive: true,
                features: [
                    'Lead qualification',
                    'Multi-step flow',
                    'Data validation',
                    'Follow-up automation'
                ]
            }
        ];

        let createdCount = 0;
        let skippedCount = 0;

        for (const automation of automations) {
            const docRef = db.collection('automations').doc(automation.id);
            const doc = await docRef.get();

            if (!doc.exists) {
                await docRef.set({
                    ...automation,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`✅ Created automation: ${automation.name} (${automation.id})`);
                createdCount++;
            } else {
                console.log(`⏭️  Skipped automation (already exists): ${automation.name} (${automation.id})`);
                skippedCount++;
            }
        }

        console.log(`\n📊 Initialization complete: ${createdCount} created, ${skippedCount} skipped`);
        return { created: createdCount, skipped: skippedCount };
    } catch (error) {
        console.error('❌ Error initializing automations:', error);
        throw error;
    }
};

// Run initialization if this script is executed directly
if (require.main === module) {
    initializeAutomations()
        .then(() => {
            console.log('✨ System initialization complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeAutomations };
