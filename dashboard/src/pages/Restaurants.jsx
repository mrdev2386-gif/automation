import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, MessageCircle, Eye } from 'lucide-react';
import { getClients, deleteClient } from '../services/firebase';

const Restaurants = () => {
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

    const filteredClients = clients.filter(r =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.whatsappNumber?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
                <button
                    onClick={() => navigate('/clients/add')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Client
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                    />
                </div>
            </div>

            {/* Restaurants List */}
            {filteredClients.length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                    <p className="text-gray-500">No clients found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <div key={client.id} className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{client.name}</h3>
                                    <p className="text-sm text-gray-500">{client.address || 'No address'}</p>
                                </div>
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded uppercase">
                                    {client.category || client.industryType || 'Business'}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MessageCircle className="w-4 h-4" />
                                    {client.whatsappNumber || 'No WhatsApp number'}
                                </div>
                                {client.timing && (
                                    <div className="text-sm text-gray-600">
                                        Hours: {client.timing}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => navigate(`/clients/${client.id}`)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2 rounded-lg transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </button>
                                <button
                                    onClick={() => navigate(`/clients/edit/${client.id}`)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(client.id)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors"
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

export default Restaurants;
