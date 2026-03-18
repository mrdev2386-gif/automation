/**
 * Firebase Service
 * Firebase initialization and helper functions
 * 
 * PHASE 5: Added analytics queries
 */

import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    startAfter
} from 'firebase/firestore';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration from environment variables with production fallbacks
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAOB97HJHHsAbO5OQQ-kJtw3jyXU22A0bs",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "waautomation-13fa6.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "waautomation-13fa6",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "waautomation-13fa6.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "160576032895",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:160576032895:web:d584b96ed32b5998612f4a",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-S3D64C11FP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');

console.log('🔥 Firebase Project:', firebaseConfig.projectId);
console.log('🔥 Region: us-central1');

// ============================================================================
// GLOBAL AUTH STATE CHECK
// Verify authentication before calling callable functions
// ============================================================================

onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.warn('⚠️ User not authenticated - callable functions will fail with "unauthenticated" error');
    } else {
        console.log('✅ Auth state changed - User logged in:', user.email);
    }
});

// Initialize Analytics with browser-only guard
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// ============================================================================
// EMULATOR SETUP: Connect to local emulator in development
// Set VITE_USE_EMULATOR=true in .env to enable emulator
// ============================================================================

const USE_EMULATOR = import.meta.env.VITE_USE_EMULATOR === 'true';

