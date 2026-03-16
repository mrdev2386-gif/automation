/**
 * UPDATED: startAutomatedLeadFinder with Per-User API Key Support
 * This is the key function that needs to be updated in leadFinderService.js
 * Replace the existing startAutomatedLeadFinder function with this version
 */

const startAutomatedLeadFinder = async (userId, country, niche, limit = 500) => {
    try {
        // Load configuration
        const config = await scraperConfigService.getScraperConfig();
        
        // System health check
        if (config.require_health_check) {
            const health = await scraperConfigService.checkSystemHealth();
            if (!health.healthy) {
                throw new Error(`System unhealthy: ${health.errors.join(', ')}`);
            }
        }
        
        // Validate tool assignment
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        if (!userData.assignedAutomations || !userData.assignedAutomations.includes('lead_finder')) {
            throw new Error('Lead Finder tool not assigned to your account');
        }
        
        // Check global job limit
        const globalLimit = await scraperConfigService.checkGlobalJobLimit();
        if (!globalLimit.allowed) {
            throw new Error(`Global job limit reached (${globalLimit.current}/${globalLimit.limit}). Please try again later.`);
        }
        
        // Check per-user job limit
        const userLimit = await scraperConfigService.checkUserJobLimit(userId);
        if (!userLimit.allowed) {
            throw new Error(`You already have ${userLimit.current} active job(s). Maximum ${userLimit.limit} allowed.`);
        }

        // UPGRADED: Fetch user's SERP API key from Firestore
        let userSerpApiKey = null;
        try {
            const leadFinderConfigDoc = await db.collection('lead_finder_config').doc(userId).get();
            if (leadFinderConfigDoc.exists) {
                userSerpApiKey = leadFinderConfigDoc.data().api_key || null;
            }
        } catch (error) {
            console.warn('Could not fetch user SERP API key:', error.message);
        }

        // Validate that user has API key configured
        if (!userSerpApiKey && !process.env.SERPAPI_API_KEY) {
            throw new Error('SERP API key not configured for this user. Please add your API key in Lead Finder settings.');
        }

        console.log(`Using SERP API key for user: ${userId}`);

        // Get web search service
        const webSearch = getWebSearchService();
        if (!webSearch) {
            throw new Error('Web search service not available. Please try again later.');
        }

        // Discover websites automatically - PASS USER'S API KEY
        console.log(`🔍 Discovering websites for ${niche} in ${country}...`);
        const websites = await webSearch.searchWebsites(niche, country, limit, true, userSerpApiKey);
        
        // Filter out directory sites
        const filteredWebsites = directoryFilterService.filterDirectorySites(websites);
        const validWebsites = webSearch.validateWebsites(filteredWebsites);
        
        console.log(`📊 Filtered ${websites.length - filteredWebsites.length} directory sites`);

        if (validWebsites.length === 0) {
            throw new Error('No websites found for the given niche and country. Try a different search term.');
        }

        // Create job record
        const jobRef = db.collection('lead_finder_jobs').doc();
        const now = admin.firestore.FieldValue.serverTimestamp();

        const job = {
            id: jobRef.id,
            userId,
            country,
            niche,
            status: 'queued',
            progress: {
                websitesScanned: 0,
                emailsFound: 0,
                createdAt: now
            },
            websites: validWebsites,
            results: [],
            createdAt: now,
            updatedAt: now
        };

        await jobRef.set(job);

        // Queue job for processing using Firestore queue
        try {
            await queueService.addScrapingJob({
                jobId: jobRef.id,
                userId,
                websites: validWebsites,
                country,
                niche,
                campaignId: null
            });
            console.log(`📋 Job ${jobRef.id} queued for processing`);
        } catch (queueError) {
            console.error('❌ Error queuing job:', queueError.message);
            throw queueError;
        }

        // Log activity with enhanced details
        await db.collection('activity_logs').add({
            userId,
            action: 'scrape_started',
            message: `Lead Finder job started for ${niche} in ${country}`,
            metadata: {
                jobId: jobRef.id,
                country,
                niche,
                websitesDiscovered: validWebsites.length,
                limit,
                proxyEnabled: config.proxy_enabled,
                emailVerificationEnabled: config.email_verification_enabled,
                userApiKeyUsed: !!userSerpApiKey
            },
            timestamp: now
        });

        return {
            jobId: jobRef.id,
            status: 'queued',
            websitesDiscovered: validWebsites.length,
            message: `🚀 Lead Finder job started. Found ${validWebsites.length} websites. Scraping will start shortly.`
        };

    } catch (error) {
        console.error('Error starting automated lead finder:', error);
        throw error;
    }
};
