import React from 'react';
import { Receipt } from 'lucide-react';

const MobileOrders = ({ orders }) => {
    const total = orders.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    return (
        <div className="flex-1 overflow-y-auto p-5 pb-40">
            <h2 className="font-black text-2xl mb-6 text-gray-900">Stol Buyurtmalari</h2>
            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-20 text-gray-300">
                    <Receipt size={64} className="mb-4 opacity-20" />
                    <p className="font-bold">Hali buyurtma berilmagan</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-3xl shadow-sm flex justify-between items-center border border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{item.product_name}</h3>
                                <p className="text-gray-400 text-sm">{item.price.toLocaleString()} x {item.quantity}</p>
                            </div>
                            <div className="font-black text-xl text-gray-800">
                                {(item.price * item.quantity).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="font-bold text-gray-500">Jami:</span>
                        <span className="font-black text-2xl text-blue-600">
                            {total.toLocaleString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileOrders;
