'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertCircle, Loader2, Eye, EyeOff, Sparkles, Zap, Bot, CheckCircle } from 'lucide-react';
import { adminSignIn, getUserProfile } from '@/lib/firebase-admin';

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await adminSignIn(email, password);
            const userProfile = await getUserProfile();

            if (!userProfile.isActive) {
                setError('Your account has been deactivated. Contact administrator.');
                setLoading(false);
                return;
            }

            if (userProfile.role !== 'super_admin') {
                setError('Access denied. Admin credentials required.');
                setLoading(false);
                return;
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('admin_user', JSON.stringify(userProfile));
            }

            router.push('/admin');
        } catch (err: any) {
            console.error('Login error:', err);

            if (err.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (err.code === 'auth/user-disabled') {
                setError('Your account has been disabled');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding (Hidden on Mobile) */}
            <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-12 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
                <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <div>
                        <div className="flex items-center gap-3 mb-12">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">WA Automation</h1>
                                <p className="text-white/80 text-sm">Admin Portal</p>
                            </div>
                        </div>

                        <div className="max-w-md">
                            <h2 className="text-4xl font-bold mb-4 leading-tight">
                                AI-powered automation platform
                            </h2>
                            <p className="text-xl text-white/90 mb-12">
                                For lead generation and business growth across multiple industries.
                            </p>

                            {/* Features List */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium">Lead Generation Tools</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium">AI WhatsApp Automation</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium">Multi-industry Automation</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium">Secure Client Management</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-white/60 text-sm">
                        © 2024 WA Automation. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 md:p-12 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="md:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">WA Automation</h1>
                        <p className="text-slate-600 text-sm mt-1">Admin Portal</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
                            <p className="text-slate-600">Sign in to your admin account</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    placeholder="admin@company.com"
                                    aria-label="Email Address"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        placeholder="••••••••"
                                        aria-label="Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-slate-600">
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-800 text-center flex items-center justify-center gap-2">
                                <Shield className="w-4 h-4" />
                                Access restricted to administrators only
                            </p>
                        </div>
                    </div>

                    {/* Footer - Desktop Only */}
                    <p className="hidden md:block text-center text-slate-500 text-sm mt-8">
                        © 2024 WA Automation. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
