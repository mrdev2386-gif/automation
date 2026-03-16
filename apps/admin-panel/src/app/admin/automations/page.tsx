'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bot,
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    Loader2,
    Check,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Zap
} from 'lucide-react';
import { getAllAutomations, createAutomation, updateAutomation, deleteAutomation, seedDefaultAutomations, adminSignOut } from '@/lib/firebase-admin';

interface Automation {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    featureFlags?: Record<string, boolean>;
    createdAt: any;
}

export default function AdminAutomationsPage() {
    const router = useRouter();
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true
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
            const data = await getAllAutomations();
            setAutomations(data || []);
        } catch (err) {
            console.error('Failed to load automations:', err);
            setError('Failed to load automations');
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

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            isActive: true
        });
        setEditingAutomation(null);
        setError('');
        setSuccess('');
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (automation: Automation) => {
        setFormData({
            name: automation.name,
            description: automation.description || '',
            isActive: automation.isActive
        });
        setEditingAutomation(automation);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            if (!formData.name) {
                setError('Name is required');
                setSubmitting(false);
                return;
            }

            if (editingAutomation) {
                // Update existing automation
                await updateAutomation(editingAutomation.id, {
                    name: formData.name,
                    description: formData.description,
                    isActive: formData.isActive
                });
                setSuccess('Automation updated successfully');
            } else {
                // Create new automation
                await createAutomation({
                    name: formData.name,
                    description: formData.description,
                    isActive: formData.isActive
                });
                setSuccess('Automation created successfully');
            }

            setShowModal(false);
            resetForm();
            loadAutomations();
        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.message || 'Failed to save automation');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (automationId: string) => {
        if (!window.confirm('Are you sure you want to delete this automation?')) return;

        try {
            await deleteAutomation(automationId);
            setSuccess('Automation deleted successfully');
            loadAutomations();
        } catch (err: any) {
            console.error('Delete error:', err);
            setError(err.message || 'Failed to delete automation');
        }
    };

    const toggleActive = async (automation: Automation) => {
        try {
            await updateAutomation(automation.id, {
                isActive: !automation.isActive
            });
            loadAutomations();
        } catch (err: any) {
            console.error('Toggle error:', err);
            setError(err.message || 'Failed to update automation');
        }
    };

    const handleSeedDefaults = async () => {
        if (!window.confirm('This will create or update the four default automations. Continue?')) return;

        try {
            setSeeding(true);
            setError('');
            const result: any = await seedDefaultAutomations();
            setSuccess(`Successfully seeded ${result.results?.length || 0} automations`);
            loadAutomations();
        } catch (err: any) {
            console.error('Seed error:', err);
            setError(err.message || 'Failed to seed automations');
        } finally {
            setSeeding(false);
        }
    };

    const filteredAutomations = automations.filter(a =>
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading automations...</p>
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
                                onClick={() => router.push('/admin')}
                                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <Bot className="w-5 h-5 text-white" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-white">Automation Management</h1>
                                <p className="text-xs text-slate-400">WA Automation Admin</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={loadAutomations}
                                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                                title="Refresh"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search automations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-11 pr-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-150"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSeedDefaults}
                            disabled={seeding}
                            className="flex items-center justify-center gap-2 h-12 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                        >
                            {seeding ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Zap className="w-4 h-4" />
                            )}
                            Seed Defaults
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center justify-center gap-2 h-12 px-6 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Automation
                        </button>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 bg-success-500/10 border border-success-500/20 text-success-400 px-4 py-3 rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {success}
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-error-500/10 border border-error-500/20 text-error-400 px-4 py-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Automations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAutomations.map((automation) => (
                        <div
                            key={automation.id}
                            className={`bg-slate-800/50 rounded-2xl border overflow-hidden transition-all ${automation.isActive
                                ? 'border-slate-700/50 hover:border-primary-500/30'
                                : 'border-slate-700/30 opacity-60'
                                }`}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${automation.isActive
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'bg-slate-700/50 text-slate-500'
                                        }`}>
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <button
                                        onClick={() => toggleActive(automation)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${automation.isActive
                                            ? 'bg-success-500/20 text-success-400 hover:bg-success-500/30'
                                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                            }`}
                                    >
                                        {automation.isActive ? (
                                            <>
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3.5 h-3.5" />
                                                Inactive
                                            </>
                                        )}
                                    </button>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {automation.name}
                                </h3>
                                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                    {automation.description || 'No description'}
                                </p>

                                {/* Feature Flags */}
                                {automation.featureFlags && Object.keys(automation.featureFlags).length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {Object.entries(automation.featureFlags)
                                            .filter(([_, enabled]) => enabled)
                                            .slice(0, 4)
                                            .map(([feature]) => (
                                                <span
                                                    key={feature}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 text-slate-400 rounded-lg text-xs"
                                                >
                                                    <Zap className="w-3 h-3" />
                                                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            ))}
                                        {Object.keys(automation.featureFlags).length > 4 && (
                                            <span className="text-xs text-slate-500">
                                                +{Object.keys(automation.featureFlags).length - 4} more
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-4 border-t border-slate-700/50">
                                    <button
                                        onClick={() => openEditModal(automation)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-slate-700/50 rounded-xl transition-colors text-slate-300 hover:text-white text-sm font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(automation.id)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-error-500/20 rounded-xl transition-colors text-slate-400 hover:text-error-400 text-sm font-medium"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredAutomations.length === 0 && (
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 text-center">
                        <Bot className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                        <p className="text-slate-400 mb-4">No automations found</p>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Create your first automation
                        </button>
                    </div>
                )}
            </main>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {editingAutomation ? 'Edit Automation' : 'Create New Automation'}
                            </h2>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Automation Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
                                    placeholder="e.g., SaaS Lead Automation"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full h-24 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all resize-none"
                                    placeholder="Describe what this automation does..."
                                />
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-300">Active</p>
                                    <p className="text-xs text-slate-500">Enable or disable this automation</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-primary-500' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Form Actions */}
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 h-12 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            {editingAutomation ? 'Update' : 'Create'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
