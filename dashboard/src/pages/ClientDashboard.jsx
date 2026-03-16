import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Zap,
    MessageCircle,
    Users,
    TrendingUp,
    ArrowRight,
    Plus,
    Activity,
    Inbox,
    Settings,
    Search
} from 'lucide-react';
import { Card, StatCard, Badge, EmptyState, Button } from '../components/UI';
import { getMyAutomations } from '../services/firebase';

const ClientDashboard = () => {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadAutomations();
    }, []);

    const loadAutomations = async () => {
        try {
            setLoading(true);
            const data = await getMyAutomations();
            setAutomations(data.automations || []);
        } catch (error) {
            console.error('Error loading automations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAutomationIcon = (id) => {
        const icons = {
            lead_finder: Search,
            ai_lead_agent: Zap,
            whatsapp_ai: MessageCircle,
            default: Activity
        };
        return icons[id] || icons.default;
    };

    const getAutomationColor = (id) => {
        const colors = {
            lead_finder: 'from-blue-500 to-blue-600',
            ai_lead_agent: 'from-purple-500 to-purple-600',
            whatsapp_ai: 'from-green-500 to-green-600',
            default: 'from-slate-500 to-slate-600'
        };
        return colors[id] || colors.default;
    };

    const getAutomationRoute = (id) => {
        const routes = {
            lead_finder: '/lead-finder',
            ai_lead_agent: '/ai-lead-agent',
            whatsapp_ai: '/my-chats'
        };
        return routes[id] || '/';
    };

    if (loading) {
        return (
            <div className="animate-fade-in-up">
                <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Welcome Back
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Manage your automation tools and track performance
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <StatCard
                    icon={Zap}
                    value={automations.length}
                    label="Active Tools"
                />
                <StatCard
                    icon={MessageCircle}
                    value="0"
                    label="Messages Today"
                />
                <StatCard
                    icon={Users}
                    value="0"
                    label="Leads Generated"
                />
            </div>

            {/* Automations Grid */}
            {automations.length === 0 ? (
                <Card padding="p-12">
                    <EmptyState
                        icon={Inbox}
                        title="No automations assigned"
                        description="Contact your administrator to get started with automation tools"
                        action={
                            <Button onClick={() => navigate('/settings')}>
                                View Settings
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <div>
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Your Automation Tools
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Access and manage your assigned tools
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {automations.map((automation) => {
                            const Icon = getAutomationIcon(automation.id);
                            const route = getAutomationRoute(automation.id);
                            const gradient = getAutomationColor(automation.id);

                            return (
                                <Card
                                    key={automation.id}
                                    hover
                                    className="overflow-hidden cursor-pointer group"
                                    onClick={() => navigate(route)}
                                >
                                    {/* Gradient Header */}
                                    <div className={`h-24 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="absolute top-2 right-2 w-20 h-20 bg-white rounded-full blur-2xl"></div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Icon className="w-10 h-10 text-white opacity-90" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                            {automation.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                                            {automation.description}
                                        </p>

                                        {/* Status Badge */}
                                        <div className="flex items-center justify-between">
                                            <Badge variant="success">
                                                Active
                                            </Badge>
                                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group-hover:translate-x-1 transition-transform">
                                                <ArrowRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate('/my-leads')}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                    >
                        <Users className="w-5 h-5 text-slate-600 dark:text-slate-400 mb-2 group-hover:text-primary-600 transition-colors" />
                        <p className="font-medium text-slate-900 dark:text-white">View Leads</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your leads</p>
                    </button>

                    <button
                        onClick={() => navigate('/my-chats')}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                    >
                        <MessageCircle className="w-5 h-5 text-slate-600 dark:text-slate-400 mb-2 group-hover:text-primary-600 transition-colors" />
                        <p className="font-medium text-slate-900 dark:text-white">View Chats</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check conversations</p>
                    </button>

                    <button
                        onClick={() => navigate('/faqs')}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                    >
                        <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400 mb-2 group-hover:text-primary-600 transition-colors" />
                        <p className="font-medium text-slate-900 dark:text-white">Knowledge Base</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">View FAQs</p>
                    </button>

                    <button
                        onClick={() => navigate('/settings')}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                    >
                        <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400 mb-2 group-hover:text-primary-600 transition-colors" />
                        <p className="font-medium text-slate-900 dark:text-white">Settings</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure tools</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
