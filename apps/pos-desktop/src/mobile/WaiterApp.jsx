import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, ChevronLeft, ShoppingBag, CheckCircle, LogOut, AlertTriangle,
  Receipt, WifiOff, ChefHat
} from 'lucide-react';

import { useSocketData } from '../hooks/useSocketData';
import { useCart } from '../hooks/useCart';
import { useMenu } from '../hooks/useMenu';
import { useGlobal } from '../context/GlobalContext'; // useGlobal qo'shildi
import MobilePinLogin from './MobilePinLogin';
import ConfirmModal from '../components/ConfirmModal';


import MobileGuestModal from './components/MobileGuestModal';
import MobileWeightModal from './components/MobileWeightModal';
import MobileTableGrid from './components/MobileTableGrid';
import MobileMenu from './components/MobileMenu';
import MobileCart from './components/MobileCart';
import MobileOrders from './components/MobileOrders';

const WaiterApp = () => {
  const { user, login, logout, settings, showToast } = useGlobal(); // Global user state

  const [view, setView] = useState('tables'); // 'tables', 'menu', 'cart', 'orders'
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'mine', 'free'
  const [activeTable, setActiveTable] = useState(null);
  const [tableOrders, setTableOrders] = useState([]); // YANGI: Stol buyurtmalari

  // Guest Modal logic
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestCount, setGuestCount] = useState(2);

  // Search Logic
  const [searchQuery, setSearchQuery] = useState('');

  // Weight Modal Logic
  const [weightModal, setWeightModal] = useState({ show: false, product: null, weight: '' });

  // Offline Logic
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // UI States
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showConfirmOrder, setShowConfirmOrder] = useState(false);
  const [toast, setToast] = useState(null);

  // Hooks
  const { tables, loadTables, API_URL } = useSocketData();
  const { cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const { categories, products, activeCategory, setActiveCategory, loading, loadMenu } = useMenu(API_URL);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // LOGIN SCREEN
  if (!user) {
    return <MobilePinLogin apiUrl={API_URL} onLogin={(u) => login(u)} />;
  }

  // LOGOUT
  const handleLogout = () => {
    logout();
    setView('tables');
    setShowConfirmLogout(false);
  };

  // TABLE SELECTION LOGIC
  const handleTableClick = (table) => {
    if (table.status === 'free') {
      if (settings.serviceChargeType === 'percent') {
        const tableWithDefault = { ...table, guests: 1 };
        setActiveTable(tableWithDefault);
        openMenu(tableWithDefault);
        return;
      }
      setActiveTable(table);
      setGuestCount(2);
      setShowGuestModal(true);
      return;
    }

    if (table.waiter_id && table.waiter_id !== user.id) {
      setToast({ type: 'error', msg: `Bu stolga ${table.waiter_name} xizmat ko'rsatmoqda!` });
      return;
    }

    setActiveTable(table);
    openMenu(table);
  };

  const confirmGuestCount = () => {
    if (!activeTable) return;
    const updatedTable = { ...activeTable, guests: guestCount };
    setActiveTable(updatedTable);
    openMenu(updatedTable);
    setShowGuestModal(false);
  };

  const openMenu = (table) => {
    clearCart();
    setView('menu');
    loadMenu();
    loadTableOrders(table.id);
  };

  const loadTableOrders = async (tableId) => {
    try {
      const res = await axios.get(`${API_URL}/tables/${tableId}/items`);
      setTableOrders(res.data || []);
    } catch (err) {
      console.error("Orders load error:", err);
    }
  };

  const sendOrder = async () => {
    if (!activeTable || cart.length === 0) return;

    try {
      await axios.post(`${API_URL}/tables/guests`, {
        tableId: activeTable.id,
        count: activeTable.guests
      });

      await axios.post(`${API_URL}/orders/bulk-add`, {
        tableId: activeTable.id,
        items: cart.map(item => ({
          productId: item.id || item.productId,
          name: item.name,
          price: Number(item.price),
          qty: Number(item.qty),
          destination: item.destination
        })),
        waiterId: user.id
      });

      setToast({ type: 'success', msg: "Buyurtma oshxonaga ketdi!" });
      clearCart();
      setView('tables');
      setActiveTable(null);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', msg: "Xatolik! Internetni tekshiring." });
    }
    setShowConfirmOrder(false);
  };

  const handleWeightInput = (num) => {
    if (num === 'back') {
      setWeightModal(prev => ({ ...prev, weight: prev.weight.slice(0, -1) }));
    } else if (num === '.') {
      if (!weightModal.weight.includes('.')) {
        setWeightModal(prev => ({ ...prev, weight: prev.weight + '.' }));
      }
    } else {
      setWeightModal(prev => ({ ...prev, weight: prev.weight + num }));
    }
  };

  const confirmWeight = () => {
    if (!weightModal.weight || parseFloat(weightModal.weight) <= 0) return;
    const qty = parseFloat(weightModal.weight);
    addToCart(weightModal.product, qty);
    setWeightModal({ show: false, product: null, weight: '' });
  };

  // UI COMPONENTS
  const OfflineBanner = () => {
    if (isOnline) return null;
    return (
      <div className="bg-red-500 text-white text-xs font-bold text-center py-1 sticky top-0 z-50 flex justify-center items-center gap-2">
        <WifiOff size={14} /> Internet aloqasi yo'q!
      </div>
    );
  };

  if (view === 'tables') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 relative font-sans">
        <OfflineBanner />
        <MobileGuestModal isOpen={showGuestModal} onClose={() => setShowGuestModal(false)} onConfirm={confirmGuestCount} guestCount={guestCount} setGuestCount={setGuestCount} />
        <MobileWeightModal isOpen={weightModal.show} onClose={() => setWeightModal({ show: false, product: null, weight: '' })} onConfirm={confirmWeight} product={weightModal.product} weight={weightModal.weight} handleWeightInput={handleWeightInput} />

        {toast && (
          <div className={`fixed top-6 left-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 animate-in slide-in-from-top duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            <span className="text-lg">{toast.msg}</span>
          </div>
        )}

        <ConfirmModal isOpen={showConfirmLogout} onClose={() => setShowConfirmLogout(false)} onConfirm={handleLogout} title="Chiqish" message="Tizimdan chiqmoqchimisiz?" confirmText="Ha, chiqish" />

        <div className="bg-white px-6 pt-12 pb-4 sticky top-0 z-10 shadow-sm border-b border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">Salom, {user.name} 👋</h1>
            <p className="text-sm text-gray-400 font-medium mt-1">Yaxshi ish kuni tilayman!</p>
          </div>
          <button onClick={() => setShowConfirmLogout(true)} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 active:bg-red-50 active:text-red-500 transition-colors">
            <LogOut size={22} />
          </button>
        </div>

        <MobileTableGrid tables={tables} filterMode={filterMode} setFilterMode={setFilterMode} onTableClick={handleTableClick} user={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden relative font-sans">
      <OfflineBanner />
      <MobileGuestModal isOpen={showGuestModal} onClose={() => setShowGuestModal(false)} onConfirm={confirmGuestCount} guestCount={guestCount} setGuestCount={setGuestCount} />
      <MobileWeightModal isOpen={weightModal.show} onClose={() => setWeightModal({ show: false, product: null, weight: '' })} onConfirm={confirmWeight} product={weightModal.product} weight={weightModal.weight} handleWeightInput={handleWeightInput} />
      <ConfirmModal isOpen={showConfirmOrder} onClose={() => setShowConfirmOrder(false)} onConfirm={sendOrder} title="Tasdiqlash" message={`Jami: ${cartTotal.toLocaleString()} so'm`} confirmText="Yuborish" isDanger={false} />

      <div className="bg-white px-4 pt-10 pb-4 shadow-sm border-b flex items-center gap-2 z-20 sticky top-0">
        <button onClick={() => setView('tables')} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all text-gray-700">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-xl text-gray-900 leading-none truncate">{activeTable?.name}</h2>
            {activeTable?.current_check_number > 0 && (
              <span className="text-xs font-black text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">#{activeTable.current_check_number}</span>
            )}
          </div>
        </div>
        {settings?.serviceChargeType === 'fixed' && (
          <div className="text-xs text-blue-600 font-bold mt-1 flex items-center gap-1">
            <Users size={12} /> {activeTable?.guests} mehmon
          </div>
        )}

        <button onClick={() => {
          if (view === 'orders') setView('menu');
          else { loadTableOrders(activeTable.id); setView('orders'); }
        }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${view === 'orders' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-600'}`}>
          <Receipt size={24} />
        </button>

        <button onClick={() => setView(view === 'cart' ? 'menu' : 'cart')} className={`w-12 h-12 rounded-2xl relative transition-all active:scale-95 flex items-center justify-center ${view === 'cart' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-600'}`}>
          <ShoppingBag size={24} />
          {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{cartCount}</span>}
        </button>
      </div>

      {view === 'orders' ? (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
          <MobileOrders orders={tableOrders} />
        </div>
      ) : view === 'cart' ? (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
          <MobileCart cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-8 duration-300">
          <MobileMenu categories={categories} products={products} activeCategory={activeCategory} setActiveCategory={setActiveCategory} onProductClick={(product) => product.unit_type === 'kg' ? setWeightModal({ show: true, product, weight: '' }) : addToCart(product)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} cart={cart} loading={loading} />
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-5 rounded-t-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-30">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="text-gray-400 font-bold">{cartCount} xil taom</span>
            <span className="text-2xl font-black text-gray-900">{cartTotal.toLocaleString()} so'm</span>
          </div>
          {view === 'cart' ? (
            <button onClick={() => setShowConfirmOrder(true)} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3">
              <ChefHat size={24} /> Buyurtma Berish
            </button>
          ) : (
            <button onClick={() => setView('cart')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-3">
              Savatchaga O'tish
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WaiterApp;