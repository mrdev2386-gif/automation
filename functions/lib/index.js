"use strict";
/**
 * WA Automation - Cloud Functions Entry Point
 * Modularized Architecture
 *
 * All function implementations are in dedicated module files.
 * This file serves as the export hub only.
 *
 * Module Files:
 * - users.js - User management functions
 * - automations.js - Automation management functions
 * - leads.js - Lead management functions
 * - leadFinder.js - Lead finder functions
 * - queueMonitoring.js - Queue monitoring functions
 * - aiLeadAgent.js - AI lead agent functions
 * - faqs.js - FAQ management functions
 * - clients.js - Client configuration functions
 * - auth.js - Authentication functions
 * - chat.js - Chat management functions
 * - suggestions.js - Suggestions functions
 * - webhooks.js - Webhook handlers
 * - scheduler.js - Scheduled tasks
 * - emulator.js - Emulator helpers
 */
const admin = require('firebase-admin');
// 1. Firebase Initialization
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * EXPORT MAPPINGS
 * All function implementations have been moved to dedicated modules
 */
// User Management
const users = require('./users');
exports.createUser = users.createUser;
exports.updateUser = users.updateUser;
exports.deleteUser = users.deleteUser;
exports.resetUserPassword = users.resetUserPassword;
exports.setCustomUserClaims = users.setCustomUserClaims;
exports.getAllUsers = users.getAllUsers;
exports.getUserProfile = users.getUserProfile;
exports.getDashboardStats = users.getDashboardStats;
exports.generateClientKey = users.generateClientKey;
// Automation Management
const automations = require('./automations');
exports.createAutomation = automations.createAutomation;
exports.updateAutomation = automations.updateAutomation;
exports.deleteAutomation = automations.deleteAutomation;
exports.getAllAutomations = automations.getAllAutomations;
exports.ensureLeadFinderAutomation = automations.ensureLeadFinderAutomation;
exports.getMyAutomations = automations.getMyAutomations;
exports.seedDefaultAutomations = automations.seedDefaultAutomations;
exports.getMyAutomationsHTTP = automations.getMyAutomationsHTTP;
// Lead Management
const leads = require('./leads');
exports.captureLead = leads.captureLead;
exports.captureLeadCallable = leads.captureLeadCallable;
exports.uploadLeadsBulk = leads.uploadLeadsBulk;
exports.getMyLeads = leads.getMyLeads;
exports.getLeadEvents = leads.getLeadEvents;
exports.updateLeadStatus = leads.updateLeadStatus;
exports.getAllLeads = leads.getAllLeads;
// Lead Finder
const leadFinder = require('./leadFinder');
exports.submitWebsitesForScraping = leadFinder.submitWebsitesForScraping;
exports.setupLeadFinderForUser = leadFinder.setupLeadFinderForUser;
exports.saveLeadFinderAPIKey = leadFinder.saveLeadFinderAPIKey;
exports.getLeadFinderConfig = leadFinder.getLeadFinderConfig;
exports.getMyLeadFinderLeadsHTTP = leadFinder.getMyLeadFinderLeadsHTTP;
exports.getMyLeadFinderLeads = leadFinder.getMyLeadFinderLeads;
exports.startLeadFinderHTTP = leadFinder.startLeadFinderHTTP;
exports.startLeadFinder = leadFinder.startLeadFinder;
exports.getLeadFinderStatusHTTP = leadFinder.getLeadFinderStatusHTTP;
exports.getLeadFinderStatus = leadFinder.getLeadFinderStatus;
exports.deleteLeadFinderLeadsHTTP = leadFinder.deleteLeadFinderLeadsHTTP;
exports.deleteLeadFinderLeads = leadFinder.deleteLeadFinderLeads;
// Lead Finder Queue & Monitoring
const queueMonitoring = require('./queueMonitoring');
exports.getLeadFinderQueueStats = queueMonitoring.getLeadFinderQueueStats;
exports.updateScraperConfig = queueMonitoring.updateScraperConfig;
exports.getScraperConfig = queueMonitoring.getScraperConfig;
exports.saveWebhookConfig = queueMonitoring.saveWebhookConfig;
// AI Lead Agent
const aiLeadAgent = require('./aiLeadAgent');
exports.startAILeadCampaign = aiLeadAgent.startAILeadCampaign;
exports.generateAIEmailDraft = aiLeadAgent.generateAIEmailDraft;
exports.generateAIWhatsappMessage = aiLeadAgent.generateAIWhatsappMessage;
exports.qualifyAILead = aiLeadAgent.qualifyAILead;
exports.updateLeadPipelineStage = aiLeadAgent.updateLeadPipelineStage;
// FAQ & Knowledge Base
const faqModule = require('./faqs');
exports.getFAQs = faqModule.getFAQs;
exports.createFAQ = faqModule.createFAQ;
exports.updateFAQ = faqModule.updateFAQ;
exports.deleteFAQ = faqModule.deleteFAQ;
exports.rebuildFaqEmbeddings = faqModule.rebuildFaqEmbeddings;
exports.testFaqMatch = faqModule.testFaqMatch;
// Client Configuration
const clients = require('./clients');
exports.getClientConfig = clients.getClientConfig;
exports.saveClientConfig = clients.saveClientConfig;
exports.saveWelcomeConfig = clients.saveWelcomeConfig;
exports.getClientConfigHTTP = clients.getClientConfigHTTP;
// Auth & Security
const auth = require('./auth');
exports.verifyLoginAttempt = auth.verifyLoginAttempt;
// Chat & Contacts
const chat = require('./chat');
exports.getChatLogs = chat.getChatLogs;
exports.getChatContacts = chat.getChatContacts;
// Assistant Suggestions
const suggestions = require('./suggestions');
exports.getSuggestions = suggestions.getSuggestions;
exports.createSuggestion = suggestions.createSuggestion;
exports.updateSuggestion = suggestions.updateSuggestion;
exports.deleteSuggestion = suggestions.deleteSuggestion;
// Webhooks
const webhooksModule = require('./webhooks');
exports.whatsappWebhook = webhooksModule.whatsappWebhook;
// Scheduler & Cron Jobs
const schedulerModule = require('./scheduler');
exports.cleanupOldLogs = schedulerModule.cleanupOldLogs;
exports.processScheduledMessages = schedulerModule.processScheduledMessages;
exports.processMessageQueue = schedulerModule.processMessageQueue;
exports.cleanupProductionData = schedulerModule.cleanupProductionData;
exports.detectTimedOutJobs = schedulerModule.detectTimedOutJobs;
exports.checkWorkerHealth = schedulerModule.checkWorkerHealth;
exports.processLeadFinderQueue = schedulerModule.processLeadFinderQueue;
// Emulator Helpers
const emulator = require('./emulator');
exports.seedTestUser = emulator.seedTestUser;
exports.initializeEmulator = emulator.initializeEmulator;
//# sourceMappingURL=index.js.map