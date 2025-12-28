import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import api from '../lib/api';

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [id, setId] = useState('');
    const [loading, setLoading] = useState(false);

    const generateKeys = () => {
        setId(uuidv4());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/restaurants', { id, name });
            alert('Restoran muvaffaqiyatli qo\'shildi!');
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Xatolik:', error);
            alert('Xatolik yuz berdi: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Back
                </button>
                <div className="bg-white shadow rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-6">Onboard New Restaurant</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        <div className="flex space-x-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Tenant ID</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={id}
                                    className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-gray-500"
                                />
                            </div>

                            {(!id) && (
                                <button
                                    type="button"
                                    onClick={generateKeys}
                                    className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
                                >
                                    Generate ID & Key
                                </button>
                            )}

                            {(id) && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                                >
                                    {loading ? 'Saqlanmoqda...' : 'Complete Onboarding'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
