import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UtensilsCrossed,
    CalendarDays,
    MessageCircle,
    Users,
    TrendingUp,
    ArrowRight,
    BarChart3,
    Plus,
    Store,
    Inbox
} from 'lucide-react';
import {
    getClients,
    getConversationCount,
    getBookingCount,
    getActiveUsers,
    getUserCount
} from '../services/firebase';
import { Card, StatCard, Badge, EmptyState, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI';

/**
 * Modern Dashboard with Client Analytics
 * Shows per-client analytics widgets
 */
const Dashboard = () => {
    const [clients, setClients] = useState([]);
    const [clientStats, setClientStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getClients();
            setClients(data);

            // Load stats for each client
            setStatsLoading(true);
            const statsMap = {};

            // Load all stats in parallel
            const statsPromises = data.map(async (client) => {
                const [conversations, bookings, activeUsers, totalUsers] = await Promise.all([
                    getConversationCount(client.id),
                    getBookingCount(client.id),
                    getActiveUsers(client.id),
                    getUserCount(client.id)
                ]);
                statsMap[client.id] = {
                    conversations,
                    bookings,
                    activeUsers,
                    totalUsers
                };
            });

            await Promise.all(statsPromises);
            setClientStats(statsMap);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    };

    // Calculate totals
    const totalStats = clients.reduce((acc, c) => {
        const s = clientStats[c.id] || {};
        return {
            conversations: acc.conversations + (s.conversations || 0),
            bookings: acc.bookings + (s.bookings || 0),
            activeUsers: acc.activeUsers + (s.activeUsers || 0),
            totalUsers: acc.totalUsers + (s.totalUsers || 0)
        };
    }, { conversations: 0, bookings: 0, activeUsers: 0, totalUsers: 0 });

    const getCategoryColor = (industryType) => {
        const colors = {
            restaurant: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            hotel: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            saas: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            service: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            spa: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
            salon: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
            clinic: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            gym: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
        };
        return colors[industryType] || colors.default;
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: 'success',
            suspended: 'error',
            trial: 'info'
        };
        return badges[status] || 'success';
    };

    // Loading skeleton component
    const StatSkeleton = () => (
        <Card className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        </Card>
    );

    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-between mb-8">
                    <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your business analytics</p>
                </div>
                <Button
                    onClick={() => navigate('/clients/add')}
                    className="flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Client
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatCard
                    icon={Store}
                    value={clients.length}
                    label="Total Clients"
                    trend={12}
                    trendLabel="vs last month"
                />
                <StatCard
                    icon={MessageCircle}
                    value={totalStats.conversations}
                    label="Total Conversations"
                    trend={8}
                    trendLabel="vs last month"
                />
                <StatCard
                    icon={CalendarDays}
                    value={totalStats.bookings}
                    label="Total Bookings"
                    trend={24}
                    trendLabel="vs last month"
                />
                <StatCard
                    icon={Users}
                    value={totalStats.totalUsers}
                    label="Total Users"
                    trend={5}
                    trendLabel="vs last month"
                />
            </div>

            {/* Clients Overview */}
            <Card padding="p-0" className="overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your Clients</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage and view client analytics</p>
                    </div>
                    <button
                        onClick={() => navigate('/clients')}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 font-medium transition-colors"
                    >
                        View all <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {clients.length === 0 ? (
                    <EmptyState
                        icon={Inbox}
                        title="No clients yet"
                        description="Add your first client to start tracking analytics and managing your business."
                        action={
                            <Button onClick={() => navigate('/clients/add')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Client
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="hidden sm:table-cell">Industry</TableHead>
                                    <TableHead className="hidden md:table-cell">Status</TableHead>
                                    <TableHead className="hidden lg:table-cell">Conversations</TableHead>
                                    <TableHead className="hidden lg:table-cell">Bookings</TableHead>
                                    <TableHead className="hidden xl:table-cell">Active Users</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.slice(0, 5).map((client) => {
                                    const stats = clientStats[client.id] || {};
                                    return (
                                        <TableRow key={client.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Store className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 dark:text-white truncate">{client.profile?.name || client.name || 'Unnamed Client'}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate sm:hidden">{client.industryType || 'General'}</p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate hidden sm:block">{client.profile?.whatsappNumber || client.whatsappNumber || 'No WhatsApp'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <span className={`badge ${getCategoryColor(client.industryType)} capitalize`}>
                                                    {client.industryType || 'General'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <Badge variant={getStatusBadge(client.status)}>
                                                    {client.status || 'active'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                                    <MessageCircle className="w-4 h-4" />
                                                    {statsLoading ? '...' : stats.conversations || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                                    <CalendarDays className="w-4 h-4" />
                                                    {statsLoading ? '...' : stats.bookings || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden xl:table-cell">
                                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                                    <Users className="w-4 h-4" />
                                                    {statsLoading ? '...' : stats.activeUsers || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <button
                                                    onClick={() => navigate(`/clients/${client.id}`)}
                                                    className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                >
                                                    <BarChart3 className="w-4 h-4" />
                                                    <span className="hidden sm:inline">View</span>
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Dashboard;
