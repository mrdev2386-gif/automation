import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext, Suspense, lazy } from 'react';

// Import Firebase services from the existing firebase.js
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// Components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import AddRestaurant from './pages/AddRestaurant';
import Bookings from './pages/Bookings';
import Chats from './pages/Chats';
import Leads from './pages/Leads';
import RestaurantDetails from './pages/RestaurantDetails';
import ClientDashboard from './pages/ClientDashboard';
import AutomationDetail from './pages/AutomationDetail';
import Settings from './pages/Settings';
import Suggestions from './pages/Suggestions';
import LeadFinder from './pages/LeadFinder';
import LeadFinderSettings from './pages/LeadFinderSettings';
import AILeadAgent from './pages/AILeadAgent';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { ToastProvider, Loader, GlobalLoader } from './components/Toast';

const queryClient = new QueryClient();

// User Context
const UserContext = createContext(null);

// Main App Content Component
function AppContent() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Check user role from Firestore with strict isolation
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    console.log('🔐 Auth state changed - User logged in:', firebaseUser.uid);
                    
                    // Check user role from Firestore
                    const db = getFirestore();
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    
                    console.log('📄 Fetching user profile from Firestore...');
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        console.log('✅ User profile found in Firestore');
                        const userData = userDoc.data();

                        // SECURITY: Check isActive - force logout if disabled
                        if (userData.isActive !== true) {
                            // User is disabled - force logout
                            console.warn('⚠️ User account disabled:', firebaseUser.uid);
                            await auth.signOut();
                            setUser(null);
                            setLoading(false);
                            return;
                        }

                        // super_admin should go to admin panel (external Next.js app)
                        if (userData.role === 'super_admin') {
                            console.log('👑 Super admin detected, redirecting to admin panel');
                            window.location.href = '/admin';
                            return;
                        }

                        // For client_user, proceed with client dashboard
                        console.log('✅ User authenticated as client_user');
                        setUser({ ...firebaseUser, ...userData });
                    } else {
                        console.error('❌ User profile not found in Firestore');
                        await auth.signOut();
                        setUser(null);
                        setLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error('❌ Error in auth flow:', error);
                    console.error('Error code:', error.code);
                    console.error('Error message:', error.message);
                    
                    if (error.code === 'permission-denied') {
                        console.error('❌ Permission denied - user not authorized');
                        await auth.signOut();
                        setUser(null);
                    }
                    
                    // On error, treat as inactive for security
                    console.log('🚪 Logging out due to error');
                    await auth.signOut();
                    setUser(null);
                }
            } else {
                console.log('🚪 No user logged in');
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Handle sidebar collapse toggle
    const handleSidebarToggle = (collapsed) => {
        setSidebarCollapsed(collapsed);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader size="lg" />
                    <p className="text-slate-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <ToastProvider position="top-right">
                <Routes>
                    {/* Login Route - Full Screen (No Layout) */}
                    <Route
                        path="/login"
                        element={!user ? <Login /> : <Navigate to="/" />}
                    />
                    
                    {/* All Other Routes - With Dashboard Layout */}
                    <Route
                        path="/*"
                        element={
                            <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
                                {user && (
                                    <Sidebar
                                        user={user}
                                        isOpen={sidebarOpen}
                                        onClose={() => setSidebarOpen(false)}
                                        collapsed={sidebarCollapsed}
                                        onToggleCollapse={handleSidebarToggle}
                                        isAdmin={user.role === 'super_admin'}
                                    />
                                )}
                                <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                                    {user && (
                                        <Navbar
                                            user={user}
                                            onMenuClick={() => setSidebarOpen(true)}
                                            sidebarCollapsed={sidebarCollapsed}
                                        />
                                    )}
                                    <main className="flex-1 overflow-y-auto">
                                        <div className="p-4 sm:p-6 lg:p-8">
                                            <Routes>
                                    {/* Client User Routes - Show assigned automations */}
                                    <Route
                                        path="/"
                                        element={
                                            user && user.role === 'client_user'
                                                ? <ClientDashboard />
                                                : user && user.role === 'super_admin'
                                                    ? <Navigate to="/admin" />
                                                    : <Navigate to="/login" />
                                        }
                                    />
                                    <Route
                                        path="/automation/:id"
                                        element={
                                            user && user.role === 'client_user'
                                                ? <AutomationDetail />
                                                : <Navigate to="/login" />
                                        }
                                    />
                                    {/* Client user routes */}
                                    <Route
                                        path="/settings"
                                        element={
                                            user && user.role === 'client_user'
                                                ? <Settings />
                                                : <Navigate to="/login" />
                                        }
                                    />
                                    <Route
                                        path="/suggestions"
                                        element={
                                            user && user.role === 'client_user'
                                                ? <Suggestions />
                                                : <Navigate to="/login" />
                                        }
                                    />
                                    <Route
                                        path="/my-chats"
                                        element={
                                            user && user.role === 'client_user'
                                                ? <Chats />
                                                : <Navigate to="/login" />
                                        }
                                    />
                                    <Route
                                        path="/my-leads"
                                        element={
                                            user && user.role === 'client_user'
                                                ? <Leads />
                                                : <Navigate to="/login" />
                                        }
                                    />
                                    {/* Lead Finder Tool Route */}
                                    <Route
                                        path="/lead-finder"
                                        element={
                                            user && user.role === 'client_user' && user.assignedAutomations?.includes('lead_finder')
                                                ? <LeadFinder />
                                                : <Navigate to="/" />
                                        }
                                    />
                                    {/* Lead Finder Settings Route */}
                                    <Route
                                        path="/lead-finder-settings"
                                        element={
                                            user && user.role === 'client_user' && (user.assignedAutomations?.includes('lead_finder') || user.assignedAutomations?.includes('ai_lead_agent'))
                                                ? <LeadFinderSettings />
                                                : <Navigate to="/" />
                                        }
                                    />
                                    {/* AI Lead Agent Route */}
                                    <Route
                                        path="/ai-lead-agent"
                                        element={
                                            user && user.role === 'client_user' && user.assignedAutomations?.includes('ai_lead_agent')
                                                ? <AILeadAgent />
                                                : <Navigate to="/" />
                                        }
                                    />
                                    {/* Admin-only routes */}
                                    <Route
                                        path="/clients"
                                        element={user && user.role === 'super_admin' ? <Clients /> : <Navigate to="/" />}
                                    />
                                    <Route
                                        path="/clients/add"
                                        element={user && user.role === 'super_admin' ? <AddRestaurant /> : <Navigate to="/" />}
                                    />
                                    <Route
                                        path="/clients/edit/:id"
                                        element={user && user.role === 'super_admin' ? <AddRestaurant /> : <Navigate to="/" />}
                                    />
                                    <Route
                                        path="/clients/:id"
                                        element={user && user.role === 'super_admin' ? <RestaurantDetails /> : <Navigate to="/" />}
                                    />
                                    <Route
                                        path="/chats"
                                        element={user && user.role === 'super_admin' ? <Chats /> : <Navigate to="/" />}
                                    />
                                    <Route
                                        path="/leads"
                                        element={user && user.role === 'super_admin' ? <Leads /> : <Navigate to="/" />}
                                    />
                                    {/* Legacy routes */}
                                    <Route
                                        path="/restaurants"
                                        element={<Navigate to="/clients" replace />}
                                    />
                                    <Route
                                        path="/restaurants/add"
                                        element={<Navigate to="/clients/add" replace />}
                                    />
                                    <Route
                                        path="/restaurants/:id"
                                        element={user && user.role === 'super_admin' ? <RestaurantDetails /> : <Navigate to="/" />}
                                    />
                                    <Route
                                        path="/bookings"
                                        element={user && user.role === 'super_admin' ? <Bookings /> : <Navigate to="/" />}
                                    />
                                                {/* Removed admin routes - they are in apps/admin-panel */}
                                            </Routes>
                                        </div>
                                    </main>
                                </div>
                            </div>
                        }
                    />
                </Routes>
            </ToastProvider>
        </UserContext.Provider>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <AppContent />
            </Router>
        </QueryClientProvider>
    );
}

export default App;
