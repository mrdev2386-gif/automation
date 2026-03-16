/**
 * Lead Finder Settings Page
 * Allows users to configure their Lead Finder API key
 * and view current settings
 */

import React, { useState, useEffect } from 'react';
import { getLeadFinderConfig, saveLeadFinderAPIKey, auth } from '../services/firebase';
import { showToast } from '../utils/toast';
import { Lock, Key, Check, AlertCircle, Loader2, Plus, X } from 'lucide-react';

export default function LeadFinderSettings() {
    const [user, setUser] = useState(null);
    
    const [serpApiKeys, setSerpApiKeys] = useState(['']);
    const [apifyApiKeys, setApifyApiKeys] = useState(['']);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState(null);
    const [showSerpKeys, setShowSerpKeys] = useState([false]);
    const [showApifyKeys, setShowApifyKeys] = useState([false]);
    
    const MAX_API_KEYS = 10;

    // Load current config on mount
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                loadConfig();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            
            const result = await getLeadFinderConfig();
            setConfig(result);
            
            // Load SERP API keys (support both old and new format)
            if (result.serp_api_keys && Array.isArray(result.serp_api_keys)) {
                setSerpApiKeys(result.serp_api_keys.length > 0 ? result.serp_api_keys.map(k => '••••••••' + (k?.slice?.(-8) || '')) : ['']);
                setShowSerpKeys(new Array(result.serp_api_keys.length || 1).fill(false));
            } else if (result.api_key) {
                // Backward compatibility: convert old single key to array
                setSerpApiKeys(['••••••••' + (result.api_key?.slice?.(-8) || '')]);
                setShowSerpKeys([false]);
            }
            
            // Load Apify API keys (support both old and new format)
            if (result.apify_api_keys && Array.isArray(result.apify_api_keys)) {
                setApifyApiKeys(result.apify_api_keys.length > 0 ? result.apify_api_keys.map(k => '••••••••' + (k?.slice?.(-8) || '')) : ['']);
                setShowApifyKeys(new Array(result.apify_api_keys.length || 1).fill(false));
            } else if (result.apify_api_key) {
                // Backward compatibility: convert old single key to array
                setApifyApiKeys(['••••••••' + (result.apify_api_key?.slice?.(-8) || '')]);
                setShowApifyKeys([false]);
            }
        } catch (error) {
            console.error('Error loading config:', error);
            showToast('Failed to load settings. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSerpKey = () => {
        if (serpApiKeys.length >= MAX_API_KEYS) {
            showToast(`Maximum ${MAX_API_KEYS} SERP API keys allowed`, 'error');
            return;
        }
        setSerpApiKeys([...serpApiKeys, '']);
        setShowSerpKeys([...showSerpKeys, false]);
    };
    
    const handleRemoveSerpKey = (index) => {
        if (serpApiKeys.length === 1) {
            showToast('At least one API key field is required', 'error');
            return;
        }
        const newKeys = serpApiKeys.filter((_, i) => i !== index);
        const newShowKeys = showSerpKeys.filter((_, i) => i !== index);
        setSerpApiKeys(newKeys);
        setShowSerpKeys(newShowKeys);
    };
    
    const handleSerpKeyChange = (index, value) => {
        const newKeys = [...serpApiKeys];
        newKeys[index] = value;
        setSerpApiKeys(newKeys);
    };
    
    const handleAddApifyKey = () => {
        if (apifyApiKeys.length >= MAX_API_KEYS) {
            showToast(`Maximum ${MAX_API_KEYS} Apify API keys allowed`, 'error');
            return;
        }
        setApifyApiKeys([...apifyApiKeys, '']);
        setShowApifyKeys([...showApifyKeys, false]);
    };
    
    const handleRemoveApifyKey = (index) => {
        if (apifyApiKeys.length === 1) {
            showToast('At least one API key field is required', 'error');
            return;
        }
        const newKeys = apifyApiKeys.filter((_, i) => i !== index);
        const newShowKeys = showApifyKeys.filter((_, i) => i !== index);
        setApifyApiKeys(newKeys);
        setShowApifyKeys(newShowKeys);
    };
    
    const handleApifyKeyChange = (index, value) => {
        const newKeys = [...apifyApiKeys];
        newKeys[index] = value;
        setApifyApiKeys(newKeys);
    };

    const handleSaveApiKeys = async (e) => {
        e.preventDefault();

        // Clean and filter API keys - only include non-empty, non-masked keys
        const cleanedSerpKeys = (serpApiKeys || [])
            .map(k => k?.trim())
            .filter(k => k && k.length > 0 && !k.includes('••••'));

        const cleanedApifyKeys = (apifyApiKeys || [])
            .map(k => k?.trim())
            .filter(k => k && k.length > 0 && !k.includes('••••'));

        // Check if there are existing masked keys (indicating existing configuration)
        const hasMaskedSerp = (serpApiKeys || []).some(k => k && k.includes('••••'));
        const hasMaskedApify = (apifyApiKeys || []).some(k => k && k.includes('••••'));

        // Prepare final arrays - use cleaned keys if provided, otherwise send KEEP_EXISTING flag
        const finalSerpKeys = cleanedSerpKeys.length > 0 ? cleanedSerpKeys : (hasMaskedSerp ? ['KEEP_EXISTING'] : []);
        const finalApifyKeys = cleanedApifyKeys.length > 0 ? cleanedApifyKeys : (hasMaskedApify ? ['KEEP_EXISTING'] : []);

        // Check if user is trying to save without any keys (new or existing)
        if (finalSerpKeys.length === 0 && finalApifyKeys.length === 0) {
            showToast('Please add at least one API key before saving.', 'error');
            return;
        }

        try {
            setSaving(true);
            
            await saveLeadFinderAPIKey({
                serpApiKeys: finalSerpKeys,
                apifyApiKeys: finalApifyKeys
            });

            showToast('✅ API keys saved successfully!', 'success');

            // Reload config
            await loadConfig();

        } catch (error) {
            console.error('Error saving API keys:', error);
            showToast(error.message || 'Failed to save API keys', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <p className="text-gray-600">Please log in to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-12">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Key className="w-8 h-8 text-indigo-600" />
                        <h1 className="text-4xl font-bold text-gray-800">Lead Finder Settings</h1>
                    </div>
                    <p className="text-gray-600 mt-2">
                        Configure your Lead Finder API key to enable automatic website discovery
                    </p>
                </div>

                {/* API Key Section */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">API Key Configuration</h2>
                        
                        {/* Current Status */}
                        <div className={`p-4 rounded-lg flex items-center gap-3 mb-6 ${
                            (config?.serp_api_keys?.length > 0 || config?.api_key)
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-amber-50 border border-amber-200'
                        }`}>
                            {(config?.serp_api_keys?.length > 0 || config?.api_key) ? (
                                <>
                                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-green-900">API Keys Active</p>
                                        <p className="text-sm text-green-700">
                                            {config?.serp_api_keys?.length || 1} SERP API key(s) configured
                                            {config?.apify_api_keys?.length > 0 && `, ${config.apify_api_keys.length} Apify key(s)`}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-amber-900">No API Keys Set</p>
                                        <p className="text-sm text-amber-700">
                                            Add API keys to enable automatic website discovery
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-blue-900 mb-2">How to get your API key:</h3>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Visit <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline">SerpAPI.com</a></li>
                                <li>Sign up for a free account</li>
                                <li>Copy your API key from the dashboard</li>
                                <li>Paste it below to enable automatic website discovery</li>
                            </ol>
                        </div>
                    </div>

                    {/* API Keys Form */}
                    <form onSubmit={handleSaveApiKeys} className="space-y-6">
                        {/* SERP API Keys Section */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        SERP API Keys
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {serpApiKeys.length} / {MAX_API_KEYS} keys
                                    </span>
                                </div>
                            </label>
                            
                            <div className="space-y-3">
                                {serpApiKeys.map((key, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type={showSerpKeys[index] ? "text" : "password"}
                                                value={key}
                                                onChange={(e) => handleSerpKeyChange(index, e.target.value)}
                                                placeholder={`SERP API Key ${index + 1}`}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                disabled={saving}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newShowKeys = [...showSerpKeys];
                                                    newShowKeys[index] = !newShowKeys[index];
                                                    setShowSerpKeys(newShowKeys);
                                                }}
                                                className="absolute right-3 top-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                                                disabled={saving}
                                            >
                                                {showSerpKeys[index] ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                        {serpApiKeys.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSerpKey(index)}
                                                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                disabled={saving}
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {serpApiKeys.length < MAX_API_KEYS && (
                                <button
                                    type="button"
                                    onClick={handleAddSerpKey}
                                    className="mt-3 w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                                    disabled={saving}
                                >
                                    <Plus className="w-5 h-5" />
                                    Add SERP API Key
                                </button>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-2">
                                Keys are rotated automatically. Get your keys from <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">SerpAPI.com</a>
                            </p>
                        </div>

                        {/* Apify API Keys Section */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Apify API Keys (Optional)
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {apifyApiKeys.length} / {MAX_API_KEYS} keys
                                    </span>
                                </div>
                            </label>
                            
                            <div className="space-y-3">
                                {apifyApiKeys.map((key, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type={showApifyKeys[index] ? "text" : "password"}
                                                value={key}
                                                onChange={(e) => handleApifyKeyChange(index, e.target.value)}
                                                placeholder={`Apify API Key ${index + 1} (Optional)`}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                disabled={saving}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newShowKeys = [...showApifyKeys];
                                                    newShowKeys[index] = !newShowKeys[index];
                                                    setShowApifyKeys(newShowKeys);
                                                }}
                                                className="absolute right-3 top-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                                                disabled={saving}
                                            >
                                                {showApifyKeys[index] ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                        {apifyApiKeys.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveApifyKey(index)}
                                                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                disabled={saving}
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {apifyApiKeys.length < MAX_API_KEYS && (
                                <button
                                    type="button"
                                    onClick={handleAddApifyKey}
                                    className="mt-3 w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                                    disabled={saving}
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Apify API Key
                                </button>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-2">
                                Optional: For LinkedIn and Google Maps lead discovery. Get keys from <a href="https://apify.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Apify.com</a>
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                                saving
                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                            }`}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Key className="w-5 h-5" />
                                    Save API Keys
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info Section */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4">What happens next?</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex gap-3">
                                <span className="font-bold text-indigo-600">1.</span>
                                <span>Your API keys enable automatic website discovery from search engines</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-indigo-600">2.</span>
                                <span>Multiple keys are automatically rotated to maximize quota and avoid rate limits</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-indigo-600">3.</span>
                                <span>When you start a Lead Finder job, it automatically finds relevant websites</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-indigo-600">4.</span>
                                <span>Websites are queued for scraping with safety limits (max 3 concurrent jobs)</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-indigo-600">5.</span>
                                <span>Emails are extracted and automatically deduplicated before storage</span>
                            </li>
                        </ul>
                    </div>

                    {/* Configuration Details */}
                    <div className="mt-8 bg-gray-50 rounded-lg p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Your Configuration</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Daily Limit</p>
                                <p className="font-semibold text-gray-800">{config?.daily_limit || 500} leads</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Max Concurrent Jobs</p>
                                <p className="font-semibold text-gray-800">{config?.max_concurrent_jobs || 1}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Status</p>
                                <p className="font-semibold text-green-600">{config?.status?.toUpperCase() || 'ACTIVE'}</p>
                            </div>
                            {config?.created_at && (
                                <div>
                                    <p className="text-gray-600">Created</p>
                                    <p className="font-semibold text-gray-800">
                                        {new Date(config.created_at.seconds * 1000).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
                    <h3 className="font-bold text-gray-800 mb-4">Need Help?</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>📧 <strong>Email:</strong> Contact support@waautomation.com</li>
                        <li>📚 <strong>Docs:</strong> Read the <a href="/docs/lead-finder" className="text-indigo-600 underline">Lead Finder documentation</a></li>
                        <li>🔗 <strong>SerpAPI:</strong> <a href="https://serpapi.com/docs" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">API Documentation</a></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
