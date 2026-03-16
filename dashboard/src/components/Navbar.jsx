import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    LogOut,
    Bell,
    User,
    Menu,
    Search,
    Settings,
    Moon,
    Sun,
    ChevronDown,
    MessageSquare,
    Users,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { logOut } from '../services/firebase';

// Page title mapping
const pageTitles = {
    '/': 'Dashboard',
    '/clients': 'Clients',
    '/clients/add': 'Add Client',
    '/chats': 'Chats',
    '/leads': 'Leads',
    '/bookings': 'Bookings',
    '/restaurants': 'Restaurants',
};

const Navbar = ({ user, onMenuClick, sidebarCollapsed }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const location = useLocation();
    const dropdownRef = useRef(null);
    const notificationsRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark', !darkMode);
    };

    const handleLogout = async () => {
        try {
            await logOut();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Sample notifications
    const notifications = [
        { id: 1, type: 'message', title: 'New message', description: 'You have a new message from John', time: '2 min ago', unread: true },
        { id: 2, type: 'lead', title: 'New lead', description: 'New lead added from Website', time: '1 hour ago', unread: true },
        { id: 3, type: 'booking', title: 'Booking confirmed', description: 'Table booking confirmed for tonight', time: '3 hours ago', unread: false },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    const pageTitle = pageTitles[location.pathname] || 'Dashboard';

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 transition-all duration-200">
            <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
                {/* Left section */}
                <div className="flex items-center gap-4">
                    {/* Mobile hamburger menu */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Page title */}
                    <div className="hidden sm:block">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {pageTitle}
                        </h2>
                    </div>

                    {/* Search bar - hidden on mobile */}
                    <div className="hidden md:flex items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-150"
                            />
                        </div>
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-2">
                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
                        aria-label="Toggle dark mode"
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Notifications */}
                    <div className="relative" ref={notificationsRef}>
                        <button
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-soft-lg border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in-down">
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors duration-150 ${notification.unread ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                                        >
                                            <div className={`p-2 rounded-xl flex-shrink-0 ${notification.type === 'message' ? 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400' :
                                                    notification.type === 'lead' ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400' :
                                                        'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400'
                                                }`}>
                                                {notification.type === 'message' ? <MessageSquare className="w-4 h-4" /> :
                                                    notification.type === 'lead' ? <Users className="w-4 h-4" /> :
                                                        <Calendar className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{notification.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{notification.description}</p>
                                                <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                                            </div>
                                            {notification.unread && (
                                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <button className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                                        View all notifications
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User menu */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 sm:gap-3 p-1.5 pr-3 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="hidden sm:block text-sm font-medium">
                                {user?.email?.split('@')[0] || 'User'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <>
                                {/* Mobile backdrop */}
                                <div
                                    className="fixed inset-0 z-40 lg:hidden"
                                    onClick={() => setDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-soft-lg border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in-down z-50">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.email}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Admin</p>
                                    </div>
                                    <div className="py-2">
                                        <button className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 w-full transition-colors duration-150">
                                            <User className="w-4 h-4" />
                                            <span className="text-sm font-medium">Profile</span>
                                        </button>
                                        <button className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 w-full transition-colors duration-150">
                                            <Settings className="w-4 h-4" />
                                            <span className="text-sm font-medium">Settings</span>
                                        </button>
                                    </div>
                                    <div className="py-2 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-4 py-2.5 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 w-full transition-colors duration-150"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm font-medium">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