const isEmulator = () => {
    return (window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1') && USE_EMULATOR;
};

// Setup emulator connection ONLY if explicitly enabled
if (isEmulator()) {
    try {
        // Only connect if not already connected
        if (!functions._delegate._region.includes('localhost')) {
            connectFunctionsEmulator(functions, 'localhost', 5001);
            console.log('✅ Connected to Firebase Functions Emulator on localhost:5001');
        } else {
            console.log('✅ Already connected to Firebase Functions Emulator');
        }
    } catch (error) {
        // Emulator might already be connected or not running
        console.warn('⚠️ Emulator connection skipped:', error.message);
    }
} else {
    console.log('🔥 Using production Firebase Functions (us-central1)');
}

// ============================================================================
// HELPER: Call Firebase callable functions
// Uses Firebase SDK's httpsCallable which handles CORS automatically
// Works in both development (emulator) and production
// ============================================================================

const callFunction = async (functionName, data = {}) => {
    try {
        console.log('🔥🔥🔥 CALLFUNCTION EXECUTED:', functionName);
        console.log('🔥 STACK TRACE:', new Error().stack);
        console.log('🔥 USING httpsCallable PATH - NOT HTTP FETCH');
        console.log(`📞 Calling function: ${functionName}`, data);
        console.log(`📞 Functions region: us-central1`);
        console.log(`📞 Using httpsCallable (CORS-safe)`);
        
        const fn = httpsCallable(functions, functionName);
        console.log(`📞 Function reference created for: ${functionName}`);
        
        const result = await fn(data);
        console.log(`✅ Function ${functionName} returned:`, result.data);
        return result.data;
    } catch (error) {
        console.error(`❌ Function ${functionName} failed:`, error);
        console.error(`❌ Error code: ${error.code}`);
        console.error(`❌ Error message: ${error.message}`);
        console.error(`❌ Full error:`, error);
        
        if (error.code === 'functions/unauthenticated') {
            throw new Error('You must be logged in to perform this action');
        } else if (error.code === 'functions/permission-denied') {
            throw new Error('You do not have permission to perform this action');
        } else if (error.code === 'functions/not-found') {
            throw new Error(`Function ${functionName} not found`);
        } else if (error.code === 'functions/internal') {
            throw new Error(error.message || `Internal error in ${functionName}`);
        } else if (error.code === 'functions/unavailable') {
            throw new Error('Cloud Functions service is temporarily unavailable. Please try again.');
        }
        throw new Error(error.message || `Failed to call ${functionName}`);
    }
};

// ============================================================================
// LEAD FINDER SERVICES
// ============================================================================

/**
 * getLeadFinderConfig - Load Lead Finder configuration
 * Uses Firebase callable function (NOT HTTP)
 */
export const getLeadFinderConfig = async () => {
    console.log('🔥🔥🔥 getLeadFinderConfig SERVICE FUNCTION CALLED');
    console.log('🔥 SERVICE STACK:', new Error().stack);
    console.log('🔍 getLeadFinderConfig: Starting callable function call...');
    try {
        const result = await callFunction('getLeadFinderConfig');
        console.log('🔍 getLeadFinderConfig: Success:', result);
        return result;
    } catch (error) {
        console.error('🔍 getLeadFinderConfig: Error:', error);
        throw error;
    }
};

/**
 * saveLeadFinderAPIKey - Save Lead Finder API keys
 * Uses Firebase callable function (NOT HTTP)
 */
export const saveLeadFinderAPIKey = async (apiKeysData) => {
    console.log('🔥🔥🔥 saveLeadFinderAPIKey SERVICE FUNCTION CALLED');
    console.log('🔥 SERVICE STACK:', new Error().stack);
    console.log('🔍 saveLeadFinderAPIKey: Starting callable function call...');
    
    // Validate and clean input
    const { serpApiKeys = [], apifyApiKeys = [] } = apiKeysData;
    
    console.log('🔍 Cleaned keys:', { serpCount: serpApiKeys.length, apifyCount: apifyApiKeys.length });
    
    try {
        const result = await callFunction('saveLeadFinderAPIKey', {
            serpApiKeys: serpApiKeys,
            apifyApiKeys: apifyApiKeys
        });
        console.log('🔍 saveLeadFinderAPIKey: Success:', result);
        return result;
    } catch (error) {
        console.error('🔍 saveLeadFinderAPIKey: Error:', error);
        throw error;
    }
};

/**
 * ensureLeadFinderAutomation - Initialize Lead Finder automation
 * Uses Firebase callable function
 */
export const ensureLeadFinderAutomation = async (enabled) => {
    console.log('🔥🔥🔥 ensureLeadFinderAutomation SERVICE FUNCTION CALLED');
    console.log('🔥 SERVICE STACK:', new Error().stack);
    console.log('🔍 ensureLeadFinderAutomation: Starting callable function call...', { enabled });
    try {
        const result = await callFunction('ensureLeadFinderAutomation', { enabled });
        console.log('🔍 ensureLeadFinderAutomation: Success:', result);
        return result;
    } catch (error) {
        console.error('🔍 ensureLeadFinderAutomation: Error:', error);
        throw error;
    }
};

export const startAILeadCampaign = async (campaignData) => {
    return callFunction('startAILeadCampaign', campaignData);
};

// ============================================================================
// CLIENT CONFIG SERVICES
// ============================================================================

export const getClientConfig = async () => {
    return callFunction('getClientConfig');
};

export const saveClientConfig = async (configData) => {
    return callFunction('saveClientConfig', configData);
};

// ============================================================================
// FAQ SERVICES
// ============================================================================

export const getFAQs = async (activeOnly = false) => {
    return callFunction('getFAQs', { activeOnly });
};

export const createFAQ = async (question, answer, isActive = true) => {
    return callFunction('createFAQ', { question, answer, isActive });
};

export const updateFAQ = async (faqId, updates) => {
    return callFunction('updateFAQ', { faqId, ...updates });
};

export const deleteFAQ = async (faqId) => {
    return callFunction('deleteFAQ', { faqId });
};

// ============================================================================
// PART 2: SUGGESTIONS SERVICES
// ============================================================================

export const getSuggestions = async () => {
    return callFunction('getSuggestions');
};

export const createSuggestion = async (triggerIntent, suggestions, isActive = true) => {
    return callFunction('createSuggestion', { triggerIntent, suggestions, isActive });
};

export const updateSuggestion = async (suggestionId, updates) => {
    return callFunction('updateSuggestion', { suggestionId, ...updates });
};

export const deleteSuggestion = async (suggestionId) => {
    return callFunction('deleteSuggestion', { suggestionId });
};

// ============================================================================
// PART 1: SEMANTIC FAQ SERVICES
// ============================================================================

export const rebuildFaqEmbeddings = async () => {
    return callFunction('rebuildFaqEmbeddings');
};

export const testFaqMatch = async (message) => {
    return callFunction('testFaqMatch', { message });
};

// ============================================================================
// PART 3: WELCOME MESSAGE SERVICES
// ============================================================================

export const saveWelcomeConfig = async (welcomeConfig) => {
    return callFunction('saveWelcomeConfig', welcomeConfig);
};

// ============================================================================
// CHAT SERVICES
// ============================================================================

export const getChatLogs = async (phone = null, direction = null, limit = 100) => {
    return callFunction('getChatLogs', { phone, direction, limit });
};

export const getChatContacts = async () => {
    return callFunction('getChatContacts');
};

// Auth functions
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logOut = () => firebaseSignOut(auth);

// ============================================================================
// CLIENT AUTOMATION FUNCTIONS
// ============================================================================

export const getMyAutomations = async () => {
    return callFunction('getMyAutomations');
};

// Client functions (updated for True Multi-Tenant Isolation)
export const getClients = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'clients'));
    const newClients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // For backward compatibility, also fetch from legacy global collection if needed
    // This part is tricky because legacy might exist but we prefer new structure
    try {
        const legacySnapshot = await getDocs(collection(db, 'clients'));
        const legacyClients = legacySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(c => c.ownerId === user.uid || !c.ownerId); // Simple filter for legacy

        return [...newClients, ...legacyClients];
    } catch (e) {
        console.warn('Could not fetch legacy clients:', e);
        return newClients;
    }
};

