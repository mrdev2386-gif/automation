import { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Shield, AlertCircle, Sparkles, Eye, EyeOff, Loader2, Zap, Bot, MessageCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Client-side validation to prevent 400 Bad Request
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Login success:', result.user.uid);
        } catch (error) {
            console.error('❌ Auth error:', error.code, error.message);
            
            if (error.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (error.code === 'auth/user-disabled') {
                setError('Your account has been disabled. Contact administrator.');
            } else if (error.code === 'auth/wrong-password') {
                setError('Incorrect password');
            } else if (error.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else if (error.code === 'auth/network-request-failed') {
                setError('Network error. Please check your connection.');
            } else if (error.code === 'auth/invalid-credential') {
                setError('Invalid credentials. Please check your email and password.');
            } else if (error.code === 'auth/user-not-found') {
                setError('User not found. Contact administrator to create your account.');
            } else {
                setError(error.message || 'Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Branding (60% Desktop, Hidden Mobile) */}
            <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 relative overflow-hidden">
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-10"></div>
                
                {/* Animated Blurs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-12 text-white w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-4 mb-16 animate-fade-in">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white">WA Automation</h1>
                            <p className="text-lg text-white/80 mt-1">Client Dashboard</p>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="max-w-xl mb-12 animate-fade-in" style={{animationDelay: '0.1s'}}>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight text-white">
                            Automate lead generation and business growth
                        </h2>
                        <p className="text-lg text-white/80 mt-4">
                            AI-powered tools designed for your success
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 gap-3 max-w-xl">
                        <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] animate-slide-up" style={{animationDelay: '0.2s'}}>
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base text-white">Lead Finder Automation</h3>
                                <p className="text-white/70 text-sm mt-0.5">Discover leads automatically</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] animate-slide-up" style={{animationDelay: '0.3s'}}>
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base text-white">AI Lead Agent Campaigns</h3>
                                <p className="text-white/70 text-sm mt-0.5">Smart automated outreach</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] animate-slide-up" style={{animationDelay: '0.4s'}}>
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base text-white">WhatsApp Business Automation</h3>
                                <p className="text-white/70 text-sm mt-0.5">24/7 customer engagement</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-16">
                        <p className="text-white/60 text-sm">© 2024 WA Automation. All rights reserved.</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form (40% Desktop, Full Mobile) */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="w-full max-w-md animate-fade-in">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mb-4 shadow-2xl">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">WA Automation</h1>
                        <p className="text-sm text-slate-400 mt-1">Client Dashboard</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 lg:p-10 space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
                            <p className="text-sm text-slate-400 mt-2">Sign in to access your automation tools</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3.5 text-sm text-white placeholder-slate-500 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none hover:border-slate-500"
                                    placeholder="you@company.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3.5 pr-12 text-sm text-white placeholder-slate-500 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none hover:border-slate-500"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-600 rounded focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                    <label htmlFor="remember" className="ml-2 text-slate-400">
                                        Remember me
                                    </label>
                                </div>
                                <a href="#" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl py-3.5 font-bold shadow-xl shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-indigo-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <Sparkles className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="pt-4 border-t border-slate-700/50">
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                                <Shield className="w-4 h-4 text-indigo-400" />
                                <span>Access by invitation only</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
