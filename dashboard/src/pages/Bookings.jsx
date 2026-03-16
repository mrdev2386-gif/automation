import { useState, useEffect } from 'react';
import { CalendarDays, Search, Filter, Check, X } from 'lucide-react';
import { getBookings, updateBookingStatus, getClients } from '../services/firebase';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, [selectedClient]);

    const loadData = async () => {
        try {
            const [clientsData, bookingsData] = await Promise.all([
                getClients(),
                selectedClient ? getBookings(selectedClient) : Promise.resolve([])
            ]);
            setClients(clientsData);
            setBookings(bookingsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (bookingId, status) => {
        try {
            await updateBookingStatus(bookingId, status);
            loadData();
        } catch (error) {
            console.error('Error updating booking:', error);
        }
    };

    const filteredBookings = bookings.filter(b =>
        b.customerPhone?.includes(searchTerm) ||
        b.date?.includes(searchTerm)
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Bookings</h1>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                        >
                            <option value="">Select Client</option>
                            {clients.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by phone or date..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                        />
                    </div>
                </div>
            </div>

            {/* Bookings List */}
            {!selectedClient ? (
                <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">Select a client to view bookings</p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">No bookings found</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-800">
                                        {booking.customerPhone}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800">
                                        {booking.date}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800">
                                        {booking.time}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800">
                                        {booking.guests}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {booking.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                                        title="Confirm"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Bookings;
