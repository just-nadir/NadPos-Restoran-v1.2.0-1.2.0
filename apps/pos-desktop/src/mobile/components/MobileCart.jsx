import React from 'react';
import { ShoppingBag, Minus, Plus } from 'lucide-react';

const MobileCart = ({ cart, addToCart, removeFromCart }) => {
    return (
        <div className="flex-1 overflow-y-auto p-5 pb-40">
            <h2 className="font-black text-2xl mb-6 text-gray-900">Savatcha</h2>
            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-20 text-gray-300">
                    <ShoppingBag size={64} className="mb-4 opacity-20" />
                    <p className="font-bold">Hali hech narsa tanlanmadi</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm flex justify-between items-center border border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                                <p className="text-blue-600 font-bold">{item.price.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl">
                                <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-red-500 active:scale-90"><Minus size={20} /></button>
                                <span className="font-black text-xl w-6 text-center">{item.qty}</span>
                                <button onClick={() => addToCart(item)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-green-500 active:scale-90"><Plus size={20} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MobileCart;