export const getClient = async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Prefer new structure
    const docRef = doc(db, 'users', user.uid, 'clients', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }

    // Fallback to legacy
    const legacyRef = doc(db, 'clients', id);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
        const data = legacySnap.data();
        // Check ownership if possible
        if (data.ownerId === user.uid || !data.ownerId) {
            return { id: legacySnap.id, ...data };
        }
    }

    return null;
};

export const createClient = async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = await addDoc(collection(db, 'users', user.uid, 'clients'), {
        ...data,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateClient = async (id, data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Try new structure first
    const docRef = doc(db, 'users', user.uid, 'clients', id);
    try {
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        // Fallback to legacy
        const legacyRef = doc(db, 'clients', id);
        await updateDoc(legacyRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }
};

export const deleteClient = async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Try new structure first
    const docRef = doc(db, 'users', user.uid, 'clients', id);
    try {
        await deleteDoc(docRef);
    } catch (e) {
        // Fallback to legacy
        const legacyRef = doc(db, 'clients', id);
        await deleteDoc(legacyRef);
    }
};

// PHASE 8: Check if whatsappNumberId is already in use
// Updated to use collectionGroup to search across all clients in all users
import { collectionGroup } from 'firebase/firestore';

export const checkWhatsappNumberId = async (whatsappNumberId) => {
    const q = query(
        collectionGroup(db, 'clients'),
        where('whatsappNumberId', '==', whatsappNumberId),
        limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) return true;

    // Check legacy global collection too
    const qLegacy = query(
        collection(db, 'clients'),
        where('whatsappNumberId', '==', whatsappNumberId),
        limit(1)
    );
    const legacySnapshot = await getDocs(qLegacy);
    return !legacySnapshot.empty;
};

// Booking/Lead functions (compatible with both bookings and leads)
export const getBookings = async (clientId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // 1. Try new user-scoped leads (New System)
    let q = query(
        collection(db, 'users', user.uid, 'clients', clientId, 'leads'),
        orderBy('createdAt', 'desc'),
        limit(50)
    );
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // 2. Try legacy nested leads (Transition System)
        q = query(
            collection(db, 'clients', clientId, 'leads'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
        // 3. Fallback to legacy global bookings (Legacy System)
        q = query(
            collection(db, 'bookings'),
            where('restaurantId', '==', clientId),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        querySnapshot = await getDocs(q);
    }

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getBooking = async (id) => {
    const docRef = doc(db, 'bookings', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

export const updateBookingStatus = async (id, status) => {
    const docRef = doc(db, 'bookings', id);
    await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
    });
};

// Message functions (updated for client-based architecture)
export const getMessages = async (clientId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // 1. Try user-scoped messages
    let q = query(
        collection(db, 'users', user.uid, 'clients', clientId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(100)
    );
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // 2. Try legacy nested messages
        q = query(
            collection(db, 'clients', clientId, 'messages'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );
        querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
        // 3. Fallback to legacy global messages
        q = query(
            collection(db, 'messages'),
            where('restaurantId', '==', clientId),
            orderBy('timestamp', 'desc'),
            limit(100)
        );
        querySnapshot = await getDocs(q);
    }

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const sendMessage = async (clientId, to, text) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = await addDoc(collection(db, 'users', user.uid, 'clients', clientId, 'messages'), {
        from: to,
        text,
        direction: 'outgoing',
        timestamp: serverTimestamp()
    });
    return docRef.id;
};

// User functions (updated for client-based architecture)
export const getUsers = async (clientId) => {
    const q = query(
        collection(db, 'users'),
        where('restaurantId', '==', clientId), // Keep restaurantId for backward compatibility
        orderBy('lastSeen', 'desc'),
        limit(50)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ============================================================================
// PHASE 5: Analytics Helper Functions (updated for clients)
// ============================================================================

/**
 * Get conversation count for a client
 */
export const getConversationCount = async (clientId) => {
    const user = auth.currentUser;
    if (!user) return 0;

    // Try new user-scoped first
    let q = query(collection(db, 'users', user.uid, 'clients', clientId, 'messages'));
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // Try legacy nested
        q = query(collection(db, 'clients', clientId, 'messages'));
        querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
        // Fallback to legacy global
        q = query(
            collection(db, 'messages'),
            where('restaurantId', '==', clientId)
        );
        querySnapshot = await getDocs(q);
    }

    // Get unique sender count (conversations)
    const uniqueSenders = new Set();
    querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.from) uniqueSenders.add(data.from);
    });
    return uniqueSenders.size;
};

/**
 * Get total messages count for a client
 */
export const getMessageCount = async (clientId) => {
    const user = auth.currentUser;
    if (!user) return 0;

    let q = query(collection(db, 'users', user.uid, 'clients', clientId, 'messages'));
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        q = query(collection(db, 'clients', clientId, 'messages'));
        querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
        q = query(
            collection(db, 'messages'),
            where('restaurantId', '==', clientId)
        );
        querySnapshot = await getDocs(q);
    }

    return querySnapshot.size;
};

/**
 * Get booking/lead count for a client
 */
export const getBookingCount = async (clientId) => {
    const user = auth.currentUser;
    if (!user) return 0;

    // Try leads (new system)
    let q = query(collection(db, 'users', user.uid, 'clients', clientId, 'leads'));
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // Try legacy nested
        q = query(collection(db, 'clients', clientId, 'leads'));
        querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
        // Fallback to bookings
        q = query(
            collection(db, 'bookings'),
            where('restaurantId', '==', clientId)
        );
        querySnapshot = await getDocs(q);
    }

    return querySnapshot.size;
};

/**
 * Get active users (last 7 days) for a client
 */
export const getActiveUsers = async (clientId) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const q = query(
        collection(db, 'users'),
        where('restaurantId', '==', clientId) // Keep restaurantId for backward compatibility
    );
    const querySnapshot = await getDocs(q);

    let activeCount = 0;
    querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.lastSeen) {
            const lastSeen = data.lastSeen.toDate ? data.lastSeen.toDate() : new Date(data.lastSeen._seconds * 1000);
            if (lastSeen >= sevenDaysAgo) {
                activeCount++;
            }
        }
    });
    return activeCount;
};

