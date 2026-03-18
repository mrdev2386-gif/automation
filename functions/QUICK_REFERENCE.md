# Firebase Functions - Quick Reference Guide

## 🗂️ Function Location Guide

### User Management (`users.js`)
```javascript
createUser              // Create new user
updateUser             // Update user details
deleteUser             // Delete user
resetUserPassword      // Reset password
setCustomUserClaims    // Set custom claims
getAllUsers            // Get all users (admin)
getUserProfile         // Get current user
getDashboardStats      // Get dashboard stats
```

### Automation Management (`automations.js`)
```javascript
createAutomation              // Create automation
updateAutomation              // Update automation
deleteAutomation              // Delete automation
getAllAutomations             // Get all automations
ensureLeadFinderAutomation    // Initialize Lead Finder
getMyAutomations              // Get user's automations
seedDefaultAutomations        // Seed default automations
```

### Lead Finder Tool (`leadFinder.js`)
```javascript
setupLeadFinderForUser        // Setup for user
saveLeadFinderAPIKey          // Save API keys
getLeadFinderConfig           // Get configuration
submitWebsitesForScraping     // Submit websites
startLeadFinderHTTP           // Start job (HTTP)
getLeadFinderStatusHTTP       // Get status (HTTP)
deleteLeadFinderLeadsHTTP     // Delete leads (HTTP)
getMyLeadFinderLeadsHTTP      // Get leads (HTTP)
getMyLeadFinderLeads          // Get leads (callable)
```

### Lead Management (`leads.js`)
```javascript
captureLead            // Capture lead (HTTP)
captureLeadCallable    // Capture lead (callable)
uploadLeadsBulk        // Bulk upload leads
getMyLeads             // Get user's leads
getLeadEvents          // Get lead events
updateLeadStatus       // Update lead status
getAllLeads            // Get all leads (admin)
```

### FAQ Management (`faq.js`)
```javascript
getFAQs                // Get FAQs
createFAQ              // Create FAQ
updateFAQ              // Update FAQ
deleteFAQ              // Delete FAQ
rebuildFaqEmbeddings   // Rebuild embeddings
testFaqMatch           // Test semantic matching
```

### Suggestions (`suggestions.js`)
```javascript
getSuggestions         // Get suggestions
createSuggestion       // Create suggestion
updateSuggestion       // Update suggestion
deleteSuggestion       // Delete suggestion
```

### Chat Management (`chat.js`)
```javascript
getChatLogs            // Get chat logs
getChatContacts        // Get contacts
```

### Client Configuration (`config.js`)
```javascript
getClientConfig        // Get configuration
saveClientConfig       // Save configuration
generateClientKey      // Generate API key
saveWelcomeConfig      // Save welcome message
getClientConfigHTTP    // Get config (HTTP)
getMyAutomationsHTTP   // Get automations (HTTP)
```

### AI Lead Agent (`aiLeadAgent.js`)
```javascript
startAILeadCampaign           // Start campaign
generateAIEmailDraft          // Generate email
generateAIWhatsappMessage     // Generate message
qualifyAILead                 // Qualify lead
updateLeadPipelineStage       // Update stage
```

### Queue Monitoring (`queueMonitoring.js`)
```javascript
getLeadFinderQueueStats       // Queue statistics
updateScraperConfig           // Update config
getScraperConfig              // Get config
saveWebhookConfig             // Save webhook
```

### Authentication (`auth.js`)
```javascript
isSuperAdmin           // Check admin role
isUserActive           // Check active status
logActivity            // Log activity
checkRateLimit         // Check rate limit
cleanupRateLimits      // Cleanup rate limits
isValidEmail           // Validate email
verifyLoginAttempt     // Verify login
```

### Scheduled Tasks (`scheduled.js`)
```javascript
cleanupOldLogs                // Daily cleanup
processScheduledMessages      // Message processing
cleanupProductionData         // Production cleanup
processLeadFinderQueue        // Queue processor
detectTimedOutJobs            // Timeout detection
checkWorkerHealth             // Worker health check
```

