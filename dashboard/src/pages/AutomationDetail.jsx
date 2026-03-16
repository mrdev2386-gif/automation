import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import {
    ArrowLeft,
    Loader2,
    Bot,
    Zap,
    MessageSquare,
    Calendar,
    CheckCircle,
    AlertCircle,
    Settings,
    BarChart3,
    Users,
    Building,
    Utensils,
    Star
} from 'lucide-react';
import { Card, Badge, Button, EmptyState } from '../components/UI';

/**
 * Automation Detail Page
 * Strict access control - only shows automation if assigned to user
 */
const AutomationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [automation, setAutomation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        verifyAndLoadAutomation();
    }, [id]);

    const verifyAndLoadAutomation = async () => {
        try {
            setLoading(true);
            setError(null);
            setAccessDenied(false);

            const functions = getFunctions(getApp());
            const getMyAutomations = httpsCallable(functions, 'getMyAutomations');

            const result = await getMyAutomations();
            const automations = result.data.automations || [];

            // Verify requested automation is in the assigned list
            const found = automations.find(a => a.id === id);

            if (!found) {
                // Access denied - automation not assigned
                setAccessDenied(true);
                setAutomation(null);
            } else {
                setAutomation(found);
            }
        } catch (err) {
            console.error('Error verifying automation access:', err);
            setError(err.message || 'Failed to verify access');
        } finally {
            setLoading(false);
        }
    };

    const getAutomationIcon = (automationId) => {
        const icons = {
            'saas_automation': Bot,
            'restaurant_automation': Utensils,
            'hotel_automation': Building,
            'whatsapp_ai_assistant': MessageSquare
        };
        return icons[automationId] || Bot;
    };

    const getAutomationColor = (automationId) => {
        const colors = {
            'saas_automation': 'from-purple-500 to-purple-600',
            'restaurant_automation': 'from-orange-500 to-orange-600',
            'hotel_automation': 'from-blue-500 to-blue-600',
            'whatsapp_ai_assistant': 'from-green-500 to-green-600'
        };
        return colors[automationId] || 'from-primary-500 to-primary-600';
    };

    // Loading state
    if (loading) {
        return (
            <div className="animate-fade-in-up">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <Card className="animate-pulse">
                    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </Card>
            </div>
        );
    }

    // Access Denied - 403
    if (accessDenied) {
        return (
            <div className="animate-fade-in-up">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Button>

                <Card className="max-w-md mx-auto text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-error-600 dark:text-error-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Access Denied
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        You don't have access to this automation. Please contact your administrator to request access.
                    </p>
                    <Button onClick={() => navigate('/')}>
                        Return to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="animate-fade-in-up">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Button>

                <Card className="bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800">
                    <div className="flex items-center gap-3 text-error-700 dark:text-error-400">
                        <AlertCircle className="w-5 h-5" />
                        <p>{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={verifyAndLoadAutomation}
                            className="ml-auto"
                        >
                            Retry
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Main content
    if (!automation) return null;

    const Icon = getAutomationIcon(automation.id) || Bot;
    const gradientColor = getAutomationColor(automation.id);

    return (
        <div className="animate-fade-in-up">
            {/* Back button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mb-6 flex items-center gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Button>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-8">
                <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientColor} text-white shadow-lg`}>
                        <Icon className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                {automation.name}
                            </h1>
                            <Badge variant={automation.isActive ? 'success' : 'neutral'}>
                                {automation.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">
                            {automation.description}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                    </Button>
                    <Button className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        View Analytics
                    </Button>
                </div>
            </div>

            {/* Feature Flags */}
            {automation.featureFlags && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Enabled Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(automation.featureFlags).map(([feature, enabled]) => (
                            <Card
                                key={feature}
                                className={enabled
                                    ? 'border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-900/10'
                                    : 'opacity-50'
                                }
                            >
                                <div className="flex items-center gap-3">
                                    {enabled ? (
                                        <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-slate-400" />
                                    )}
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Automation-specific content based on type */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content area */}
                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Automation Overview
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                        <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Total Conversations</p>
                                        <p className="text-sm text-slate-500">Last 30 days</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                                        <Calendar className="w-5 h-5 text-success-600 dark:text-success-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Bookings This Month</p>
                                        <p className="text-sm text-slate-500">Current period</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                                        <Users className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Active Users</p>
                                        <p className="text-sm text-slate-500">Currently engaged</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
                            </div>
                        </div>

                        {/* Coming soon message */}
                        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                            <Zap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-500 dark:text-slate-400">
                                Detailed analytics and configuration options coming soon.
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <Card>
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                            Quick Stats
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Status</span>
                                <Badge variant={automation.isActive ? 'success' : 'neutral'}>
                                    {automation.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Automation ID</span>
                                <span className="text-slate-900 dark:text-white font-mono text-sm">
                                    {automation.id}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Features Enabled</span>
                                <span className="text-slate-900 dark:text-white">
                                    {Object.values(automation.featureFlags || {}).filter(Boolean).length}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                            Actions
                        </h3>
                        <div className="space-y-2">
                            <Button variant="secondary" className="w-full justify-start">
                                <Settings className="w-4 h-4 mr-2" />
                                Configure
                            </Button>
                            <Button variant="secondary" className="w-full justify-start">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                View Reports
                            </Button>
                            <Button variant="secondary" className="w-full justify-start">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Support
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AutomationDetail;
