import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import {
    Key,
    MessageCircle,
    Bot,
    Save,
    Loader2,
    Check,
    AlertCircle,
    Eye,
    EyeOff,
    ToggleLeft,
    ToggleRight,
    Zap,
    Shield,
    RefreshCw,
    Plus,
    X
} from 'lucide-react';
import { Card, Input, Button, Badge } from '../components/UI';
import { getClientConfig, saveClientConfig, saveWelcomeConfig } from '../services/firebase';
import { checkWhatsAppRequirement } from '../utils/toolFeatures';

/**
 * Settings Page - Client Integrations Management
 * Allows clients to configure their OpenAI, WhatsApp, and assistant settings
 */
const Settings = () => {
    const [config, setConfig] = useState({
        openaiApiKey: '',
        metaPhoneNumberId: '',
        metaAccessToken: '',
        whatsappBusinessAccountId: '',
        webhookVerifyToken: '',
        assistantEnabled: false
    });
    const [welcomeConfig, setWelcomeConfig] = useState({
        welcomeEnabled: false,
        welcomeMessage: '',
        welcomeSuggestions: []
    });
    const [originalConfig, setOriginalConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);

    // UI state
    const [showOpenAIKey, setShowOpenAIKey] = useState(false);
    const [showMetaToken, setShowMetaToken] = useState(false);

    useEffect(() => {
        // Check if user has WhatsApp-enabled tools from Firestore user data
        const user = auth.currentUser;
        if (user) {
            fetchUserData();
        }
        fetchConfig();
    }, []);

    const fetchUserData = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const db = getFirestore();
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const tools = userData.assignedAutomations || [];
                    
                    // Compute whatsappEnabled dynamically from assigned tools
                    const enabled = checkWhatsAppRequirement(tools);
                    setWhatsappEnabled(enabled);
                }
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            setWhatsappEnabled(false);
        }
    };

    const fetchConfig = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await getClientConfig();

            if (result.config) {
                const loadedConfig = {
                    openaiApiKey: result.config.openaiApiKey || '',
                    metaPhoneNumberId: result.config.metaPhoneNumberId || '',
                    metaAccessToken: result.config.metaAccessToken || '',
                    whatsappBusinessAccountId: result.config.whatsappBusinessAccountId || '',
                    webhookVerifyToken: result.config.webhookVerifyToken || '',
                    assistantEnabled: result.config.assistantEnabled || false
                };
                setConfig(loadedConfig);
                setOriginalConfig(loadedConfig);

                // Load welcome config
                setWelcomeConfig({
                    welcomeEnabled: result.config.welcomeEnabled || false,
                    welcomeMessage: result.config.welcomeMessage || '',
                    welcomeSuggestions: result.config.welcomeSuggestions || []
                });
            }
        } catch (err) {
            console.error('Error fetching config:', err);
            setError(err.message || 'Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            // Only send fields that have values (to preserve masked fields)
            const updates = {};

            if (config.openaiApiKey && config.openaiApiKey !== '••••••••') {
                updates.openaiApiKey = config.openaiApiKey;
            }
            if (config.metaPhoneNumberId) {
                updates.metaPhoneNumberId = config.metaPhoneNumberId;
            }
            if (config.metaAccessToken && config.metaAccessToken !== '••••••••') {
                updates.metaAccessToken = config.metaAccessToken;
            }
            if (config.whatsappBusinessAccountId) {
                updates.whatsappBusinessAccountId = config.whatsappBusinessAccountId;
            }
            if (config.webhookVerifyToken) {
                updates.webhookVerifyToken = config.webhookVerifyToken;
            }
            updates.assistantEnabled = config.assistantEnabled;

            await saveClientConfig(updates);

            setSuccess('Configuration saved successfully!');

            // Update original config to reflect saved state
            setOriginalConfig({ ...config });

            // Clear sensitive fields after save
            if (updates.openaiApiKey) {
                setConfig(prev => ({ ...prev, openaiApiKey: '••••••••' }));
            }
            if (updates.metaAccessToken) {
                setConfig(prev => ({ ...prev, metaAccessToken: '••••••••' }));
            }

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error saving config:', err);
            setError(err.message || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleToggleAssistant = () => {
        setConfig(prev => ({
            ...prev,
            assistantEnabled: !prev.assistantEnabled
        }));
    };

    const hasChanges = () => {
        if (!originalConfig) return false;

        return (
            config.openaiApiKey !== originalConfig.openaiApiKey ||
            config.metaPhoneNumberId !== originalConfig.metaPhoneNumberId ||
            config.metaAccessToken !== originalConfig.metaAccessToken ||
            config.whatsappBusinessAccountId !== originalConfig.whatsappBusinessAccountId ||
            config.webhookVerifyToken !== originalConfig.webhookVerifyToken ||
            config.assistantEnabled !== originalConfig.assistantEnabled
        );
    };

    const testOpenAIConnection = async () => {
        if (!config.openaiApiKey || config.openaiApiKey === '••••••••') {
            setError('Please enter a valid OpenAI API key first');
            return;
        }

        // Simple validation - check format
        if (!config.openaiApiKey.startsWith('sk-')) {
            setError('Invalid OpenAI API key format. Keys should start with "sk-"');
            return;
        }

        setSuccess('OpenAI API key format is valid!');
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleSaveWelcome = async () => {
        try {
            setSaving(true);
            setError(null);
            await saveWelcomeConfig(welcomeConfig);
            setSuccess('Welcome message configuration saved!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Failed to save welcome configuration');
        } finally {
            setSaving(false);
        }
    };

    const addWelcomeSuggestion = () => {
        if (welcomeConfig.welcomeSuggestions.length < 3) {
            setWelcomeConfig(prev => ({
                ...prev,
                welcomeSuggestions: [...prev.welcomeSuggestions, '']
            }));
        }
    };

    const removeWelcomeSuggestion = (index) => {
        setWelcomeConfig(prev => ({
            ...prev,
            welcomeSuggestions: prev.welcomeSuggestions.filter((_, i) => i !== index)
        }));
    };

    const updateWelcomeSuggestion = (index, value) => {
        setWelcomeConfig(prev => ({
            ...prev,
            welcomeSuggestions: prev.welcomeSuggestions.map((s, i) => i === index ? value : s)
        }));
    };

    if (loading) {
        return (
            <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                    <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div className="grid gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
                            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up max-w-4xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Settings
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Configure your AI assistant integrations
                    </p>
                </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="mb-6 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto text-sm underline">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {success && (
                <div className="mb-6 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <p>{success}</p>
                    </div>
                </div>
            )}

            {/* Assistant Toggle */}
            <Card className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                AI Assistant
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Enable or disable the WhatsApp AI assistant
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleAssistant}
                        className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
                    >
                        {config.assistantEnabled ? (
                            <ToggleRight className="w-14 h-8 text-primary-500" />
                        ) : (
                            <ToggleLeft className="w-14 h-8 text-slate-400" />
                        )}
                    </button>
                </div>
                {config.assistantEnabled && (
                    <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                        <p className="text-sm text-success-700 dark:text-success-400 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            AI Assistant is active and will respond to incoming messages
                        </p>
                    </div>
                )}
                {!config.assistantEnabled && (
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            AI Assistant is disabled. Enable to start responding to messages.
                        </p>
                    </div>
                )}
            </Card>

            {/* OpenAI Integration */}
            <Card className="mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                        <Key className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                            OpenAI Integration
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Configure your OpenAI API key for AI-powered responses
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            OpenAI API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showOpenAIKey ? 'text' : 'password'}
                                value={config.openaiApiKey}
                                onChange={(e) => handleChange('openaiApiKey', e.target.value)}
                                placeholder="sk-..."
                                className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                {showOpenAIKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            Your API key is stored securely and never exposed in the UI
                        </p>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={testOpenAIConnection}
                        className="flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Validate API Key
                    </Button>
                </div>
            </Card>

            {/* WhatsApp Integration - Only show if user has WhatsApp-enabled tools */}
            {whatsappEnabled && (
                <Card className="mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                WhatsApp (Meta Cloud API)
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Configure your Meta WhatsApp Business credentials
                            </p>
                        </div>
                    </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Phone Number ID
                            </label>
                            <Input
                                type="text"
                                value={config.metaPhoneNumberId}
                                onChange={(e) => handleChange('metaPhoneNumberId', e.target.value)}
                                placeholder="123456789012345"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                WhatsApp Business Account ID
                            </label>
                            <Input
                                type="text"
                                value={config.whatsappBusinessAccountId}
                                onChange={(e) => handleChange('whatsappBusinessAccountId', e.target.value)}
                                placeholder="987654321098765"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Meta Access Token
                        </label>
                        <div className="relative">
                            <input
                                type={showMetaToken ? 'text' : 'password'}
                                value={config.metaAccessToken}
                                onChange={(e) => handleChange('metaAccessToken', e.target.value)}
                                placeholder="EA..."
                                className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowMetaToken(!showMetaToken)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                {showMetaToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Webhook Verify Token
                        </label>
                        <Input
                            type="text"
                            value={config.webhookVerifyToken}
                            onChange={(e) => handleChange('webhookVerifyToken', e.target.value)}
                            placeholder="Your_verify_token_here"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Used to verify your webhook endpoint with Meta
                        </p>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Security Notice
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                            All tokens are stored securely. Never share your access tokens with anyone.
                            Make sure to set up webhook verification in the Meta Developer Console.
                        </p>
                    </div>
                </div>
            </Card>
            )}

            {/* PART 3: Welcome Message Configuration - Only show if WhatsApp enabled */}
            {whatsappEnabled && (
            <Card className="mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                            Welcome Message
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Auto-send greeting when users start a new conversation
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">Enable Welcome Message</p>
                            <p className="text-sm text-slate-500">Send auto-greeting on new conversation</p>
                        </div>
                        <button
                            onClick={() => setWelcomeConfig(prev => ({ ...prev, welcomeEnabled: !prev.welcomeEnabled }))}
                            className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
                        >
                            {welcomeConfig.welcomeEnabled ? (
                                <ToggleRight className="w-14 h-8 text-primary-500" />
                            ) : (
                                <ToggleLeft className="w-14 h-8 text-slate-400" />
                            )}
                        </button>
                    </div>

                    {welcomeConfig.welcomeEnabled && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Welcome Message
                                </label>
                                <textarea
                                    value={welcomeConfig.welcomeMessage}
                                    onChange={(e) => setWelcomeConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                                    placeholder="Hello! Welcome! How can I help you today?"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Quick Suggestions (max 3)
                                </label>
                                {welcomeConfig.welcomeSuggestions.map((suggestion, index) => (
                                    <div key={index} className="flex items-center gap-2 mb-2">
                                        <Input
                                            type="text"
                                            value={suggestion}
                                            onChange={(e) => updateWelcomeSuggestion(index, e.target.value)}
                                            placeholder={`Suggestion ${index + 1}`}
                                        />
                                        <button
                                            onClick={() => removeWelcomeSuggestion(index)}
                                            className="p-2 text-slate-400 hover:text-error-500"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {welcomeConfig.welcomeSuggestions.length < 3 && (
                                    <Button variant="secondary" onClick={addWelcomeSuggestion} className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Suggestion
                                    </Button>
                                )}
                            </div>

                            <Button onClick={handleSaveWelcome} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Welcome Configuration'}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-4">
                <Button
                    variant="secondary"
                    onClick={fetchConfig}
                    disabled={saving}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges()}
                    className="flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Configuration
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default Settings;
