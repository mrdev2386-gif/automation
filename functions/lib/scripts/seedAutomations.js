"use strict";
/**
 * Seed Default Automations Script
 *
 * This script initializes the 6 default automation tools in Firestore.
 * Run this ONCE after deploying the platform for the first time.
 *
 * Usage:
 *   node functions/scripts/seedAutomations.js
 */
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();
// Define the 6 production automations
const defaultAutomations = [
    {
        id: 'saas_automation',
        name: 'SaaS Lead Automation',
        description: 'Capture and nurture SaaS product leads with automated follow-ups',
        isActive: true,
        category: 'lead_generation',
        icon: 'rocket',
        features: [
            'Lead capture webhook',
            'Automated follow-ups',
            'CRM sync',
            'AI auto-reply'
        ]
    },
    {
        id: 'restaurant_automation',
        name: 'Restaurant Growth Automation',
        description: 'Reservations, reviews, and customer engagement for restaurants',
        isActive: true,
        category: 'hospitality',
        icon: 'utensils',
        features: [
            'Table booking capture',
            'Review request automation',
            'WhatsApp confirmation',
            'Repeat customer tagging'
        ]
    },
    {
        id: 'hotel_automation',
        name: 'Hotel Booking Automation',
        description: 'Guest inquiry and booking workflow for hotels',
        isActive: true,
        category: 'hospitality',
        icon: 'building',
        features: [
            'Booking inquiry capture',
            'Availability auto-response',
            'Pre-arrival reminders',
            'Guest follow-up'
        ]
    },
    {
        id: 'whatsapp_ai_assistant',
        name: 'AI WhatsApp Receptionist',
        description: 'Intelligent AI-powered WhatsApp receptionist for automated customer support',
        isActive: true,
        category: 'customer_support',
        icon: 'message-square',
        features: [
            'AI receptionist',
            'Intelligent routing',
            'Appointment scheduling',
            'Lead qualification',
            'Multi-language support',
            'Custom response flows'
        ]
    },
    {
        id: 'lead_finder',
        name: 'Lead Finder',
        description: 'Find and extract business emails from websites using web scraping',
        isActive: true,
        category: 'lead_generation',
        icon: 'search',
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
        id: 'ai_lead_agent',
        name: 'AI Lead Agent',
        description: 'Automated lead generation and qualification with AI-powered outreach',
        isActive: true,
        category: 'lead_generation',
        icon: 'zap',
        features: [
            'Automated lead discovery',
            'AI-powered qualification',
            'Email campaign automation',
            'WhatsApp outreach',
            'Lead scoring',
            'Pipeline management'
        ]
    }
];
async function seedAutomations() {
    console.log('🌱 Starting automation seeding...\n');
    try {
        const results = [];
        for (const automation of defaultAutomations) {
            console.log(`📦 Processing: ${automation.name}`);
            // Check if automation already exists
            const existingDoc = await db.collection('automations').doc(automation.id).get();
            if (existingDoc.exists) {
                // Update existing
                await db.collection('automations').doc(automation.id).update({
                    ...automation,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`   ✅ Updated: ${automation.id}`);
                results.push({ id: automation.id, status: 'updated' });
            }
            else {
                // Create new
                await db.collection('automations').doc(automation.id).set({
                    ...automation,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`   ✅ Created: ${automation.id}`);
                results.push({ id: automation.id, status: 'created' });
            }
        }
        console.log('\n✅ Automation seeding complete!\n');
        console.log('📊 Summary:');
        console.log(`   Total: ${results.length}`);
        console.log(`   Created: ${results.filter(r => r.status === 'created').length}`);
        console.log(`   Updated: ${results.filter(r => r.status === 'updated').length}`);
        console.log('\n🎉 All automations are now available in Firestore!');
        // Verify by listing all automations
        console.log('\n📋 Verifying automations in Firestore:');
        const snapshot = await db.collection('automations').get();
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`   - ${doc.id}: ${data.name} (${data.isActive ? 'Active' : 'Inactive'})`);
        });
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Error seeding automations:', error);
        process.exit(1);
    }
}
// Run the seeding
seedAutomations();
//# sourceMappingURL=seedAutomations.js.map