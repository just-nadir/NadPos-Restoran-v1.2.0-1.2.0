import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Wallet, Percent, Users, Calendar, Gift, X, Search, ArrowDownLeft, ArrowUpRight, CheckCircle, FileText, CreditCard } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import SaleDetailModal from './SaleDetailModal';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { Input } from './ui/input';

// --- MODAL KOMPONENT (Dark Mode Optimized) ---
const CustomerModal = ({ isOpen, onClose, onSubmit, newCustomer, setNewCustomer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-background w-[500px] rounded-2xl shadow-2xl p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-foreground mb-6">Yangi Mijoz</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Ism Familiya</label>
              <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full p-4 bg-secondary/20 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-medium transition-all" placeholder="Ali Valiyev" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Telefon</label>
              <input required type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="w-full p-4 bg-secondary/20 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-medium transition-all" placeholder="90 123 45 67" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">Mijoz Turi</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setNewCustomer({ ...newCustomer, type: 'discount' })}
                className={cn("p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold", newCustomer.type === 'discount' ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400' : 'bg-card border-border text-muted-foreground hover:bg-secondary')}>
                <Percent size={20} /> Chegirma (VIP)
              </button>
              <button type="button" onClick={() => setNewCustomer({ ...newCustomer, type: 'cashback' })}
                className={cn("p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold", newCustomer.type === 'cashback' ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400' : 'bg-card border-border text-muted-foreground hover:bg-secondary')}>
                <Wallet size={20} /> Bonus
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              {newCustomer.type === 'discount' ? 'Chegirma Foizi (%)' : 'Bonus Yig\'ish Foizi (%)'}
            </label>
            <input required type="number" value={newCustomer.value} onChange={e => setNewCustomer({ ...newCustomer, value: e.target.value })} className="w-full p-4 bg-secondary/20 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-medium transition-all" placeholder="Masalan: 5" />
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">Tug'ilgan kun (Ixtiyoriy)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input type="date" value={newCustomer.birthday} onChange={e => setNewCustomer({ ...newCustomer, birthday: e.target.value })} className="w-full pl-12 pr-4 py-4 bg-secondary/20 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-medium transition-all" />
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 mt-2 text-lg active:scale-95 transition-transform">Saqlash</button>
        </form>
      </div>
    </div>
  );
};

// --- ASOSIY KOMPONENT ---
const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, debtor, discount, cashback
  const [searchQuery, setSearchQuery] = useState('');

  // History & Payment
  const [history, setHistory] = useState([]);
  const [payAmount, setPayAmount] = useState('');
  const [isPaySuccess, setIsPaySuccess] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '', phone: '', type: 'cashback', value: '', birthday: ''
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  // Sale Detail Modal
  const [detailModal, setDetailModal] = useState({ isOpen: false, sale: null, checkNumber: 0 });

  const loadCustomers = async () => {
    if (!window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const data = await ipcRenderer.invoke('get-customers');
      setCustomers(data);
      if (selectedCustomer) {
        const updated = data.find(c => c.id === selectedCustomer.id);
        if (updated) setSelectedCustomer(updated);
      }
    } catch (err) { console.error(err); }
  };

  const loadHistory = async (id) => {
    if (!window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const data = await ipcRenderer.invoke('get-debt-history', id); // Keep consistent with existing backend
      setHistory(data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => {
    if (selectedCustomer) {
      loadHistory(selectedCustomer.id);
      setPayAmount('');
    }
  }, [selectedCustomer?.id]); // Only reload history if ID changes

  // Filter Logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'debtor') return c.debt > 0;
    return c.type === filterType;
  });

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('add-customer', { ...newCustomer, value: Number(newCustomer.value) });
      setIsModalOpen(false);
      setNewCustomer({ name: '', phone: '', type: 'cashback', value: '', birthday: '' });
      loadCustomers();
    } catch (err) { console.error(err); }
  };

  const confirmDelete = (id) => setConfirmModal({ isOpen: true, id });

  const performDelete = async () => {
    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('delete-customer', confirmModal.id);
      if (selectedCustomer?.id === confirmModal.id) setSelectedCustomer(null);
      loadCustomers();
    } catch (err) { console.error(err); }
  };

  const handlePayDebt = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0 || !selectedCustomer) return;

    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('pay-debt', {
        customerId: selectedCustomer.id,
        amount: Number(payAmount),
        comment: "Qarz to'lovi"
      });
      setPayAmount('');
      setIsPaySuccess(true);
      setTimeout(() => setIsPaySuccess(false), 3000);
      loadCustomers();
      loadHistory(selectedCustomer.id);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex w-full h-full relative bg-background">
      {/* 2-QISM: SIDEBAR (List & Filters) */}
      <div className="w-96 bg-card border-r border-border flex flex-col h-full shadow-sm z-10">

        {/* Header & Tabs */}
        <div className="p-4 border-b border-border bg-card">
          <h2 className="text-xl font-bold text-foreground mb-4 px-2">Mijozlar</h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary/30 rounded-xl border-transparent focus:bg-background focus:border-primary border outline-none text-foreground transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'all', icon: Users, label: 'Barchasi' },
              { id: 'debtor', icon: ArrowDownLeft, label: 'Qarzdorlar', color: 'text-destructive' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border",
                  filterType === tab.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-secondary"
                )}
              >
                <tab.icon size={14} className={filterType !== tab.id ? tab.color : ''} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-bold flex items-center justify-center gap-2 mb-2"
          >
            <Plus size={20} /> Yangi Mijoz Qo'shish
          </button>

          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className={cn(
                "w-full p-4 rounded-xl cursor-pointer transition-all border text-left group relative",
                selectedCustomer?.id === customer.id
                  ? "bg-primary/10 border-primary shadow-sm"
                  : "bg-card border-transparent hover:bg-secondary/50 border-b-border"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={cn("font-bold text-lg truncate pr-8", selectedCustomer?.id === customer.id ? "text-primary" : "text-foreground")}>
                  {customer.name}
                </span>
                {selectedCustomer?.id !== customer.id && (
                  <button
                    disabled={customer.debt > 0}
                    onClick={(e) => { e.stopPropagation(); if (customer.debt <= 0) confirmDelete(customer.id); }}
                    className={cn(
                      "absolute right-2 top-2 p-2 transition-opacity",
                      customer.debt > 0 ? "text-muted-foreground/30 cursor-not-allowed hidden group-hover:block" : "text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                    )}
                    title={customer.debt > 0 ? "Qarzdor mijozni o'chirib bo'lmaydi" : "O'chirish"}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{customer.phone}</span>
                <span className={cn(
                  "font-bold px-2 py-0.5 rounded text-xs",
                  customer.debt > 0 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
                )}>
                  {customer.debt > 0 ? `-${customer.debt.toLocaleString()}` : customer.balance.toLocaleString()}
                </span>
              </div>

              {customer.birthday && (
                <div className="text-orange-500 flex items-center gap-1 text-xs font-bold mt-1.5 opacity-80">
                  <Gift size={12} /> {formatDate(customer.birthday)}
                </div>
              )}
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-10 text-muted-foreground opacity-50 flex flex-col items-center">
              <Users size={48} strokeWidth={1} className="mb-2" />
              <p>Mijozlar topilmadi</p>
            </div>
          )}
        </div>
      </div>

      {/* 3-QISM: CONTENT (Detail View) */}
      <div className="flex-1 bg-background flex flex-col h-full overflow-hidden relative">
        {selectedCustomer ? (
          <>
            <div className="bg-card p-8 border-b border-border shadow-sm z-20">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-foreground">{selectedCustomer.name}</h1>
                    {selectedCustomer.type === 'discount' && <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-bold border border-purple-500/20">VIP {selectedCustomer.value}%</span>}
                    {selectedCustomer.type === 'cashback' && <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-bold border border-green-500/20">Bonus {selectedCustomer.value}%</span>}
                  </div>
                  <p className="text-muted-foreground text-lg flex items-center gap-2">
                    <User size={18} /> {selectedCustomer.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                    {selectedCustomer.debt > 0 ? "Joriy Qarz" : "Joriy Balans"}
                  </p>
                  <div className={cn("text-4xl font-black", selectedCustomer.debt > 0 ? "text-destructive" : "text-green-600")}>
                    {selectedCustomer.debt > 0 ? selectedCustomer.debt.toLocaleString() : selectedCustomer.balance.toLocaleString()}
                    <span className="text-lg text-muted-foreground font-medium ml-1">so'm</span>
                  </div>
                </div>
              </div>

              {/* ACTIONS BAR */}
              <div className="flex gap-4 mt-6">
                {selectedCustomer.debt > 0 && (
                  <form onSubmit={handlePayDebt} className="flex-1 bg-secondary/20 p-2 rounded-xl border border-border flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs uppercase">So'ndirish</span>
                      <input
                        type="number"
                        placeholder="Summa..."
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full h-full pl-24 pr-4 bg-transparent outline-none font-bold text-foreground"
                      />
                    </div>
                    <Button type="submit" disabled={!payAmount} className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                      <CheckCircle size={18} className="mr-2" /> To'lash
                    </Button>
                  </form>
                )}
                <Button
                  variant="outline"
                  disabled={selectedCustomer.debt > 0}
                  onClick={() => confirmDelete(selectedCustomer.id)}
                  className={cn(
                    "bg-card border-border",
                    selectedCustomer.debt > 0 ? "text-muted-foreground cursor-not-allowed opacity-50" : "text-destructive hover:bg-destructive/10"
                  )}
                  title={selectedCustomer.debt > 0 ? "Qarzdor mijozni o'chirib bo'lmaydi" : ""}
                >
                  <Trash2 size={20} className="mr-2" /> O'chirish
                </Button>
              </div>
            </div>

            {/* HISTORY */}
            <div className="flex-1 overflow-y-auto p-8 bg-secondary/5">
              <h3 className="font-bold text-muted-foreground mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <FileText size={16} /> Operatsiyalar Tarixi
              </h3>

              <div className="space-y-3 max-w-4xl">
                {isPaySuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 mb-4">
                    <CheckCircle size={24} />
                    <span className="font-bold">To'lov muvaffaqiyatli qabul qilindi!</span>
                  </div>
                )}

                {history.map((item) => {
                  const hasDetails = item.items_json || item.sale_id;
                  return (
                    <div
                      key={item.id}
                      onDoubleClick={() => {
                        if (item.items_json) {
                          try {
                            const items = JSON.parse(item.items_json);
                            setDetailModal({
                              isOpen: true,
                              sale: { items, amount: item.amount, date: item.date },
                              checkNumber: item.check_number
                            });
                          } catch (e) { console.error(e); }
                        }
                      }}
                      className={cn(
                        "bg-card p-5 rounded-2xl shadow-sm border border-border flex justify-between items-center hover:shadow-md transition-all",
                        hasDetails && "cursor-pointer active:scale-[0.98] hover:bg-muted/5"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border",
                          item.type === 'debt' ? "bg-destructive/10 border-destructive/20 text-destructive"
                            : item.type === 'payment' ? "bg-green-500/10 border-green-500/20 text-green-600"
                              : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                        )}>
                          {item.type === 'debt' ? <ArrowDownLeft size={24} />
                            : item.type === 'payment' ? <ArrowUpRight size={24} />
                              : <CreditCard size={24} />}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-lg mb-0.5">
                            {item.comment || (item.type === 'debt' ? 'Nasiya' : 'To\'lov')}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium bg-secondary/50 px-2 py-0.5 rounded w-fit">
                            <Calendar size={12} />
                            {formatDateTime(item.date)}
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "font-black text-xl tabular-nums",
                        item.type === 'debt' ? "text-destructive" : "text-green-600"
                      )}>
                        {item.type === 'debt' ? '+' : '-'}{item.amount.toLocaleString()}
                      </div>
                    </div>
                  ); // End return
                })}

                {history.length === 0 && (
                  <div className="text-center py-20 opacity-40">
                    <FileText size={48} className="mx-auto mb-4" strokeWidth={1} />
                    <p className="text-xl font-medium">Tarix mavjud emas</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-40">
            <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center mb-6">
              <User size={64} strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold mb-2">Mijoz tanlanmagan</p>
            <p className="text-lg">Tafsilotlarni ko'rish uchun ro'yxatdan tanlang</p>
          </div>
        )}
      </div>

      <CustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddCustomer} newCustomer={newCustomer} setNewCustomer={setNewCustomer} />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={performDelete}
        message="Haqiqatan ham bu mijozni o'chirmoqchimisiz?"
        isDanger={true}
      />
      <SaleDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal(prev => ({ ...prev, isOpen: false }))}
        sale={detailModal.sale}
        checkNumber={detailModal.checkNumber}
      />
    </div>
  );
};

export default CustomersManagement;