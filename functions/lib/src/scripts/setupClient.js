"use strict";
/**
 * Client Setup Script
 * Helper script to create and configure clients for Smart Lead Capture
 *
 * Usage:
 * node src/scripts/setupClient.js
 */
const { createClient } = require('../services/clientService');
const { getFirestore } = require('../config/firebase');
/**
 * Example: Create a restaurant client
 */
const createRestaurantClient = async () => {
    const clientData = {
        name: 'Bella Italia Restaurant',
        industryType: 'restaurant',
        whatsappNumberId: 'YOUR_WHATSAPP_PHONE_NUMBER_ID',
        whatsappNumber: '+1234567890',
        email: 'contact@bellaitalia.com',
        address: '123 Main St, City, State 12345',
        website: 'https://bellaitalia.com',
        botEnabled: true,
        customQuestions: [
            { key: 'partySize', question: 'How many people will be dining?' },
            { key: 'preferredDate', question: 'What date would you prefer? (e.g., 2024-12-25)' },
            { key: 'preferredTime', question: 'What time works best for you? (e.g., 7:00 PM)' },
            { key: 'specialRequests', question: 'Any special requests or dietary restrictions?' }
        ],
        greetingMessage: '👋 Welcome to Bella Italia! I\'m here to help you make a reservation.',
        completionMessage: '🎉 Your reservation request has been received! We\'ll confirm shortly.'
    };
    const clientId = await createClient(clientData);
    console.log(`✅ Restaurant client created: ${clientId}`);
    return clientId;
};
/**
 * Example: Create a hotel client
 */
const createHotelClient = async () => {
    const clientData = {
        name: 'Grand Plaza Hotel',
        industryType: 'hotel',
        whatsappNumberId: 'YOUR_WHATSAPP_PHONE_NUMBER_ID',
        whatsappNumber: '+1234567890',
        email: 'reservations@grandplaza.com',
        address: '456 Hotel Ave, City, State 12345',
        website: 'https://grandplaza.com',
        botEnabled: true,
        customQuestions: [
            { key: 'checkInDate', question: 'What is your check-in date? (e.g., 2024-12-25)' },
            { key: 'checkOutDate', question: 'What is your check-out date? (e.g., 2024-12-27)' },
            { key: 'numberOfGuests', question: 'How many guests will be staying?' },
            { key: 'roomType', question: 'What type of room would you prefer? (Standard/Deluxe/Suite)' }
        ],
        greetingMessage: '🏨 Welcome to Grand Plaza Hotel! Let\'s help you book your stay.',
        completionMessage: '✅ Thank you! Your booking request has been received. We\'ll send you a confirmation shortly.'
    };
    const clientId = await createClient(clientData);
    console.log(`✅ Hotel client created: ${clientId}`);
    return clientId;
};
/**
 * Example: Create a SaaS client
 */
const createSaaSClient = async () => {
    const clientData = {
        name: 'CloudFlow SaaS',
        industryType: 'saas',
        whatsappNumberId: 'YOUR_WHATSAPP_PHONE_NUMBER_ID',
        whatsappNumber: '+1234567890',
        email: 'sales@cloudflow.com',
        website: 'https://cloudflow.com',
        botEnabled: true,
        customQuestions: [
            { key: 'companyName', question: 'What is your company name?' },
            { key: 'serviceNeeded', question: 'Which service are you interested in?' },
            { key: 'teamSize', question: 'How many team members will be using the platform?' },
            { key: 'budget', question: 'What is your approximate monthly budget?' },
            { key: 'timeline', question: 'When would you like to get started?' }
        ],
        greetingMessage: '👋 Hi! Thanks for your interest in CloudFlow. Let\'s see how we can help your business.',
        completionMessage: '🎉 Perfect! Our sales team will reach out within 24 hours to discuss your needs.'
    };
    const clientId = await createClient(clientData);
    console.log(`✅ SaaS client created: ${clientId}`);
    return clientId;
};
/**
 * Example: Create a spa client
 */
const createSpaClient = async () => {
    const clientData = {
        name: 'Serenity Spa & Wellness',
        industryType: 'spa',
        whatsappNumberId: 'YOUR_WHATSAPP_PHONE_NUMBER_ID',
        whatsappNumber: '+1234567890',
        email: 'bookings@serenityspa.com',
        address: '789 Wellness Blvd, City, State 12345',
        website: 'https://serenityspa.com',
        botEnabled: true,
        customQuestions: [
            { key: 'serviceType', question: 'What type of service are you interested in? (Massage/Facial/Body Treatment)' },
            { key: 'preferredDate', question: 'What date would you prefer?' },
            { key: 'preferredTime', question: 'What time works best for you?' },
            { key: 'numberOfPeople', question: 'How many people will be joining?' }
        ],
        greetingMessage: '✨ Welcome to Serenity Spa! Let\'s book your perfect relaxation experience.',
        completionMessage: '🧘 Your spa appointment request has been received. We\'ll confirm your booking shortly!'
    };
    const clientId = await createClient(clientData);
    console.log(`✅ Spa client created: ${clientId}`);
    return clientId;
};
/**
 * Main setup function
 */
const main = async () => {
    try {
        console.log('🚀 Starting client setup...\n');
        // Uncomment the client type you want to create:
        // await createRestaurantClient();
        // await createHotelClient();
        // await createSaaSClient();
        // await createSpaClient();
        console.log('\n✅ Client setup complete!');
        console.log('\n📝 Next steps:');
        console.log('1. Update the whatsappNumberId with your actual WhatsApp Phone Number ID');
        console.log('2. Configure your WhatsApp webhook to point to your Cloud Function URL');
        console.log('3. Test by sending a message to your WhatsApp number');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error setting up client:', error);
        process.exit(1);
    }
};
// Run if called directly
if (require.main === module) {
    main();
}
module.exports = {
    createRestaurantClient,
    createHotelClient,
    createSaaSClient,
    createSpaClient
};
//# sourceMappingURL=setupClient.js.map