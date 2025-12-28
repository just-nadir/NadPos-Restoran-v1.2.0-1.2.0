import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, LogOut, Loader2, Edit, Trash2, Key, Calendar, MapPin, Phone, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api';

interface Restaurant {
    id: string;
    name: string;
    address: string;
    phone: string;
    accessKey: string;
    subscriptionEndDate: string;
    isActive: boolean;
    createdAt: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        subscriptionEndDate: '',
        isActive: true
    });

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const response = await api.get('/admin/restaurants');
            setRestaurants(response.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    const handleOpenModal = (restaurant?: Restaurant) => {
        if (restaurant) {
            setEditingId(restaurant.id);
            setFormData({
                name: restaurant.name,
                address: restaurant.address || '',
                phone: restaurant.phone || '',
                subscriptionEndDate: restaurant.subscriptionEndDate ? new Date(restaurant.subscriptionEndDate).toISOString().split('T')[0] : '',
                isActive: restaurant.isActive
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                address: '',
                phone: '',
                subscriptionEndDate: '',
                isActive: true
            });
        }
        setModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Rostdan ham "${name}" restoranini o'chirmoqchimisiz?`)) {
            try {
                await api.delete(`/admin/restaurants/${id}`);
                fetchRestaurants();
            } catch (err) {
                alert('Xatolik yuz berdi!');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Nullify empty date
            const payload = {
                ...formData,
                subscriptionEndDate: formData.subscriptionEndDate || null
            };

            if (editingId) {
                await api.put(`/admin/restaurants/${editingId}`, payload);
            } else {
                await api.post('/admin/restaurants', payload);
            }
            setModalOpen(false);
            fetchRestaurants();
        } catch (err) {
            console.error(err);
            alert('Saqlashda xatolik!');
        }
    };

    const isExpired = (dateString?: string) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                        <Key size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">NadPos Admin</h1>
                </div>
                <button onClick={handleLogout} className="flex items-center text-gray-500 hover:text-red-600 transition-colors text-sm font-medium">
                    <LogOut className="w-4 h-4 mr-2" /> Chiqish
                </button>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Restoranlar</h2>
                        <p className="text-gray-500 text-sm mt-1">Jami: {restaurants.length} ta</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" /> Yangi qo'shish
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restoran / Telefon</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manzil</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obuna Muddati</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Access Key</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {restaurants.map((res) => {
                                        const expired = isExpired(res.subscriptionEndDate);
                                        return (
                                            <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-900">{res.name}</span>
                                                        <span className="text-xs text-gray-500 flex items-center mt-0.5">
                                                            <Phone size={12} className="mr-1" /> {res.phone || '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500 flex items-center">
                                                        <MapPin size={14} className="mr-1 text-gray-400" />
                                                        {res.address || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${res.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {res.isActive ? 'Aktiv' : 'Nofaol'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm flex items-center ${expired ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                                                        <Calendar size={14} className="mr-1.5 text-gray-400" />
                                                        {res.subscriptionEndDate ? new Date(res.subscriptionEndDate).toLocaleDateString() : 'Cheksiz'}
                                                        {expired && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">Muddati tugagan</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono bg-gray-50 rounded px-2 select-all">
                                                    <div className="flex flex-col gap-1">
                                                        <span title="Restaurant ID">ID: {res.id}</span>
                                                        <span title="Access Key">Key: {res.accessKey}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-3">
                                                        <button onClick={() => handleOpenModal(res)} className="text-blue-600 hover:text-blue-900 transition-colors" title="Tahrirlash">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => handleDelete(res.id, res.name)} className="text-red-600 hover:text-red-900 transition-colors" title="O'chirish">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {restaurants.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                                                Restoranlar mavjud emas. Yuqoridagi tugma orqali qo'shing.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingId ? 'Restoranni Tahrirlash' : 'Yangi Restoran'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Restoran Nomi</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Masalan: Rayhon Milliy Taomlar"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="+998..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Obuna Tugash Sanasi</label>
                                    <input
                                        type="date"
                                        value={formData.subscriptionEndDate}
                                        onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Manzil</label>
                                <textarea
                                    rows={2}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="Toshkent sh..."
                                />
                            </div>

                            <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <input
                                    id="isActive"
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 font-medium cursor-pointer select-none">
                                    Restoran Aktiv holatda
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors flex justify-center items-center"
                                >
                                    <CheckCircle size={18} className="mr-2" />
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
