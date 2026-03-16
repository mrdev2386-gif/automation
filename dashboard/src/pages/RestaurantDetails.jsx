import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    UtensilsCrossed,
    MessageCircle,
    CalendarDays,
    Users,
    Clock,
    Phone,
    MapPin,
    TrendingUp,
    Activity
} from 'lucide-react';
import {
    getClient,
    getConversationCount,
    getBookingCount,
    getActiveUsers,
    getRecentMessages,
    getRecentBookings,
    getUserCount
} from '../services/firebase';

/**
 * PHASE 6: Client Detail Report Page
 * Shows comprehensive analytics and details for a single client
 */
const RestaurantDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [stats, setStats] = useState({
        conversations: 0,
        bookings: 0,
        activeUsers: 0,
        totalUsers: 0
    });
    const [recentMessages, setRecentMessages] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [clientData, conversations, bookings, activeUsers, messages, bookingsData, totalUsers] = await Promise.all([
                getClient(id),
                getConversationCount(id),
                getBookingCount(id),
                getActiveUsers(id),
                getRecentMessages(id, 10),
                getRecentBookings(id, 10),
                getUserCount(id)
            ]);

            setClient(clientData);
            setStats({
                conversations,
                bookings,
                activeUsers,
                totalUsers
            });
            setRecentMessages(messages);
            setRecentBookings(bookingsData);
        } catch (error) {
            console.error('Error loading client details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            restaurant: 'bg-orange-100 text-orange-700',
            spa: 'bg-purple-100 text-purple-700',
            salon: 'bg-pink-100 text-pink-700',
            hotel: 'bg-blue-100 text-blue-700',
            clinic: 'bg-red-100 text-red-700',
            default: 'bg-gray-100 text-gray-700'
        };
        return colors[category] || colors.default;
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-green-100 text-green-700',
            suspended: 'bg-red-100 text-red-700',
            trial: 'bg-blue-100 text-blue-700'
        };
        return badges[status] || badges.active;
    };

    const getPlanBadge = (plan) => {
        const badges = {
            free: 'bg-gray-100 text-gray-600',
            starter: 'bg-yellow-100 text-yellow-700',
            pro: 'bg-indigo-100 text-indigo-700',
            enterprise: 'bg-purple-100 text-purple-700'
        };
        return badges[plan] || badges.free;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp._seconds * 1000);
        return date.toLocaleString();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp._seconds * 1000);
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div>
                <div className="flex items-center gap-4 mb-6 sm:mb-8">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
                    <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
                </div>
                <div className="card-modern p-6 mb-6 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="mobile-grid mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card animate-pulse">
                            <div className="h-12 w-12 bg-slate-200 rounded-xl mb-4"></div>
                            <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div>
                <div className="flex items-center gap-4 mb-6 sm:mb-8">
                    <button
                        onClick={() => navigate('/clients')}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Client Details</h1>
                </div>
                <div className="card-modern p-8 sm:p-12 text-center">
                    <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-600 mb-6 font-semibold text-lg">Client not found</p>
                    <button
                        onClick={() => navigate('/clients')}
                        className="btn-primary"
                    >
                        Back to Clients
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 sm:mb-8">
                <button
                    onClick={() => navigate('/clients')}
                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
                    aria-label="Back to clients"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Client Details</h1>
            </div>

            {/* Client Info Card */}
            <div className="card-modern p-6 sm:p-8 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
                                {client.profile?.name || client.name || 'Unnamed Client'}
                            </h2>
                            <span className={`badge ${getCategoryColor(client.category || client.industryType)}`}>
                                {client.category || client.industryType || 'Business'}
                            </span>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                            {(client.profile?.address || client.address) && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span>{client.profile?.address || client.address}</span>
                                </div>
                            )}
                            {(client.profile?.whatsappNumber || client.whatsappNumber) && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                    <span>{client.profile?.whatsappNumber || client.whatsappNumber}</span>
                                </div>
                            )}
                            {(client.profile?.timing || client.timing) && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    <span>{client.profile?.timing || client.timing}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className={`badge ${getStatusBadge(client.status)}`}>
                            {client.status || 'active'}
                        </span>
                        <span className={`badge ${getPlanBadge(client.plan)}`}>
                            {client.plan || 'free'} plan
                        </span>
                    </div>
                </div>
            </div>

            {/* Analytics Stats */}
            <div className="mobile-grid mb-6">
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="stat-icon bg-blue-50">
                            <MessageCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="stat-value">{stats.conversations}</h3>
                    <p className="stat-label">Total Conversations</p>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="stat-icon bg-green-50">
                            <CalendarDays className="w-6 h-6 text-green-600" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="stat-value">{stats.bookings}</h3>
                    <p className="stat-label">Total Bookings</p>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="stat-icon bg-purple-50">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <Activity className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="stat-value">{stats.activeUsers}</h3>
                    <p className="stat-label">Active Users (7 days)</p>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="stat-icon bg-orange-50">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="stat-value">{stats.totalUsers}</h3>
                    <p className="stat-label">Total Users</p>
                </div>
            </div>

            {/* Recent Messages & Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Messages */}
                <div className="card-modern overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-900 text-sm">Recent Messages</h3>
                    </div>
                    {recentMessages.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">No messages yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                            {recentMessages.map((msg) => (
                                <div key={msg.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-900 font-medium line-clamp-2">{msg.text}</p>
                                            <p className="text-xs text-slate-500 mt-1">{msg.from}</p>
                                        </div>
                                        <span className={`badge flex-shrink-0 ${
                                            msg.direction === 'incoming'
                                                ? 'bg-slate-100 text-slate-700'
                                                : 'badge-success'
                                        }`}>
                                            {msg.direction === 'incoming' ? 'In' : 'Out'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">{formatTimestamp(msg.timestamp)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Bookings */}
                <div className="card-modern overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-900 text-sm">Recent Bookings</h3>
                    </div>
                    {recentBookings.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <CalendarDays className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">No bookings yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                            {recentBookings.map((booking) => (
                                <div key={booking.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-900 font-medium">
                                                📅 {booking.date} at {booking.time}
                                            </p>
                                            <p className="text-xs text-slate-600 mt-1">
                                                👥 {booking.guests} guests • {booking.customerPhone}
                                            </p>
                                        </div>
                                        <span className={`badge flex-shrink-0 ${
                                            booking.status === 'confirmed'
                                                ? 'badge-success'
                                                : booking.status === 'cancelled'
                                                    ? 'badge-error'
                                                    : 'badge-warning'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">{formatDate(booking.createdAt)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestaurantDetails;
