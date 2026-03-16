import React, { useState, useEffect } from 'react';
import {
    Zap,
    Play,
    Settings,
    Activity,
    Power,
    PowerOff,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Trash2,
    BarChart3,
    Key,
    Save
} from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getLeadFinderConfig, saveLeadFinderAPIKey, ensureLeadFinderAutomation, startAILeadCampaign } from '../services/firebase';
import { Card, Button, Badge, EmptyState, Toggle, StatCard, Input } from '../components/UI';
import { showToast } from '../utils/toast';



const AILeadAgent = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore();

    // State Management
    const [activeTab, setActiveTab] = useState('status');
    const [campaigns, setCampaigns] = useState([]);
    const [agentEnabled, setAgentEnabled] = useState(false);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [leadFinderConfigured, setLeadFinderConfigured] = useState(false);
    const [userTools, setUserTools] = useState([]);
    const [setupLoading, setSetupLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    // Configuration state
    const [apiKey, setApiKey] = useState('');
    const [savingApiKey, setSavingApiKey] = useState(false);

    // Campaign form state
    const [campaignName, setCampaignName] = useState('');
    const [campaignCountry, setCampaignCountry] = useState('');
    const [campaignNiche, setCampaignNiche] = useState('');
    const [leadLimit, setLeadLimit] = useState('500');
    const [minScore, setMinScore] = useState('8');
    const [enableEmail, setEnableEmail] = useState(false);
    const [enableWhatsApp, setEnableWhatsApp] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            checkSetupRequirements();
            loadCampaigns();
        }
    }, [user?.uid]);

    // Save API Key Handler
    const saveApiKey = async () => {
        if (!apiKey.trim()) {
            showToast('Please enter an API key', 'error');
            return;
        }

        try {
            setSavingApiKey(true);
            
            await saveLeadFinderAPIKey(apiKey);
            
            setLeadFinderConfigured(true);
            setApiKey('');
            showToast('API key saved successfully!', 'success');
        } catch (error) {
            console.error('Save API key failed:', error);
            showToast('Failed to save API key: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setSavingApiKey(false);
        }
    };
    // Toggle Handler
    const handleToggle = async () => {
        if (toggleLoading) return;
        
        try {
            setToggleLoading(true);
            
            await ensureLeadFinderAutomation(!agentEnabled);
            
            setAgentEnabled(!agentEnabled);
            showToast(`AI Lead Agent ${!agentEnabled ? 'enabled' : 'disabled'} successfully!`, 'success');
        } catch (error) {
            console.error('Toggle failed:', error);
            showToast('Failed to toggle AI Lead Agent: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setToggleLoading(false);
        }
    };

    const checkSetupRequirements = async () => {
        try {
            setSetupLoading(true);
            
            const result = await getLeadFinderConfig();
            
            setLeadFinderConfigured(result?.leadFinderConfigured || false);
            setAgentEnabled(result?.automationEnabled || false);
            
            const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
            const userSnap = await getDocs(userQuery);
            if (!userSnap.empty) {
                const userData = userSnap.docs[0].data();
                setUserTools(userData.assignedAutomations || []);
            }
        } catch (error) {
            console.error('Error checking setup:', error);
        } finally {
            setSetupLoading(false);
        }
    };

    const canStartCampaign = () => {
        return user && user.uid && leadFinderConfigured === true && userTools.length > 0;
    };

    const loadCampaigns = async () => {
        if (!user?.uid) return;

        try {
            setLoading(true);
            const q = query(collection(db, 'ai_lead_campaigns'), where('userId', '==', user.uid));
            const snapshot = await getDocs(q);
            const campaignsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCampaigns(campaignsList || []);
        } catch (error) {
            console.error('Error loading campaigns:', error);
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStartCampaign = async (e) => {
        e.preventDefault();

        if (processing) return;

        if (!user?.uid) {
            showToast('User not authenticated', 'error');
            return;
        }

        if (!campaignName.trim() || !campaignCountry.trim() || !campaignNiche.trim()) {
            showToast('All campaign fields are required', 'error');
            return;
        }

        const leadLimitNum = parseInt(leadLimit);
        if (isNaN(leadLimitNum) || leadLimitNum < 10 || leadLimitNum > 500) {
            showToast('Lead limit must be between 10 and 500', 'error');
            return;
        }

        const minScoreNum = parseInt(minScore);
        if (isNaN(minScoreNum) || minScoreNum < 1 || minScoreNum > 10) {
            showToast('Minimum score must be between 1 and 10', 'error');
            return;
        }

        if (!canStartCampaign()) {
            showToast('Please complete all setup requirements first', 'error');
            return;
        }

        try {
            setProcessing(true);

            const campaignData = {
                userId: user.uid,
                name: campaignName,
                country: campaignCountry,
                niche: campaignNiche,
                leadLimit: leadLimitNum,
                minScore: minScoreNum,
                enableEmail: enableEmail,
                enableWhatsApp: enableWhatsApp,
                status: 'active',
                progress: {
                    websitesDiscovered: 0,
                    websitesScanned: 0,
                    emailsFound: 0,
                    leadsQualified: 0,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const campaignRef = await addDoc(collection(db, 'ai_lead_campaigns'), campaignData);

            await startAILeadCampaign({
                campaignId: campaignRef.id,
                name: campaignName,
                country: campaignCountry,
                niche: campaignNiche,
                leadLimit: leadLimitNum,
                minScore: minScoreNum,
                enableEmail: enableEmail,
                enableWhatsApp: enableWhatsApp,
            });

            setCampaignName('');
            setCampaignCountry('');
            setCampaignNiche('');
            setLeadLimit('500');
            setMinScore('8');
            setEnableEmail(false);
            setEnableWhatsApp(false);

            await loadCampaigns();
            setActiveTab('dashboard');
            showToast('🚀 Campaign started successfully!', 'success');
        } catch (error) {
            console.error('Error starting campaign:', error);
            showToast('Failed to start campaign: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setProcessing(false);
        }
    };

    const deleteCampaign = async (campaignId) => {
        if (!confirm('Delete this campaign and all its leads?')) return;

        try {
            setLoading(true);
            await deleteDoc(doc(db, 'ai_lead_campaigns', campaignId));
            await loadCampaigns();
            showToast('Campaign deleted', 'success');
        } catch (error) {
            showToast('Failed to delete campaign', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (setupLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Modern Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                            <Zap className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            AI Lead Agent
                        </h1>
                    </div>
                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-4">
                        Automated AI-powered lead generation system
                    </p>
                    <div className="mt-4">
                        <Badge variant={leadFinderConfigured ? 'success' : 'warning'} className="text-sm">
                            {leadFinderConfigured ? 'Configured' : 'Not Configured'}
                        </Badge>
                    </div>
                </div>

                {/* Status Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Agent Status Card */}
                    <Card className="p-4 md:p-6 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 md:gap-4 mb-4">
                            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                                <Activity className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">Agent Status</h3>
                                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Current automation state</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Lead Agent</span>
                                <Badge variant={agentEnabled ? 'success' : 'neutral'}>
                                    {agentEnabled ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Lead Finder</span>
                                <Badge variant={leadFinderConfigured ? 'success' : 'warning'}>
                                    {leadFinderConfigured ? 'Configured' : 'Setup Required'}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Lead Generation Controls */}
                    <Card className="p-4 md:p-6 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 md:gap-4 mb-4">
                            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                <Settings className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">Controls</h3>
                                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Enable/disable automation</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-700 dark:text-slate-300">Enable AI Lead Agent</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Automate lead generation</p>
                                </div>
                                <Toggle
                                    checked={agentEnabled}
                                    onChange={handleToggle}
                                    className={toggleLoading ? 'opacity-50 pointer-events-none' : ''}
                                />
                            </div>
                            {toggleLoading && (
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Campaign Stats */}
                    <Card className="p-4 md:p-6 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 md:gap-4 mb-4">
                            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                                <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">Campaign Stats</h3>
                                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Active campaigns overview</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Campaigns</span>
                                <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{campaigns.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Leads</span>
                                <span className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {campaigns.reduce((sum, c) => sum + (c.progress?.leadsQualified || 0), 0)}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Setup Warning */}
                {!canStartCampaign() && (
                    <Card className="p-4 md:p-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">Setup Required</h3>
                                <p className="text-sm text-amber-800 dark:text-amber-300">
                                    {!leadFinderConfigured 
                                        ? 'Configure Lead Finder API key in the Configure tab to start campaigns' 
                                        : 'AI Lead Agent tool needs to be assigned to your account'}
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mx-auto">
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                            activeTab === 'status'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Status
                    </button>
                    <button
                        onClick={() => setActiveTab('configure')}
                        className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                            activeTab === 'configure'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Configure
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                            activeTab === 'create'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Create Campaign
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                            activeTab === 'dashboard'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Dashboard
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'status' && (
                    <Card className="p-6 md:p-8">
                        <div className="text-center">
                            <div className="p-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-fit mx-auto mb-4">
                                <Zap className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">AI Lead Agent Status</h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">Monitor your automation status and configuration</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-center mb-2">
                                        {agentEnabled ? (
                                            <Power className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <PowerOff className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <p className="font-medium text-slate-900 dark:text-white">Agent Status</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {agentEnabled ? 'Running' : 'Stopped'}
                                    </p>
                                </div>
                                
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-center mb-2">
                                        {leadFinderConfigured ? (
                                            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                        )}
                                    </div>
                                    <p className="font-medium text-slate-900 dark:text-white">Configuration</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {leadFinderConfigured ? 'Complete' : 'Incomplete'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'configure' && (
                    <Card className="p-6 md:p-8">
                        <div className="max-w-2xl mx-auto">
                            <div className="text-center mb-6">
                                <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-fit mx-auto mb-4">
                                    <Key className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">Lead Finder Configuration</h2>
                                <p className="text-slate-600 dark:text-slate-300">Configure your API key to enable lead generation</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="p-4 md:p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-3 h-3 rounded-full ${
                                            leadFinderConfigured ? 'bg-green-500' : 'bg-amber-500'
                                        }`} />
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            Status: {leadFinderConfigured ? 'Configured' : 'Not Configured'}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <Input
                                            label="Lead Finder API Key"
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="Enter your Lead Finder API key"
                                            disabled={savingApiKey}
                                            className="w-full"
                                        />
                                        
                                        <Button
                                            onClick={saveApiKey}
                                            disabled={savingApiKey || !apiKey.trim()}
                                            loading={savingApiKey}
                                            className="w-full md:w-auto"
                                        >
                                            {savingApiKey ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Save API Key
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">How to get your API key:</h3>
                                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                                        <li>Visit the Lead Finder service provider</li>
                                        <li>Create an account or log in</li>
                                        <li>Navigate to API settings</li>
                                        <li>Generate a new API key</li>
                                        <li>Copy and paste it above</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
                {activeTab === 'create' && (
                    <Card className="p-6 md:p-8">
                        <div className="max-w-2xl mx-auto">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6">Start New Campaign</h2>
                            <form onSubmit={handleStartCampaign} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Campaign Name
                                        </label>
                                        <input
                                            type="text"
                                            value={campaignName}
                                            onChange={(e) => setCampaignName(e.target.value)}
                                            placeholder="e.g., Tech Startups Q1"
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={processing}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Target Country
                                        </label>
                                        <input
                                            type="text"
                                            value={campaignCountry}
                                            onChange={(e) => setCampaignCountry(e.target.value)}
                                            placeholder="e.g., United States"
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={processing}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Target Niche
                                    </label>
                                    <input
                                        type="text"
                                        value={campaignNiche}
                                        onChange={(e) => setCampaignNiche(e.target.value)}
                                        placeholder="e.g., SaaS, E-commerce, Healthcare"
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        disabled={processing}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Lead Limit (10-500)
                                        </label>
                                        <input
                                            type="number"
                                            value={leadLimit}
                                            onChange={(e) => setLeadLimit(e.target.value)}
                                            min="10"
                                            max="500"
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={processing}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Minimum Score (1-10)
                                        </label>
                                        <input
                                            type="number"
                                            value={minScore}
                                            onChange={(e) => setMinScore(e.target.value)}
                                            min="1"
                                            max="10"
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={processing}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableEmail}
                                            onChange={(e) => setEnableEmail(e.target.checked)}
                                            disabled={processing}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">Enable Email Outreach</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableWhatsApp}
                                            onChange={(e) => setEnableWhatsApp(e.target.checked)}
                                            disabled={processing}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">Enable WhatsApp Outreach</span>
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing || !canStartCampaign()}
                                    className="w-full py-4 text-lg font-semibold"
                                    loading={processing}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Starting Campaign...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Start Campaign
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </Card>
                )}

                {activeTab === 'dashboard' && (
                    <div className="space-y-4 md:space-y-6">
                        {campaigns.length === 0 ? (
                            <EmptyState
                                icon={Zap}
                                title="No campaigns yet"
                                description="Create your first campaign to get started with AI-powered lead generation"
                                action={
                                    <Button onClick={() => setActiveTab('create')}>
                                        Create Campaign
                                    </Button>
                                }
                            />
                        ) : (
                            campaigns.map((campaign) => (
                                <Card key={campaign.id} className="p-4 md:p-6 hover:shadow-md transition-all duration-200">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 md:mb-6 gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-1">{campaign.name}</h3>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base">
                                                {campaign.country} • {campaign.niche}
                                            </p>
                                            <Badge variant="success" className="mt-2">
                                                {campaign.status || 'Active'}
                                            </Badge>
                                        </div>
                                        <button
                                            onClick={() => deleteCampaign(campaign.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all self-start"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                        <div className="text-center p-3 md:p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                            <p className="text-lg md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {campaign.progress?.leadsQualified || 0}
                                            </p>
                                            <p className="text-xs md:text-sm font-medium text-indigo-700 dark:text-indigo-300">Qualified Leads</p>
                                        </div>
                                        <div className="text-center p-3 md:p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                                            <p className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {campaign.progress?.emailsFound || 0}
                                            </p>
                                            <p className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-300">Emails Found</p>
                                        </div>
                                        <div className="text-center p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                                            <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                                                {campaign.progress?.websitesScanned || 0}
                                            </p>
                                            <p className="text-xs md:text-sm font-medium text-green-700 dark:text-green-300">Sites Scanned</p>
                                        </div>
                                        <div className="text-center p-3 md:p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                                            <p className="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                {campaign.progress?.websitesDiscovered || 0}
                                            </p>
                                            <p className="text-xs md:text-sm font-medium text-purple-700 dark:text-purple-300">Sites Found</p>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AILeadAgent;