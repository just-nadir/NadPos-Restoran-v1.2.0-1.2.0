import React from 'react';
import { X, ChevronLeft, ShoppingBag } from 'lucide-react';

const MobileWeightModal = ({ isOpen, onClose, onConfirm, product, weight, handleWeightInput }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-black text-gray-800 text-center mb-2">{product?.name}</h2>
                <p className="text-center text-gray-500 font-medium mb-6">
                    Miqdorni kiriting ({product?.unit_type === 'kg' ? 'kg' : 'dona'})
                </p>

                <div className="bg-gray-100 rounded-2xl p-4 mb-6 text-center">
                    <span className="text-5xl font-black text-gray-800">{weight || '0'}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(n => (
                        <button
                            key={n}
                            onClick={() => handleWeightInput(n.toString())}
                            className="h-16 bg-white rounded-xl shadow-sm text-2xl font-bold text-gray-700 active:scale-95 border border-gray-200"
                        >
                            {n}
                        </button>
                    ))}
                    <button
                        onClick={() => handleWeightInput('back')}
                        className="h-16 bg-red-50 rounded-xl shadow-sm text-red-500 active:scale-95 border border-red-100 flex items-center justify-center"
                    >
                        <ChevronLeft size={24} />
                    </button>
                </div>

                <button
                    onClick={onConfirm}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-2"
                >
                    Qo'shish <ShoppingBag size={20} />
                </button>
            </div>
        </div>
    );
};

export default MobileWeightModal;
