import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy } from 'lucide-react';
import api from '../lib/api';

const CreateRestaurant: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdRestaurant, setCreatedRestaurant] = useState<{ id: string, accessKey: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/admin/restaurants', { name });
            setCreatedRestaurant(response.data);
            setName('');
        } catch (error: any) {
            console.error('Xatolik:', error);
            alert('Xatolik yuz berdi: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Nusxalandi!');
    };

    if (createdRestaurant) {
        return (
            <div className="min-h-screen bg-gray-50 py-10 px-4">
                <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-8 text-center">
                    <h2 className="text-3xl font-bold text-green-600 mb-4">Restoran Yaratildi!</h2>
                    <p className="text-gray-600 mb-8">Quyidagi ma'lumotlarni saqlab oling. Ular faqat bir marta ko'rsatiladi.</p>

                    <div className="bg-gray-100 p-4 rounded-md mb-4 text-left">
                        <label className="text-xs text-gray-500 uppercase">Restaurant ID</label>
                        <div className="flex justify-between items-center mt-1">
                            <code className="text-lg font-mono text-gray-800">{createdRestaurant.id}</code>
                            <button onClick={() => copyToClipboard(createdRestaurant.id)} className="text-blue-600 hover:text-blue-800">
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-md mb-8 text-left">
                        <label className="text-xs text-gray-500 uppercase">Access Key</label>
                        <div className="flex justify-between items-center mt-1">
                            <code className="text-lg font-mono text-gray-800">{createdRestaurant.accessKey}</code>
                            <button onClick={() => copyToClipboard(createdRestaurant.accessKey)} className="text-blue-600 hover:text-blue-800">
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-medium"
                    >
                        Dashboardga qaytish
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Back
                </button>
                <div className="bg-white shadow rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-6">Yangi Restoran Qo'shish</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Restoran Nomi</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Masalan: Rayhon Milliy Taomlari"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                        >
                            {loading ? 'Yaratilmoqda...' : 'Yaratish'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateRestaurant;
