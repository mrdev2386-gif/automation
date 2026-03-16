'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Bot,
    Activity,
    Settings,
    LogOut,
    UserPlus,
    Shield,
    ChevronRight,
    Loader2,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Sparkles,
    Bell,
    Search
} from 'lucide-react';
import { getDashboardStats, getAllUsers, getAllAutomations, adminSignOut } from '@/lib/firebase-admin';

interface User {
    id: string;
    uid: string;
    email: string;
    role: string;
    isActive: boolean;
    assignedAutomations: string[];
    createdAt: any;
}

interface Automation {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: any;
}

interface Stats {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalAutomations: number;
    activeAutomations: number;
    inactiveAutomations: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    useEffect(() => {
        // Check admin auth
        if (typeof window !== 'undefined') {
            const adminUser = localStorage.getItem('admin_user');
            if (!adminUser) {
                router.push('/login');
                return;
            }
            const parsed = JSON.parse(adminUser);
            if (parsed.role !== 'super_admin') {
                router.push('/login');
                return;
            }
        }

        loadDashboardData();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [router]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, usersData, automationsData]: any = await Promise.all([
                getDashboardStats(),
                getAllUsers(),
                getAllAutomations()
            ]);
            setStats(statsData.stats);
            setUsers(usersData || []);
            setAutomations(automationsData || []);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await adminSignOut();
            if (typeof window !== 'undefined') {
                localStorage.removeItem('admin_user');
            }
            router.push('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const adminEmail = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('admin_user') || '{}').email
        : '';

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/20">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                                <p className="text-xs text-slate-400">WA Automation</p>
                            </div>
                        </div>

                        {/* Search bar */}
                        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search users, automations..."
                                    className="w-full h-10 pl-10 pr-4 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-150"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="relative p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200"
                                >
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full ring-2 ring-slate-900" />
                                </button>
                            </div>

                            <div className="h-8 w-px bg-slate-700" />

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-white">{adminEmail}</p>
                                    <p className="text-xs text-primary-400">Super Admin</p>
                                </div>
                                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-primary-600/20 to-primary-500/10 rounded-2xl p-6 mb-8 border border-primary-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">
                                Welcome back, Admin!
                            </h2>
                            <p className="text-slate-400">
                                Here's what's happening with your platform today.
                            </p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-3xl font-bold text-white">
                                {currentTime.toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-slate-400">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <div className="bg-slate-800/50 hover:bg-slate-800 rounded-2xl p-6 border border-slate-700/50 transition-all duration-200 hover:border-slate-600/50 hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-info-500/20 rounded-xl">
                                <Users className="w-6 h-6 text-info-400" />
                            </div>
                            <span className="text-success-400 text-sm flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                +12%
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats?.totalUsers || 0}</p>
                        <p className="text-sm text-slate-400">Total Users</p>
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <p className="text-xs text-slate-500">
                                {stats?.inactiveUsers || 0} inactive
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 hover:bg-slate-800 rounded-2xl p-6 border border-slate-700/50 transition-all duration-200 hover:border-slate-600/50 hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-success-500/20 rounded-xl">
                                <Activity className="w-6 h-6 text-success-400" />
                            </div>
                            <span className="text-success-400 text-sm flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                +8%
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats?.activeUsers || 0}</p>
                        <p className="text-sm text-slate-400">Active Users</p>
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <p className="text-xs text-slate-500">
                                {stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 hover:bg-slate-800 rounded-2xl p-6 border border-slate-700/50 transition-all duration-200 hover:border-slate-600/50 hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-500/20 rounded-xl">
                                <Bot className="w-6 h-6 text-purple-400" />
                            </div>
                            <span className="text-slate-400 text-sm flex items-center gap-1">
                                <TrendingDown className="w-4 h-4" />
                                0%
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats?.totalAutomations || 0}</p>
                        <p className="text-sm text-slate-400">Total Automations</p>
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <p className="text-xs text-slate-500">
                                {stats?.inactiveAutomations || 0} inactive
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 hover:bg-slate-800 rounded-2xl p-6 border border-slate-700/50 transition-all duration-200 hover:border-slate-600/50 hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-warning-500/20 rounded-xl">
                                <Settings className="w-6 h-6 text-warning-400" />
                            </div>
                            <span className="text-success-400 text-sm flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                +5%
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats?.activeAutomations || 0}</p>
                        <p className="text-sm text-slate-400">Active Automations</p>
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <p className="text-xs text-slate-500">
                                {stats?.totalAutomations ? Math.round((stats.activeAutomations / stats.totalAutomations) * 100) : 0}% of total
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                    <button
                        onClick={() => router.push('/admin/users')}
                        className="flex items-center justify-between p-6 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/50 transition-all group hover:border-primary-500/30"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-info-500/20 rounded-xl group-hover:bg-info-500/30 transition-colors">
                                <UserPlus className="w-6 h-6 text-info-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-semibold text-white">Manage Users</h3>
                                <p className="text-sm text-slate-400">Create, edit, or deactivate users</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                        onClick={() => router.push('/admin/automations')}
                        className="flex items-center justify-between p-6 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/50 transition-all group hover:border-purple-500/30"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                                <Bot className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-semibold text-white">Manage Automations</h3>
                                <p className="text-sm text-slate-400">Create and configure automations</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                </div>

                {/* Recent Users & Automations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="p-5 border-b border-slate-700/50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Recent Users</h3>
                                <button
                                    onClick={() => router.push('/admin/users')}
                                    className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                >
                                    View all
                                </button>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-700/50">
                            {users.slice(0, 5).map((user) => (
                                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-white">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{user.email}</p>
                                            <p className="text-xs text-slate-400">{user.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-success-500' : 'bg-error-500'}`}></span>
                                        <span className="text-xs text-slate-400">
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {users.length === 0 && (
                                <div className="p-6 text-center text-slate-400">
                                    No users found
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="p-5 border-b border-slate-700/50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Automations</h3>
                                <button
                                    onClick={() => router.push('/admin/automations')}
                                    className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                >
                                    View all
                                </button>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-700/50">
                            {automations.slice(0, 5).map((automation) => (
                                <div key={automation.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium text-white">{automation.name}</p>
                                        <p className="text-xs text-slate-400 truncate max-w-xs">
                                            {automation.description || 'No description'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${automation.isActive ? 'bg-success-500' : 'bg-slate-500'}`}></span>
                                        <span className="text-xs text-slate-400">
                                            {automation.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {automations.length === 0 && (
                                <div className="p-6 text-center text-slate-400">
                                    No automations found
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 bg-error-500/10 border border-error-500/20 text-error-400 px-4 py-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}
            </main>
        </div>
    );
}
