import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getApp } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../services/firebase';
import {
    Search,
    Loader2,
    Download,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Globe,
    Mail,
    Building2,
    MapPin,
    Zap,
    Plus,
    X,
    ChevronDown,
    ChevronUp,
    Eye,
    Copy,
    ExternalLink,
    Gauge,
    TrendingUp,
    Settings,
    Filter,
    RefreshCw,
    Clock
} from 'lucide-react';
import { Card, Badge, EmptyState, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI';
import { useToast } from '../components/Toast';

/**
 * Lead Finder Tool Dashboard - Premium Version
 * Find and extract business emails from websites with advanced features
 */
const LeadFinder = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('search'); // search, results, jobs

    // Search form state
    const [formData, setFormData] = useState({
        country: '',
        niche: '',
        limit: 500
    });

    // Filtering and search state
    const [filters, setFilters] = useState({
        minScore: 0,
        country: '',
        niche: '',
        emailDomain: '',
        searchText: ''
    });

    // Table state
    const [sortConfig, setSortConfig] = useState({ key: 'score', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Detail drawer state
    const [selectedLead, setSelectedLead] = useState(null);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);

    // Job state
    const [currentJobId, setCurrentJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Results state
    const [leads, setLeads] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState(new Set());
    const [stats, setStats] = useState({ websitesScanned: 0, emailsFound: 0 });

    // Google Sheets state
    const [webhookUrl, setWebhookUrl] = useState('');
    const [showWebhookInput, setShowWebhookInput] = useState(false);
    const [sendingToWebhook, setSendingToWebhook] = useState(false);

    // Status polling interval
    const statusPollInterval = useRef(null);

    useEffect(() => {
        fetchLeads();
    }, []);

    // Poll job status
    useEffect(() => {
        if (currentJobId && processing) {
            statusPollInterval.current = setInterval(pollJobStatus, 3000);
            return () => {
                if (statusPollInterval.current) {
                    clearInterval(statusPollInterval.current);
                    statusPollInterval.current = null;
                }
            };
        }
    }, [currentJobId, processing]);

    /**
     * Poll job status
     */
    const pollJobStatus = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();
            const response = await fetch(
                'https://us-central1-waautomation-13fa6.cloudfunctions.net/getLeadFinderStatus',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ jobId: currentJobId })
                }
            );

            const result = await response.json();
            const job = result.job;
            setJobStatus(job);

            if (job.status === 'completed' || job.status === 'failed') {
                setProcessing(false);
                if (statusPollInterval.current) {
                    clearInterval(statusPollInterval.current);
                    statusPollInterval.current = null;
                }
                if (job.status === 'completed') {
                    showToast('✅ Job completed successfully!', 'success');
                    await fetchLeads();
                } else {
                    showToast(`❌ Job failed: ${job.error}`, 'error');
                }
            }
        } catch (error) {
            console.error('Error polling status:', error);
        }
    };

    /**
     * Start lead finder job
     */
    const handleStartSearch = async (e) => {
        e.preventDefault();

        if (!formData.country || !formData.niche) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            setLoading(true);
            
            const user = auth.currentUser;
            if (!user) {
                showToast('Please login first', 'error');
                return;
            }

            const token = await user.getIdToken();
            const response = await fetch(
                'https://us-central1-waautomation-13fa6.cloudfunctions.net/startLeadFinder',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        country: formData.country,
                        niche: formData.niche,
                        limit: formData.limit
                    })
                }
            );

            const result = await response.json();
            console.log('Start Lead Finder Response:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to start lead finder');
            }

            setCurrentJobId(result.jobId);
            setProcessing(true);
            setActiveTab('jobs');
            showToast('🚀 Search started! Discovering and scraping websites...', 'success');
        } catch (error) {
            console.error('Error starting search:', error);
            showToast(error.message || 'Failed to start search', 'error');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch user's leads
     */
    const fetchLeads = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                showToast('Please login first', 'error');
                return;
            }

            const token = await user.getIdToken();
            const response = await fetch(
                'https://us-central1-waautomation-13fa6.cloudfunctions.net/getMyLeadFinderLeads',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('API RESPONSE:', result);

            if (!result) {
                throw new Error('Empty response from server');
            }

            const leads = result.leads || [];
            const jobs = result.jobs || [];

            setLeads(leads);
            setJobs(jobs);
        } catch (error) {
            console.error('Error fetching leads:', error);
            showToast('Failed to load leads', 'error');
        }
    };

    /**
     * Delete selected leads
     */
    const handleDeleteLeads = async () => {
        if (selectedLeads.size === 0) {
            showToast('Select leads to delete', 'error');
            return;
        }

        if (!confirm(`Delete ${selectedLeads.size} leads?`)) {
            return;
        }

        try {
            setLoading(true);
            
            const user = auth.currentUser;
            if (!user) {
                showToast('Please login first', 'error');
                return;
            }

            const token = await user.getIdToken();
            const leadIds = Array.from(selectedLeads);
            
            const response = await fetch(
                'https://us-central1-waautomation-13fa6.cloudfunctions.net/deleteLeadFinderLeads',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ leadIds })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete leads');
            }

            setSelectedLeads(new Set());
            await fetchLeads();
            showToast(`✅ Deleted ${leadIds.length} leads`, 'success');
        } catch (error) {
            console.error('Error deleting leads:', error);
            showToast(error.message || 'Failed to delete leads', 'error');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Filter and sort leads
     */
    const filteredAndSortedLeads = useMemo(() => {
        let filtered = leads.filter(lead => {
            // Apply filters
            if (filters.minScore && (lead.score || 0) < filters.minScore) return false;
            if (filters.country && lead.country?.toLowerCase() !== filters.country.toLowerCase()) return false;
            if (filters.niche && lead.niche?.toLowerCase() !== filters.niche.toLowerCase()) return false;
            if (filters.emailDomain) {
                const domain = lead.email?.split('@')[1]?.toLowerCase();
                if (!domain?.includes(filters.emailDomain.toLowerCase())) return false;
            }
            if (filters.searchText) {
                const search = filters.searchText.toLowerCase();
                return (
                    lead.businessName?.toLowerCase().includes(search) ||
                    lead.email?.toLowerCase().includes(search)
                );
            }
            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            let aVal = a[sortConfig.key] || '';
            let bVal = b[sortConfig.key] || '';

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (sortConfig.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return filtered;
    }, [leads, filters, sortConfig]);

    /**
     * Pagination
     */
    const paginatedLeads = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAndSortedLeads.slice(start, start + pageSize);
    }, [filteredAndSortedLeads, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredAndSortedLeads.length / pageSize);

    /**
     * Calculate statistics
     */
    const leadStats = useMemo(() => {
        if (leads.length === 0) return { total: 0, highQuality: 0, avgScore: 0 };
        
        const highQuality = leads.filter(l => (l.score || 0) >= 12).length;
        const avgScore = (leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length).toFixed(1);
        
        return {
            total: leads.length,
            highQuality,
            avgScore
        };
    }, [leads]);

    /**
     * Get unique values for filter options
     */
    const getUniqueValues = useCallback((field) => {
        const values = new Set(leads.map(l => l[field]).filter(Boolean));
        return Array.from(values).sort();
    }, [leads]);

    /**
     * Sort column handler
     */
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    /**
     * Export CSV
     */
    const handleExportCSV = () => {
        const data = selectedLeads.size > 0 
            ? Array.from(selectedLeads).map(id => leads.find(l => l.id === id))
            : filteredAndSortedLeads;
        
        const headers = ['Business Name', 'Website', 'Email', 'Lead Score', 'Country', 'Niche', 'Created At'];
        const rows = data.map(lead => [
            lead.businessName || '',
            lead.website || '',
            lead.email || '',
            lead.score || 0,
            lead.country || '',
            lead.niche || '',
            new Date(lead.createdAt?.seconds * 1000).toLocaleDateString()
        ]);

        const csv = [headers, ...rows].map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const element = document.createElement('a');
        element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
        const timestamp = new Date().toISOString().slice(0, 10);
        element.setAttribute('download', `leads_${formData.country}_${formData.niche}_${timestamp}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        showToast('✅ CSV downloaded successfully', 'success');
    };

    /**
     * Export Excel (JSON as fallback)
     */
    const handleExportJSON = () => {
        const data = selectedLeads.size > 0 
            ? Array.from(selectedLeads).map(id => leads.find(l => l.id === id))
            : filteredAndSortedLeads;

        const json = JSON.stringify(data, null, 2);
        const element = document.createElement('a');
        element.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(json)}`);
        const timestamp = new Date().toISOString().slice(0, 10);
        element.setAttribute('download', `leads_${formData.country}_${formData.niche}_${timestamp}.json`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        showToast('✅ JSON exported successfully', 'success');
    };

    /**
     * Send to Google Sheets webhook
     */
    const handleSendToWebhook = async () => {
        if (!webhookUrl.trim()) {
            showToast('Please enter a webhook URL', 'error');
            return;
        }

        const data = selectedLeads.size > 0 
            ? Array.from(selectedLeads).map(id => leads.find(l => l.id === id))
            : filteredAndSortedLeads;

        try {
            setSendingToWebhook(true);
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leads: data, timestamp: new Date().toISOString() })
            });

            if (response.ok) {
                showToast(`✅ Sent ${data.length} leads to webhook`, 'success');
                setShowWebhookInput(false);
                setWebhookUrl('');
            } else {
                showToast('Failed to send to webhook', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Webhook error', 'error');
        } finally {
            setSendingToWebhook(false);
        }
    };

    /**
     * Toggle lead selection
     */
    const toggleLeadSelection = (leadId) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(leadId)) {
            newSelected.delete(leadId);
        } else {
            newSelected.add(leadId);
        }
        setSelectedLeads(newSelected);
    };

    /**
     * Select all leads
     */
    const selectAllLeads = () => {
        if (selectedLeads.size === paginatedLeads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(paginatedLeads.map(l => l.id)));
        }
    };

    /**
     * Copy email to clipboard
     */
    const copyEmailToClipboard = (email) => {
        navigator.clipboard.writeText(email);
        showToast('📋 Email copied to clipboard', 'success');
    };

    /**
     * Get lead score color
     */
    const getScoreColor = (score) => {
        if (score >= 15) return 'emerald';
        if (score >= 12) return 'blue';
        if (score >= 8) return 'amber';
        return 'slate';
    };

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <Gauge className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Lead Finder • Premium Version
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Advanced lead discovery, filtering, and analytics
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('search')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'search'
                            ? 'text-primary-600 border-primary-600'
                            : 'text-slate-600 border-transparent hover:text-slate-900'
                    }`}
                >
                    <Plus className="w-4 h-4 inline mr-2" />
                    New Search
                </button>
                <button
                    onClick={() => setActiveTab('jobs')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'jobs'
                            ? 'text-primary-600 border-primary-600'
                            : 'text-slate-600 border-transparent hover:text-slate-900'
                    }`}
                >
                    <Clock className="w-4 h-4 inline mr-2" />
                    Jobs ({jobs.length})
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'results'
                            ? 'text-primary-600 border-primary-600'
                            : 'text-slate-600 border-transparent hover:text-slate-900'
                    }`}
                >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Results ({filteredAndSortedLeads.length})
                </button>
            </div>

            {/* Search Tab */}
            {activeTab === 'search' && (
                <Card className="max-w-2xl">
                    <form onSubmit={handleStartSearch}>
                        {/* Country */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                                Target Country <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                placeholder="e.g., UAE, USA, UK"
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Niche */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                                Target Niche <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.niche}
                                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                                placeholder="e.g., Real Estate, Software Companies, Restaurants"
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Leads Limit */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                                Maximum Websites to Scan
                            </label>
                            <input
                                type="number"
                                value={formData.limit}
                                onChange={(e) => setFormData({ ...formData, limit: parseInt(e.target.value) || 500 })}
                                min="10"
                                max="500"
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <p className="text-xs text-slate-500 mt-2">Maximum 500 websites per run</p>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            🚀 Start Lead Collection
                        </Button>
                    </form>
                </Card>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
                <div>
                    {/* Current Job Status */}
                    {currentJobId && jobStatus && (
                        <Card className="mb-6 border-l-4 border-l-blue-500">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Current Job
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {jobStatus.country} • {jobStatus.niche}
                                    </p>
                                </div>
                                <Badge
                                    color={
                                        jobStatus.status === 'completed'
                                            ? 'success'
                                            : jobStatus.status === 'failed'
                                            ? 'error'
                                            : 'warning'
                                    }
                                >
                                    {jobStatus.status === 'in_progress' ? '⏳ Running' : jobStatus.status}
                                </Badge>
                            </div>

                            {/* Progress Bar */}
                            {jobStatus.status === 'in_progress' && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">Progress</span>
                                        <span className="text-sm font-bold text-primary-600">
                                            {jobStatus.progress?.websitesScanned || 0} / {jobStatus.limit} websites
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 rounded-full"
                                            style={{
                                                width: `${
                                                    ((jobStatus.progress?.websitesScanned || 0) / jobStatus.limit) * 100
                                                }%`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Websites Scanned</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                        {jobStatus.progress?.websitesScanned || 0}
                                    </p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-700/20 dark:to-emerald-700/10 rounded-lg border border-emerald-200 dark:border-emerald-600">
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase">Emails Found</p>
                                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                                        {jobStatus.progress?.emailsFound || 0}
                                    </p>
                                </div>
                            </div>

                            {jobStatus.status === 'in_progress' && (
                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">🤖 Automatic Processing</h4>
                                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                The system is actively discovering websites for "{jobStatus.niche}" in {jobStatus.country} and extracting contact information. Updates every 3 seconds.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* All Jobs List */}
                    {jobs.length > 0 && (
                        <Card>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Recent Jobs
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Job ID</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Country • Niche</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Scanned</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Emails</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Status</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Started</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((job) => (
                                            <tr key={job.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">{job.id?.slice(0, 8)}...</td>
                                                <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{job.country} • {job.niche}</td>
                                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{job.progress?.websitesScanned || 0}</td>
                                                <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{job.progress?.emailsFound || 0}</td>
                                                <td className="py-3 px-4">
                                                    <Badge color={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'warning'}>
                                                        {job.status === 'in_progress' ? '⏳ Running' : job.status === 'completed' ? '✅ Done' : '❌ Failed'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                                                    {new Date(job.createdAt?.toDate?.() || job.createdAt?.seconds * 1000).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {jobs.length === 0 && !currentJobId && (
                        <EmptyState
                            icon={Clock}
                            title="No Jobs Yet"
                            description="Start a new search from the 'New Search' tab to see job history here"
                        />
                    )}
                </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
                <div>
                    {leads.length > 0 ? (
                        <>
                            {/* Statistics Dashboard */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <Card className="border-l-4 border-l-blue-500">
                                    <div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-medium">Total Leads</p>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{leadStats.total}</p>
                                        <p className="text-xs text-slate-500 mt-2">All collected leads</p>
                                    </div>
                                </Card>

                                <Card className="border-l-4 border-l-emerald-500">
                                    <div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-medium">High Quality</p>
                                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{leadStats.highQuality}</p>
                                        <p className="text-xs text-slate-500 mt-2">Score ≥ 12</p>
                                    </div>
                                </Card>

                                <Card className="border-l-4 border-l-amber-500">
                                    <div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-medium">Avg Score</p>
                                        <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{leadStats.avgScore}</p>
                                        <p className="text-xs text-slate-500 mt-2">Quality average</p>
                                    </div>
                                </Card>

                                <Card className="border-l-4 border-l-purple-500">
                                    <div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-medium">Filtered</p>
                                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{filteredAndSortedLeads.length}</p>
                                        <p className="text-xs text-slate-500 mt-2">Matching filters</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <Button
                                    onClick={handleExportCSV}
                                    variant="secondary"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    CSV
                                </Button>
                                <Button
                                    onClick={handleExportJSON}
                                    variant="secondary"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    JSON
                                </Button>
                                <Button
                                    onClick={() => setShowWebhookInput(!showWebhookInput)}
                                    variant="secondary"
                                    className="flex items-center gap-2"
                                >
                                    {showWebhookInput ? '✕' : '+'} Google Sheets
                                </Button>
                                <Button
                                    onClick={handleDeleteLeads}
                                    disabled={selectedLeads.size === 0}
                                    variant="danger"
                                    className="flex items-center gap-2 ml-auto"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete ({selectedLeads.size})
                                </Button>
                            </div>

                            {/* Webhook Input */}
                            {showWebhookInput && (
                                <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={webhookUrl}
                                            onChange={(e) => setWebhookUrl(e.target.value)}
                                            placeholder="Paste your Google Sheets webhook URL..."
                                            className="flex-1 px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <Button
                                            onClick={handleSendToWebhook}
                                            disabled={sendingToWebhook}
                                            className="flex items-center gap-2"
                                        >
                                            {sendingToWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : '📤'}
                                            Send
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            {/* Advanced Filters */}
                            <Card className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Advanced Filters</h3>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Min Score</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            value={filters.minScore}
                                            onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) || 0 })}
                                            className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Country</label>
                                        <select
                                            value={filters.country}
                                            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                                            className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">All</option>
                                            {getUniqueValues('country').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Niche</label>
                                        <select
                                            value={filters.niche}
                                            onChange={(e) => setFilters({ ...filters, niche: e.target.value })}
                                            className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">All</option>
                                            {getUniqueValues('niche').map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Domain</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., @gmail"
                                            value={filters.emailDomain}
                                            onChange={(e) => setFilters({ ...filters, emailDomain: e.target.value })}
                                            className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Search</label>
                                        <input
                                            type="text"
                                            placeholder="Name or email"
                                            value={filters.searchText}
                                            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                                            className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* Results Table */}
                            <Card className="overflow-x-auto">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        Leads • {filteredAndSortedLeads.length} results
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(parseInt(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                        >
                                            <option value={20}>20 rows</option>
                                            <option value={50}>50 rows</option>
                                            <option value={100}>100 rows</option>
                                        </select>
                                    </div>
                                </div>

                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLeads.size === paginatedLeads.length && paginatedLeads.length > 0}
                                                    onChange={selectAllLeads}
                                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 cursor-pointer"
                                                />
                                            </th>
                                            {['businessName', 'website', 'email', 'score', 'country', 'niche', 'createdAt'].map(col => (
                                                <th
                                                    key={col}
                                                    onClick={() => handleSort(col)}
                                                    className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {col === 'businessName' && 'Business'}
                                                        {col === 'website' && 'Website'}
                                                        {col === 'email' && 'Email'}
                                                        {col === 'score' && 'Score'}
                                                        {col === 'country' && 'Country'}
                                                        {col === 'niche' && 'Niche'}
                                                        {col === 'createdAt' && 'Created'}
                                                        {sortConfig.key === col && (
                                                            sortConfig.direction === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedLeads.map((lead) => (
                                            <tr
                                                key={lead.id}
                                                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                                onClick={() => { setSelectedLead(lead); setShowDetailDrawer(true); }}
                                            >
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLeads.has(lead.id)}
                                                        onChange={() => toggleLeadSelection(lead.id)}
                                                        className="w-4 h-4 rounded border-slate-300 text-primary-600 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{lead.businessName}</td>
                                                <td className="px-4 py-3">
                                                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                        {lead.website?.replace(/^https?:\/\/(www\.)?/, '').slice(0, 30)}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{lead.email}</code>
                                                        <button onClick={(e) => { e.stopPropagation(); copyEmailToClipboard(lead.email); }} className="text-slate-500 hover:text-primary-600">
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge color={getScoreColor(lead.score || 0)}>
                                                        {lead.score || 0}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{lead.country}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{lead.niche}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500">
                                                    {lead.createdAt ? new Date(lead.createdAt?.toDate?.() || lead.createdAt?.seconds * 1000).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setShowDetailDrawer(true); }} className="text-slate-500 hover:text-primary-600 transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-6 flex items-center justify-between">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Page {currentPage} of {totalPages} • Showing {paginatedLeads.length} of {filteredAndSortedLeads.length} leads
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                variant="secondary"
                                                className="px-3 py-2"
                                            >
                                                ← Prev
                                            </Button>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const page = i + Math.max(1, currentPage - 2);
                                                if (page <= totalPages) {
                                                    return (
                                                        <Button
                                                            key={page}
                                                            onClick={() => setCurrentPage(page)}
                                                            variant={currentPage === page ? 'primary' : 'secondary'}
                                                            className="px-3 py-2"
                                                        >
                                                            {page}
                                                        </Button>
                                                    );
                                                }
                                                return null;
                                            })}
                                            <Button
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                variant="secondary"
                                                className="px-3 py-2"
                                            >
                                                Next →
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </>
                    ) : (
                        <EmptyState
                            icon={Search}
                            title="📊 No Leads Found Yet"
                            description="Start a new search from the 'New Search' tab to discover and extract business leads"
                        />
                    )}
                </div>
            )}

            {/* Lead Detail Drawer */}
            {showDetailDrawer && selectedLead && (
                <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex justify-end">
                    <div className="w-full sm:w-96 bg-white dark:bg-slate-900 h-full overflow-y-auto animate-fade-in-left shadow-2xl">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lead Details</h2>
                                <button
                                    onClick={() => setShowDetailDrawer(false)}
                                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Details */}
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Business Name</label>
                                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedLead.businessName}</p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Email</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <code className="flex-1 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-slate-900 dark:text-white break-all">
                                            {selectedLead.email}
                                        </code>
                                        <button onClick={() => copyEmailToClipboard(selectedLead.email)} className="text-slate-500 hover:text-primary-600 p-2">
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Website</label>
                                    <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="mt-1 text-primary-600 hover:text-primary-700 flex items-center gap-1 break-all">
                                        {selectedLead.website}
                                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                    </a>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Score</label>
                                        <Badge color={getScoreColor(selectedLead.score || 0)} className="mt-1">
                                            {selectedLead.score || 0}
                                        </Badge>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Country</label>
                                        <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{selectedLead.country}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Niche</label>
                                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{selectedLead.niche}</p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Extracted</label>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                        {selectedLead.createdAt ? new Date(selectedLead.createdAt?.toDate?.() || selectedLead.createdAt?.seconds * 1000).toLocaleString() : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 space-y-3">
                                <Button
                                    onClick={() => { window.open(selectedLead.website, '_blank'); setShowDetailDrawer(false); }}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open Website
                                </Button>
                                <Button
                                    onClick={() => { copyEmailToClipboard(selectedLead.email); }}
                                    variant="secondary"
                                    className="w-full flex items-center justify-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy Email
                                </Button>
                                <Button
                                    onClick={() => alert('CRM integration coming soon!')}
                                    variant="secondary"
                                    className="w-full flex items-center justify-center gap-2"
                                >
                                    📤 Send to CRM
                                </Button>
                                <Button
                                    onClick={() => { toggleLeadSelection(selectedLead.id); setShowDetailDrawer(false); }}
                                    className="w-full flex items-center justify-center gap-2"
                                    style={{ backgroundColor: selectedLeads.has(selectedLead.id) ? '#dc2626' : '#10b981' }}
                                >
                                    {selectedLeads.has(selectedLead.id) ? '✗' : '✓'} {selectedLeads.has(selectedLead.id) ? 'Deselect' : 'Select'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadFinder;
