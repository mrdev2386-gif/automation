import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, MessageCircle, Eye, Building2 } from 'lucide-react';
import { getClients, deleteClient } from '../services/firebase';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            try {
                await deleteClient(id);
                loadClients();
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        }
    };

    const getIndustryColor = (industryType) => {
        const colors = {
            restaurant: 'bg-orange-100 text-orange-700',
            hotel: 'bg-blue-100 text-blue-700',
            saas: 'bg-purple-100 text-purple-700',
            service: 'bg-green-100 text-green-700',
            spa: 'bg-pink-100 text-pink-700',
            salon: 'bg-rose-100 text-rose-700',
            clinic: 'bg-red-100 text-red-700',
            gym: 'bg-indigo-100 text-indigo-700',
            default: 'bg-gray-100 text-gray-700'
        };
        return colors[industryType] || colors.default;
    };

    const filteredClients = clients.filter(c =>
        c.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.profile?.whatsappNumber?.includes(searchTerm) ||
        c.whatsappNumber?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-500 font-medium">Loading...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Clients</h1>
                <button
                    onClick={() => navigate('/clients/add')}
                    className="btn-primary flex items-center justify-center gap-2 mobile-full"
                >
                    <Plus className="w-5 h-5" />
                    Add Client
                </button>
            </div>

            {/* Search */}
            <div className="card-modern p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-modern w-full pl-11"
                    />
                </div>
            </div>

            {/* Clients List */}
            {filteredClients.length === 0 ? (
                <div className="card-modern p-8 sm:p-12 text-center">
                    <Building2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 mb-4 font-medium">No clients found</p>
                    <button
                        onClick={() => navigate('/clients/add')}
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
                    >
                        <Plus className="w-5 h-5" /> Add Client
                    </button>
                </div>
            ) : (
                <div className="mobile-grid">
                    {filteredClients.map((client) => (
                        <div key={client.id} className="card-modern p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">
                                        {client.profile?.name || client.name || 'Unnamed Client'}
                                    </h3>
                                    <p className="text-sm text-slate-500 truncate">
                                        {client.profile?.address || client.address || 'No address'}
                                    </p>
                                </div>
                                <span className={`badge ${getIndustryColor(client.industryType)} ml-2 flex-shrink-0`}>
                                    {client.industryType || 'General'}
                                </span>
                            </div>

                            <div className="space-y-2.5 mb-4">
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-medium truncate">{client.profile?.whatsappNumber || client.whatsappNumber || 'No WhatsApp number'}</span>
                                </div>
                                {client.profile?.email && (
                                    <div className="text-sm text-slate-600 font-medium truncate">
                                        {client.profile.email}
                                    </div>
                                )}
                                {client.botConfig?.botEnabled !== undefined && (
                                    <div className="text-sm">
                                        <span className={`badge ${client.botConfig.botEnabled ? 'badge-success' : 'bg-slate-100 text-slate-700'}`}>
                                            Bot: {client.botConfig.botEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => navigate(`/clients/${client.id}`)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2.5 rounded-xl transition-all duration-200 font-semibold"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </button>
                                <button
                                    onClick={() => navigate(`/clients/edit/${client.id}`)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 py-2.5 rounded-xl transition-all duration-200 font-semibold"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(client.id)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 py-2.5 rounded-xl transition-all duration-200 font-semibold"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Clients;
