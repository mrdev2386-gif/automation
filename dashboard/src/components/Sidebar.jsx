import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    Building2,
    CalendarDays,
    MessageCircle,
    UserCheck,
    Plus,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Sparkles,
    Search,
    Key,
    Zap
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, collapsed: propCollapsed, onToggleCollapse, isAdmin, user }) => {
    const [collapsed, setCollapsed] = useState(propCollapsed || false);
    const location = useLocation();

    // Admin navigation items
    const adminNavItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & Analytics' },
        { path: '/clients', icon: Building2, label: 'Clients', description: 'Manage Clients' },
        { path: '/clients/add', icon: Plus, label: 'Add Client', description: 'New Client' },
        { path: '/chats', icon: MessageCircle, label: 'Chats', description: 'Conversations' },
        { path: '/leads', icon: UserCheck, label: 'Leads', description: 'Lead Management' },
    ];

    // Client user navigation items - dynamically include assigned tools
    let clientNavItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Your Automations' },
        { path: '/my-chats', icon: MessageCircle, label: 'Chats', description: 'Conversations' },
        { path: '/my-leads', icon: UserCheck, label: 'Leads', description: 'Your Leads' },
    ];

    // Add Lead Finder if assigned to user
    if (user && user.assignedAutomations && user.assignedAutomations.includes('lead_finder')) {
        clientNavItems.push(
            { path: '/lead-finder', icon: Search, label: 'Lead Finder', description: 'Find Business Emails' },
            { path: '/lead-finder-settings', icon: Key, label: 'Lead Finder Settings', description: 'API Configuration' }
        );
    }

    // Add AI Lead Agent if assigned to user
    if (user && user.assignedAutomations && user.assignedAutomations.includes('ai_lead_agent')) {
        clientNavItems.push(
            { path: '/ai-lead-agent', icon: Zap, label: 'AI Lead Agent', description: 'Automated Lead Generation' }
        );
    }

    // Add common navigation items
    clientNavItems.push(
        { path: '/settings', icon: Settings, label: 'Settings', description: 'Integrations' }
    );

    // Use appropriate nav items based on role
    const navItems = isAdmin ? adminNavItems : clientNavItems;

    // Handle ESC key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleCollapse = () => {
        const newCollapsed = !collapsed;
        setCollapsed(newCollapsed);
        if (onToggleCollapse) {
            onToggleCollapse(newCollapsed);
        }
    };

    const sidebarWidth = collapsed ? 'w-20' : 'w-72';

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:relative inset-y-0 left-0 z-50 flex flex-col flex-shrink-0
                bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/95 text-white
                transform transition-all duration-300 ease-smooth
                ${sidebarWidth}
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent pointer-events-none" />

                {/* Header */}
                <div className="relative p-4 border-b border-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-3 transition-all duration-300 ${collapsed ? 'justify-center w-full' : ''}`}>
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                <h1 className="text-lg font-bold whitespace-nowrap">WA Automation</h1>
                                <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">Multi-Industry SaaS</p>
                            </div>
                        </div>

                        {/* Close button for mobile */}
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            aria-label="Close menu"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Collapse toggle button */}
                <button
                    onClick={handleCollapse}
                    className="hidden lg:flex absolute -right-3 top-20 z-10 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-200 shadow-md"
                >
                    {collapsed ? (
                        <ChevronRight className="w-3 h-3" />
                    ) : (
                        <ChevronLeft className="w-3 h-3" />
                    )}
                </button>

                {/* Navigation */}
                <nav className="relative flex-1 p-3 overflow-y-auto">
                    <div className="space-y-1">
                        {navItems.map((item, index) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            onClose();
                                        }
                                    }}
                                    className={`
                                        group flex items-center gap-3 px-3.5 py-3 rounded-xl 
                                        transition-all duration-200 font-medium text-sm
                                        ${isActive
                                            ? 'bg-primary-500/15 text-primary-400 shadow-sm'
                                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                        }
                                        ${collapsed ? 'justify-center' : ''}
                                    `}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className={`
                                        p-2 rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-primary-500/20 text-primary-400'
                                            : 'bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/50 group-hover:text-white'
                                        }
                                        ${collapsed ? '' : ''}
                                    `}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                        <span className="whitespace-nowrap block">{item.label}</span>
                                        <span className="text-xs text-slate-500 whitespace-nowrap block">{item.description}</span>
                                    </div>
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="relative p-3 border-t border-slate-800/50">
                    <div className="space-y-1">
                        <button className={`
                            flex items-center gap-3 px-3.5 py-2.5 text-slate-300 
                            hover:bg-slate-800/60 hover:text-white rounded-xl w-full 
                            transition-all duration-200 font-medium text-sm
                            ${collapsed ? 'justify-center' : ''}
                        `}>
                            <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400">
                                <Settings className="w-4 h-4" />
                            </div>
                            <span className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                Settings
                            </span>
                        </button>

                        <button className={`
                            flex items-center gap-3 px-3.5 py-2.5 text-slate-400 
                            hover:bg-error-500/10 hover:text-error-400 rounded-xl w-full 
                            transition-all duration-200 font-medium text-sm
                            ${collapsed ? 'justify-center' : ''}
                        `}>
                            <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400">
                                <LogOut className="w-4 h-4" />
                            </div>
                            <span className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                Logout
                            </span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