/**
 * Get recent messages for a client (last N)
 */
export const getRecentMessages = async (clientId, count = 10) => {
    const user = auth.currentUser;
    if (!user) return [];

    let q = query(
        collection(db, 'users', user.uid, 'clients', clientId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(count)
    );
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        q = query(
            collection(db, 'clients', clientId, 'messages'),
            orderBy('timestamp', 'desc'),
            limit(count)
        );
        querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
        q = query(
            collection(db, 'messages'),
            where('restaurantId', '==', clientId),
            orderBy('timestamp', 'desc'),
            limit(count)
        );
        querySnapshot = await getDocs(q);
    }

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get recent bookings/leads for a client (last N)
 */
export const getRecentBookings = async (clientId, count = 10) => {
    const user = auth.currentUser;
    if (!user) return [];

    let q = query(
        collection(db, 'users', user.uid, 'clients', clientId, 'leads'),
        orderBy('createdAt', 'desc'),
        limit(count)
    );
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        q = query(
            collection(db, 'clients', clientId, 'leads'),
            orderBy('createdAt', 'desc'),
            limit(count)
        );
        querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
        q = query(
            collection(db, 'bookings'),
            where('restaurantId', '==', clientId),
            orderBy('createdAt', 'desc'),
            limit(count)
        );
        querySnapshot = await getDocs(q);
    }

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get user count for a client
 */
export const getUserCount = async (clientId) => {
    const q = query(
        collection(db, 'users'),
        where('restaurantId', '==', clientId) // Keep restaurantId for backward compatibility
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
};

/**
 * Get all leads across all clients
 * @returns {Promise<Array>} - Array of leads with client info
 */
/**
 * Get all leads across all clients for the current user
 * UPDATED: Multi-tenant support
 * @returns {Promise<Array>} - Array of leads with client info
 */
export const getLeads = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
        const allLeads = [];

        // 1. Get all clients for THIS user
        const clientsRef = collection(db, 'users', user.uid, 'clients');
        const clientsSnap = await getDocs(clientsRef);

        // 2. Aggregate leads from each client
        const leadPromises = clientsSnap.docs.map(async (clientDoc) => {
            const clientData = clientDoc.data();
            const leadsRef = collection(db, 'users', user.uid, 'clients', clientDoc.id, 'leads');
            const leadsSnap = await getDocs(query(leadsRef, orderBy('createdAt', 'desc')));

            return leadsSnap.docs.map(leadDoc => ({
                id: leadDoc.id,
                clientId: clientDoc.id,
                clientName: clientData.profile?.name || clientData.name || 'Unknown Client',
                ...leadDoc.data()
            }));
        });

        const nestedLeads = await Promise.all(leadPromises);
        nestedLeads.forEach(leads => allLeads.push(...leads));

        // 3. Fallback to legacy structure if no leads found in new structure
        if (allLeads.length === 0) {
            console.log('No leads in new structure, falling back to legacy global clients check');
            const legacyClientsSnapshot = await getDocs(collection(db, 'clients'));

            const legacyLeadPromises = legacyClientsSnapshot.docs.map(async (clientDoc) => {
                const clientData = clientDoc.data();
                // Check if this user owns the client or if it's unowned legacy
                if (clientData.ownerId === user.uid || !clientData.ownerId) {
                    const leadsQuery = query(
                        collection(db, 'clients', clientDoc.id, 'leads'),
                        orderBy('createdAt', 'desc')
                    );
                    const leadsSnapshot = await getDocs(leadsQuery);
                    return leadsSnapshot.docs.map(leadDoc => ({
                        id: leadDoc.id,
                        clientId: clientDoc.id,
                        clientName: clientData.profile?.name || clientData.name || 'Unknown Client',
                        ...leadDoc.data()
                    }));
                }
                return [];
            });

            const legacyNestedLeads = await Promise.all(legacyLeadPromises);
            legacyNestedLeads.forEach(leads => allLeads.push(...leads));
        }

        // 4. Final fallback to global bookings if still empty
        if (allLeads.length === 0) {
            console.log('Still no leads, checking global bookings collection');
            // This is complex as we don't know which restaurant belongs to which user in legacy bookings
            // Usually bookings have restaurantId
        }

        return allLeads.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt?.seconds * 1000);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt?.seconds * 1000);
            return dateB - dateA;
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        throw error;
    }
};

/**
 * Get leads for a specific client
 * @param {string} clientId - Client ID
 * @returns {Promise<Array>} - Array of leads
 */
export const getClientLeads = async (clientId) => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        // 1. Try new user-scoped path
        let q = query(
            collection(db, 'users', user.uid, 'clients', clientId, 'leads'),
            orderBy('createdAt', 'desc')
        );
        let querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // 2. Try legacy nested path
            q = query(
                collection(db, 'clients', clientId, 'leads'),
                orderBy('createdAt', 'desc')
            );
            querySnapshot = await getDocs(q);
        }

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            clientId: clientId,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching client leads:', error);
        throw error;
    }
};

/**
 * Get lead count for a client
 * @param {string} clientId - Client ID
 * @returns {Promise<number>} - Number of leads
 */
export const getLeadCount = async (clientId) => {
    try {
        const q = query(collection(db, 'clients', clientId, 'leads'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting lead count:', error);
        return 0;
    }
};

export { db, auth, functions, analytics, onAuthStateChanged, callFunction };
