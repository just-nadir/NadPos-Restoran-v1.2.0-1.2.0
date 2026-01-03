import React, { memo, useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

const MobileMenu = memo(({ categories, products, activeCategory, setActiveCategory, onProductClick, searchQuery, setSearchQuery, cart, loading }) => {
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (debouncedSearchQuery) return p.active && p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
            return p.category_id === activeCategory;
        });
    }, [products, debouncedSearchQuery, activeCategory]);
    return (
        <>
            <div className="bg-white pb-2 z-10">
                <div className="flex overflow-x-auto px-4 py-2 gap-3 scrollbar-hide">
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                            className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${activeCategory === cat.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-600'}`}>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* MENU SEARCH BAR */}
                <div className="px-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Taom qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-2xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-all placeholder:text-gray-400"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-gray-200 rounded-full text-gray-500">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto p-4 pb-40">
                {loading ? <div className="text-center py-10 text-gray-400">Yuklanmoqda...</div> : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredProducts.map(product => {
                            const inCart = cart.find(c => c.id === product.id);
                            return (
                                <div key={product.id} onClick={() => onProductClick(product)}
                                    className={`p-4 rounded-3xl flex justify-between items-center transition-all active:scale-95 border-2 
                                  ${inCart ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-transparent shadow-sm'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${inCart ? 'bg-blue-200' : 'bg-gray-100'}`}>
                                            {product.image ? <img src={product.image} className="w-full h-full object-cover rounded-2xl" /> : '🍳'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                                            <p className="text-gray-500 font-medium">{product.price.toLocaleString()} so'm</p>
                                        </div>
                                    </div>
                                    {inCart ? (
                                        <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-lg shadow-blue-200">
                                            {inCart.qty}
                                        </div>
                                    ) : (
                                        <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                            <Plus size={24} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
});

export default MobileMenu;