### Emulator Helpers (`emulator.js`)
```javascript
seedTestUser           // Create test user
initializeEmulator     // Initialize emulator
```

### WhatsApp & Production (`whatsapp.js`)
```javascript
whatsappWebhook        // Webhook handler
processMessageQueue    // Queue processor
```

---

## 🔍 Finding a Function

### Method 1: By Feature
1. Identify the feature (e.g., "user management")
2. Find the corresponding module (e.g., `users.js`)
3. Look for the function in that module

### Method 2: By Function Name
1. Use Ctrl+F to search in `index.js`
2. Find the import statement
3. Go to the corresponding module file

### Method 3: By Module
1. Open the module file (e.g., `leads.js`)
2. Scroll to find the function
3. Check the implementation

---

## 📝 Common Tasks

### Add a New User Management Function
1. Open `users.js`
2. Add function implementation
3. Add to `module.exports`
4. Add import and export in `index.js`

### Add a New Lead Function
1. Open `leads.js`
2. Add function implementation
3. Add to `module.exports`
4. Add import and export in `index.js`

### Add a New Scheduled Task
1. Open `scheduled.js`
2. Add function implementation
3. Add to `module.exports`
4. Add import and export in `index.js`

---

## 🚀 Deployment Commands

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:createUser

# Deploy multiple functions
firebase deploy --only functions:createUser,functions:updateUser

# Deploy with logging
firebase deploy --only functions --debug

# Local testing
firebase emulators:start
```

---

## 🔐 Security Checklist

- [ ] Authentication required for sensitive functions
- [ ] Rate limiting implemented
- [ ] Input validation present
- [ ] Activity logging enabled
- [ ] CORS headers set correctly
- [ ] No credentials in code
- [ ] Admin-only functions protected

---

## 📊 Module Statistics

| Module | Functions | Lines | Purpose |
|--------|-----------|-------|---------|
| users.js | 8 | ~200 | User management |
| automations.js | 7 | ~180 | Automation management |
| leadFinder.js | 9 | ~400 | Lead Finder tool |
| leads.js | 7 | ~500 | Lead management |
| faq.js | 6 | ~150 | FAQ management |
| suggestions.js | 4 | ~100 | Suggestions |
| chat.js | 2 | ~50 | Chat management |
| config.js | 6 | ~150 | Configuration |
| aiLeadAgent.js | 5 | ~200 | AI Lead Agent |
| queueMonitoring.js | 4 | ~100 | Queue monitoring |
| auth.js | 7 | ~150 | Authentication |
| cors.js | 3 | ~100 | CORS middleware |
| scheduled.js | 6 | ~150 | Scheduled tasks |
| emulator.js | 2 | ~150 | Emulator helpers |
| whatsapp.js | 2 | ~50 | WhatsApp |

---

## 🎯 Best Practices

1. **Keep modules focused** - One feature per module
2. **Use consistent naming** - Follow existing patterns
3. **Add JSDoc comments** - Document complex functions
4. **Test thoroughly** - Test before deploying
5. **Update index.js** - Always add exports there
6. **Follow security** - Validate all inputs
7. **Log activities** - Use logActivity helper
8. **Handle errors** - Use proper error codes

---

## 📚 Related Files

- `index.js` - Main entry point
- `MODULAR_REFACTOR_SUMMARY.md` - Detailed refactor info
- `PRODUCTION_READY_SUMMARY.md` - Production checklist
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

---

## 💡 Tips & Tricks

### Quick Search
```bash
# Find all functions in a module
grep "^const\|^exports\." moduleName.js

# Find function usage
grep -r "functionName" .
```

### Testing a Function
```bash
# Test in emulator
firebase emulators:start

# Call function from client
const result = await firebase.functions().httpsCallable('functionName')({data});
```

### Debugging
```bash
# View logs
firebase functions:log

# View specific function logs
firebase functions:log --limit 50
```

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
