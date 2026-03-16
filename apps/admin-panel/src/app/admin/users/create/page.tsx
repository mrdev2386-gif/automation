'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    UserPlus,
    ArrowLeft,
    Check,
    Loader2,
    AlertCircle,
    CheckCircle,
    Bot,
    Eye,
    EyeOff
} from 'lucide-react';
import { createUser, getAllAutomations, adminSignOut } from '@/lib/firebase-admin';

interface Automation {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
}

const TOOL_CONFIGS = {
    saas_automation: {
        name: 'SaaS Lead Automation',
        description: 'Capture and nurture SaaS product leads',
        icon: '🚀'
    },
    restaurant_automation: {
        name: 'Restaurant Growth Automation',
        description: 'Bookings, reviews, and customer engagement',
        icon: '🍽️'
    },
    hotel_automation: {
        name: 'Hotel Booking Automation',
        description: 'Guest inquiries and booking management',
        icon: '🏨'
    },
    whatsapp_ai_assistant: {
        name: 'AI WhatsApp Receptionist',
        description: 'Intelligent automated customer support',
        icon: '🤖'
    },
    lead_finder: {
        name: 'Lead Finder',
        description: 'Automated business email discovery',
        icon: '🔍'
    },
    ai_lead_agent: {
        name: 'AI Lead Agent',
        description: 'Automated lead generation campaigns',
        icon: '⚡'
    }
};

export default function CreateUserPage() {
    const router = useRouter();
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'client_user',
        assignedAutomations: [] as string[]
    });

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

        loadAutomations();
    }, [router]);

    const loadAutomations = async () => {
        try {
            setLoading(true);
            const automationsData = await getAllAutomations();
            setAutomations(automationsData || []);
        } catch (err) {
            console.error('Failed to load automations:', err);
            setError('Failed to load automations');
        } finally {
            setLoading(false);
        }
    };

    const handleAutomationToggle = (automationId: string) => {
        setFormData(prev => ({
            ...prev,
            assignedAutomations: prev.assignedAutomations.includes(automationId)
                ? prev.assignedAutomations.filter(id => id !== automationId)
                : [...prev.assignedAutomations, automationId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.email || !formData.password) {
            setError('Email and password are required');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (formData.role === 'client_user' && formData.assignedAutomations.length === 0) {
            setError('Please select at least one automation for client users');
            return;
        }

        try {
            setSubmitting(true);
            await createUser({
                email: formData.email,
                password: formData.password,
                role: formData.role,
                assignedAutomations: formData.assignedAutomations
            });

            setSuccess('User created successfully! Redirecting...');
            setTimeout(() => {
                router.push('/admin/users');
            }, 2000);
        } catch (err: any) {
            console.error('Create user error:', err);
            setError(err.message || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const getToolConfig = (automationId: string) => {
        return TOOL_CONFIGS[automationId as keyof typeof TOOL_CONFIGS] || {
            name: automationId,
            description: 'Automation tool',
            icon: '🔧'
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-white">Create New User</h1>
                                <p className="text-xs text-slate-400">WA Automation Admin</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success Message */}
                {success && (
                    <div className="mb-6 bg-success-500/10 border border-success-500/20 text-success-400 px-4 py-3 rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {success}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-error-500/10 border border-error-500/20 text-error-400 px-4 py-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary-500/20 rounded-xl">
                                <UserPlus className="w-6 h-6 text-primary-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">User Information</h2>
                                <p className="text-sm text-slate-400">Fill in the details to create a new client account</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address <span className="text-error-400">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
                                placeholder="user@example.com"
                                required
                            />
                            <p className="mt-2 text-xs text-slate-500">This will be used for login</p>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password <span className="text-error-400">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full h-12 px-4 pr-12 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
                                    placeholder="Minimum 8 characters"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Must be at least 8 characters long</p>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                User Role <span className="text-error-400">*</span>
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
                            >
                                <option value="client_user">Client User</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                            <p className="mt-2 text-xs text-slate-500">
                                {formData.role === 'client_user' 
                                    ? 'Client users can access assigned automation tools' 
                                    : 'Super admins have full access to the admin panel'}
                            </p>
                        </div>

                        {/* Automation Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Select Tools {formData.role === 'client_user' && <span className="text-error-400">*</span>}
                            </label>
                            <p className="text-sm text-slate-400 mb-4">
                                Choose which automation tools this user can access
                            </p>

                            {automations.length === 0 ? (
                                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    No automations available. Please create automations first.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {automations.map((automation) => {
                                        const config = getToolConfig(automation.id);
                                        const isSelected = formData.assignedAutomations.includes(automation.id);
                                        
                                        return (
                                            <button
                                                key={automation.id}
                                                type="button"
                                                onClick={() => handleAutomationToggle(automation.id)}
                                                className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                                                    isSelected
                                                        ? 'bg-primary-500/20 border-primary-500 shadow-lg shadow-primary-500/10'
                                                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                                                }`}
                                            >
                                                <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center mt-0.5 ${
                                                    isSelected
                                                        ? 'bg-primary-500 text-white'
                                                        : 'bg-slate-700'
                                                }`}>
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg">{config.icon}</span>
                                                        <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                            {config.name}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-2">
                                                        {config.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Warning if no tools selected for client user */}
                            {formData.role === 'client_user' && formData.assignedAutomations.length === 0 && (
                                <div className="mt-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    Please select at least one tool for client users
                                </div>
                            )}

                            {/* Selected count */}
                            {formData.assignedAutomations.length > 0 && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                                    <Bot className="w-4 h-4" />
                                    <span>{formData.assignedAutomations.length} tool{formData.assignedAutomations.length !== 1 ? 's' : ''} selected</span>
                                </div>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center gap-3 pt-6 border-t border-slate-700">
                            <button
                                type="button"
                                onClick={() => router.push('/admin/users')}
                                className="flex-1 h-12 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || (formData.role === 'client_user' && formData.assignedAutomations.length === 0)}
                                className="flex-1 h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating User...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        Create Client Account
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-info-500/10 border border-info-500/20 rounded-xl p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-info-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-info-300">
                            <p className="font-medium mb-1">What happens after creation?</p>
                            <ul className="space-y-1 text-info-400">
                                <li>• User will receive login credentials</li>
                                <li>• They can access only the assigned automation tools</li>
                                <li>• You can modify their tools anytime from the Users page</li>
                                <li>• Password can be reset if needed</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
