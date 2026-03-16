import { useState, useEffect, useRef } from 'react';
import {
    UserCheck,
    Search,
    Filter,
    Mail,
    Phone,
    Calendar,
    AlertCircle,
    Upload,
    FileText,
    X,
    Check,
    Loader2,
    Download,
    Plus,
    Inbox
} from 'lucide-react';
import { getMyLeads, uploadLeadsBulk, updateLeadStatus, getLeadEvents } from '../services/leadService';
import { Card, Badge, EmptyState, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI';

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSource, setFilterSource] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [singleLead, setSingleLead] = useState({ name: '', email: '', phone: '', source: 'manual' });
    const [selectedLead, setSelectedLead] = useState(null);
    const [leadEvents, setLeadEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadLeads();
    }, [pagination.page, filterStatus, filterSource]);

    const loadLeads = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await getMyLeads({
                status: filterStatus !== 'all' ? filterStatus : undefined,
                source: filterSource !== 'all' ? filterSource : undefined,
                search: searchTerm,
                page: pagination.page,
                limit: 50
            });

            setLeads(result.leads || []);
            setPagination(result.pagination || { page: 1, total: 0, totalPages: 0 });
        } catch (err) {
            console.error('Error loading leads:', err);
            setError('Failed to load leads. Please try again.');
            setLeads([]);
            setPagination({ page: 1, total: 0, totalPages: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        loadLeads();
    };

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            await updateLeadStatus(leadId, newStatus);
            setLeads(leads.map(lead =>
                lead.id === leadId ? { ...lead, status: newStatus } : lead
            ));
        } catch (err) {
            console.error('Error updating lead status:', err);
        }
    };

    const handleViewEvents = async (lead) => {
        setSelectedLead(lead);
        setLoadingEvents(true);
        try {
            const result = await getLeadEvents(lead.id);
            setLeadEvents(result.events || []);
        } catch (err) {
            console.error('Error loading lead events:', err);
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleSingleLeadSubmit = async (e) => {
        e.preventDefault();
        if (!singleLead.name || (!singleLead.email && !singleLead.phone)) {
            setError('Name and at least one contact (email or phone) are required');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const result = await uploadLeadsBulk([singleLead]);
            setUploadProgress(result);
            if (result.success > 0) {
                setSingleLead({ name: '', email: '', phone: '', source: 'manual' });
                loadLeads();
            }
        } catch (err) {
            console.error('Error uploading lead:', err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCSVUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setUploadProgress(null);

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            const startIndex = lines[0]?.toLowerCase().includes('name') ? 1 : 0;

            const leads = [];
            for (let i = startIndex; i < lines.length; i++) {
                const [name, email, phone, source] = lines[i].split(',').map(s => s?.trim());
                if (name) {
                    leads.push({ name, email, phone, source: source || 'manual' });
                }
            }

            if (leads.length === 0) {
                throw new Error('No valid leads found in CSV');
            }

            const result = await uploadLeadsBulk(leads);
            setUploadProgress(result);

            if (result.success > 0) {
                loadLeads();
            }
        } catch (err) {
            console.error('Error uploading CSV:', err);
            setError(err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const downloadSampleCSV = () => {
        const csv = 'name,email,phone,source\nJohn Doe,john@example.com,9876543210,website\nJane Smith,jane@example.com,9876543211,ads';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_leads.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusBadge = (status) => {
        const variants = {
            new: 'success',
            contacted: 'info',
            qualified: 'warning'
        };
        return variants[status] || 'neutral';
    };

    const getSourceBadge = (source) => {
        const variants = {
            website: 'info',
            manual: 'warning',
            whatsapp: 'success',
            ads: 'warning'
        };
        return variants[source] || 'neutral';
    };

    if (loading) {
        return (
            <div className="animate-fade-in-up">
                <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-8"></div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i} className="animate-pulse h-16"></Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error && !leads.length) {
        return (
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Leads</h1>
                <Card padding="p-12">
                    <EmptyState
                        icon={AlertCircle}
                        title="Error loading leads"
                        description={error}
                        action={<Button onClick={loadLeads}>Retry</Button>}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Leads</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track your leads</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="info">{pagination.total} Total</Badge>
                    <Button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload
                    </Button>
                </div>
            </div>

            {/* Upload Panel */}
            {showUpload && (
                <Card padding="p-6" className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upload Leads</h2>
                        <button onClick={() => setShowUpload(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Single Lead Form */}
                    <form onSubmit={handleSingleLeadSubmit} className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Add Single Lead</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <input
                                type="text"
                                placeholder="Name *"
                                value={singleLead.name}
                                onChange={(e) => setSingleLead({ ...singleLead, name: e.target.value })}
                                className="input"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={singleLead.email}
                                onChange={(e) => setSingleLead({ ...singleLead, email: e.target.value })}
                                className="input"
                            />
                            <input
                                type="tel"
                                placeholder="Phone"
                                value={singleLead.phone}
                                onChange={(e) => setSingleLead({ ...singleLead, phone: e.target.value })}
                                className="input"
                            />
                            <Button type="submit" disabled={uploading} className="flex items-center justify-center gap-2">
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Add Lead
                            </Button>
                        </div>
                    </form>

                    {/* CSV Upload */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Bulk Upload (CSV)</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".csv"
                                onChange={handleCSVUpload}
                                disabled={uploading}
                                className="input flex-1"
                            />
                            <Button variant="secondary" onClick={downloadSampleCSV} className="flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Sample
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Format: name, email, phone, source</p>
                    </div>

                    {/* Upload Results */}
                    {uploadProgress && (
                        <div className="mt-4 p-4 bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-200 dark:border-success-800">
                            <div className="flex items-center gap-2 text-success-700 dark:text-success-400 font-medium">
                                <Check className="w-5 h-5" />
                                Upload Complete
                            </div>
                            <div className="mt-2 text-sm text-success-600 dark:text-success-300">
                                Success: {uploadProgress.success} | Failed: {uploadProgress.failed} | Duplicates: {uploadProgress.duplicates}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-error-50 dark:bg-error-900/20 rounded-xl border border-error-200 dark:border-error-800">
                            <div className="flex items-center gap-2 text-error-700 dark:text-error-400">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Filters */}
            <Card padding="p-4" className="mb-6">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input w-full pl-11"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                        className="select"
                    >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                    </select>
                    <select
                        value={filterSource}
                        onChange={(e) => { setFilterSource(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                        className="select"
                    >
                        <option value="all">All Sources</option>
                        <option value="website">Website</option>
                        <option value="manual">Manual</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="ads">Ads</option>
                    </select>
                    <Button type="submit">Search</Button>
                </form>
            </Card>

            {/* Leads Table */}
            {leads.length === 0 ? (
                <Card padding="p-12">
                    <EmptyState
                        icon={Inbox}
                        title="No leads yet"
                        description={searchTerm || filterStatus !== 'all' || filterSource !== 'all'
                            ? 'No leads match your filters. Try adjusting your search.'
                            : 'Upload leads manually or capture them through your webhook'}
                        action={<Button onClick={() => setShowUpload(true)} className="flex items-center gap-2"><Plus className="w-4 h-4" />Add Lead</Button>}
                    />
                </Card>
            ) : (
                <Card padding="p-0" className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table stickyHeader>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                                    <TableHead className="hidden md:table-cell">Source</TableHead>
                                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>
                                            <div className="font-semibold text-slate-900 dark:text-white">{lead.name}</div>
                                            <div className="sm:hidden text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {lead.email || lead.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="space-y-1">
                                                {lead.email && (
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                                                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="truncate">{lead.email}</span>
                                                    </div>
                                                )}
                                                {lead.phone && (
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                                                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span>{lead.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant={getSourceBadge(lead.source)}>
                                                {lead.source}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {lead.createdAt ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <select
                                                value={lead.status}
                                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                className="select text-sm py-1"
                                            >
                                                <option value="new">New</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="qualified">Qualified</option>
                                            </select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button
                                                onClick={() => handleViewEvents(lead)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                title="View Events"
                                            >
                                                <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <Button
                                variant="secondary"
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="secondary"
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </Card>
            )}

            {/* Lead Events Modal */}
            {selectedLead && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <Card className="max-w-lg w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lead Events</h2>
                            <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="mb-4">
                                <h3 className="font-semibold text-slate-900 dark:text-white">{selectedLead.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedLead.email || selectedLead.phone}</p>
                            </div>
                            {loadingEvents ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                </div>
                            ) : leadEvents.length === 0 ? (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No events yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {leadEvents.map((event) => (
                                        <div key={event.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{event.type}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {event.timestamp ? new Date(event.timestamp.seconds * 1000).toLocaleString() : ''}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Leads;
