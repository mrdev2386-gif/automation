'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    Loader2,
    Check,
    AlertCircle,
    Bot,
    CheckCircle,
    XCircle,
    Key,
    Power,
    PowerOff,
    Mail
} from 'lucide-react';
import { getAllUsers, getAllAutomations, createUser, updateUser, deleteUser, adminSignOut } from '@/lib/firebase-admin';

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
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
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

        loadData();
    }, [router]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, automationsData] = await Promise.all([
                getAllUsers(),
                getAllAutomations()
            ]);
            setUsers(usersData || []);
            setAutomations(automationsData || []);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load data');
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
            email: '',
            password: '',
            role: 'client_user',
            assignedAutomations: []
        });
        setEditingUser(null);
        setError('');
        setSuccess('');
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (user: User) => {
        setFormData({
            email: user.email,
            password: '',
            role: user.role,
            assignedAutomations: user.assignedAutomations || []
        });
        setEditingUser(user);
        setShowModal(true);
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
        setSubmitting(true);

        try {
            if (!formData.email || !formData.password && !editingUser) {
                setError('Email and password are required');
                setSubmitting(false);
                return;
            }

            if (editingUser) {
                // Update existing user
                const updateData: any = {
                    assignedAutomations: formData.assignedAutomations
                };

                await updateUser(editingUser.uid, updateData);
                setSuccess('User updated successfully');
            } else {
                // Create new user
                await createUser({
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    assignedAutomations: formData.assignedAutomations
                });
                setSuccess('User created successfully');
            }

            setShowModal(false);
            resetForm();
            loadData();
        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.message || 'Failed to save user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await deleteUser(userId);
            setSuccess('User deleted successfully');
            loadData();
        } catch (err: any) {
            console.error('Delete error:', err);
            setError(err.message || 'Failed to delete user');
        }
    };

    const handleToggleActive = async (user: User) => {
        const action = user.isActive ? 'disable' : 'enable';
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            await updateUser(user.uid, { isActive: !user.isActive });
            setSuccess(`User ${action}d successfully`);
            loadData();
        } catch (err: any) {
            console.error('Toggle active error:', err);
            setError(err.message || `Failed to ${action} user`);
        }
    };

    const handleResetPassword = async (user: User) => {
        if (!window.confirm(`Send password reset email to ${user.email}?`)) return;

        try {
            // Use Firebase Auth password reset
            const response = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=AIzaSyAOB97HJHHsAbO5OQQ-kJtw3jyXU22A0bs`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requestType: 'PASSWORD_RESET',
                        email: user.email
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to send reset email');
            }

            setSuccess(`Password reset email sent to ${user.email}`);
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.message || 'Failed to send password reset email');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAutomationNames = (automationIds: string[]) => {
        return automationIds.map(id => {
            const automation = automations.find(a => a.id === id);
            return automation?.name || id;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading users...</p>
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
                                <Users className="w-5 h-5 text-white" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-white">User Management</h1>
                                <p className="text-xs text-slate-400">WA Automation Admin</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
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
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-11 pr-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-150"
                        />
                    </div>
                    <button
                        onClick={() => router.push('/admin/users/create')}
                        className="flex items-center justify-center gap-2 h-12 px-6 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create User
                    </button>
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

                {/* Users Table */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Email</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Role</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Automations</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Created</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <p className="text-white font-medium">{user.email}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${user.role === 'super_admin'
                                                    ? 'bg-purple-500/20 text-purple-400'
                                                    : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? 'text-success-400' : 'text-error-400'
                                                }`}>
                                                {user.isActive ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4" />
                                                        Inactive
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {(user.assignedAutomations || []).slice(0, 3).map((automationId) => (
                                                    <span
                                                        key={automationId}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs"
                                                    >
                                                        <Bot className="w-3 h-3" />
                                                        {getAutomationNames([automationId])[0]}
                                                    </span>
                                                ))}
                                                {(user.assignedAutomations || []).length > 3 && (
                                                    <span className="text-xs text-slate-400">
                                                        +{(user.assignedAutomations || []).length - 3} more
                                                    </span>
                                                )}
                                                {(user.assignedAutomations || []).length === 0 && (
                                                    <span className="text-xs text-slate-500">None</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">
                                            {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                                                    title="Edit Tools"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user)}
                                                    className="p-2 hover:bg-info-500/20 rounded-lg transition-colors text-slate-400 hover:text-info-400"
                                                    title="Reset Password"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        user.isActive
                                                            ? 'hover:bg-warning-500/20 text-slate-400 hover:text-warning-400'
                                                            : 'hover:bg-success-500/20 text-slate-400 hover:text-success-400'
                                                    }`}
                                                    title={user.isActive ? 'Disable User' : 'Enable User'}
                                                >
                                                    {user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.uid)}
                                                    className="p-2 hover:bg-error-500/20 rounded-lg transition-colors text-slate-400 hover:text-error-400"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No users found</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {editingUser ? 'Edit User' : 'Create New User'}
                            </h2>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    disabled={!!editingUser}
                                    className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all disabled:opacity-50"
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>

                            {/* Password (only for new users) */}
                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
                                        placeholder="Minimum 8 characters"
                                        required={!editingUser}
                                        minLength={8}
                                    />
                                </div>
                            )}

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Role
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                    disabled={!!editingUser}
                                    className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all disabled:opacity-50"
                                >
                                    <option value="client_user">Client User</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>

                            {/* Automation Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Assigned Automations
                                    <span className="text-slate-500 font-normal ml-2">
                                        (Select at least one for client users)
                                    </span>
                                </label>

                                {automations.length === 0 ? (
                                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        No automations available. Please create automations first.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {automations.map((automation) => (
                                            <button
                                                key={automation.id}
                                                type="button"
                                                onClick={() => handleAutomationToggle(automation.id)}
                                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${formData.assignedAutomations.includes(automation.id)
                                                        ? 'bg-primary-500/20 border-primary-500 text-white'
                                                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center ${formData.assignedAutomations.includes(automation.id)
                                                        ? 'bg-primary-500 text-white'
                                                        : 'bg-slate-700'
                                                    }`}>
                                                    {formData.assignedAutomations.includes(automation.id) && (
                                                        <Check className="w-3 h-3" />
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-sm">{automation.name}</p>
                                                    <p className="text-xs text-slate-500 truncate">{automation.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Warning if no automations selected */}
                                {formData.role === 'client_user' && formData.assignedAutomations.length === 0 && (
                                    <div className="mt-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        Please select at least one automation for client users
                                    </div>
                                )}
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
                                    disabled={submitting || (formData.role === 'client_user' && formData.assignedAutomations.length === 0)}
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
                                            {editingUser ? 'Update User' : 'Create User'}
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
