import React, { useState, useEffect } from 'react';
import { CreditCard, Users, User, Wallet, X, Printer, Hash, Trash2, Search, PlusCircle } from 'lucide-react';
import PaymentModal from './PaymentModal';
import CustomerModal from './CustomerModal';
import ConfirmModal from './ConfirmModal';
import ReturnModal from './ReturnModal';
import { useGlobal } from '../context/GlobalContext';
import { cn } from '../utils/cn';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const OrderSummary = ({ table, onDeselect }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToReturn, setItemToReturn] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [bonusToUse, setBonusToUse] = useState(0);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [printingCheck, setPrintingCheck] = useState(false);

  // Search & Products
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = React.useRef(null);

  const { settings, showToast } = useGlobal();

  useEffect(() => {
    setSelectedCustomer(null);
    setBonusToUse(0);
    setOrderItems([]);
    if (table) {
      loadOrderItems(table.id);
    }
  }, [table]);

  const loadOrderItems = async (tableId) => {
    if (!window.electron) return;
    setLoading(true);
    try {
      const { ipcRenderer } = window.electron;
      const items = await ipcRenderer.invoke('get-table-items', tableId);
      setOrderItems(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!window.electron) return;
    try {
      const products = await window.electron.ipcRenderer.invoke('get-products');
      setAllProducts(products || []);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  // Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const lower = searchQuery.toLowerCase();
    const filtered = allProducts.filter(p =>
      p.active && (p.name.toLowerCase().includes(lower) || (p.code && p.code.toLowerCase().includes(lower)))
    );
    setSearchResults(filtered);
  }, [searchQuery, allProducts]);

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F4 - Focus Search
      if (e.key === 'F4') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Space - Open Payment (only if not typing in input)
      if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (table && orderItems.length > 0) {
          setIsPaymentModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [table, orderItems]);

  const handleAddProduct = async (product) => {
    if (!table || !window.electron) return;
    try {
      await window.electron.ipcRenderer.invoke('add-order-item', {
        table_id: table.id,
        product_id: product.id,
        quantity: 1,
        price: product.price
      });
      setSearchQuery('');
      setSearchResults([]);
      loadOrderItems(table.id);
    } catch (err) {
      console.error(err);
      showToast('error', err.message);
    }
  };

  const handlePrintCheck = async () => {
    if (!table || !window.electron || printingCheck) return;

    setPrintingCheck(true);
    try {
      const { ipcRenderer } = window.electron;
      const result = await ipcRenderer.invoke('print-check', table.id);

      if (result.success) {
        console.log(`✅ HISOB chop etildi: Check #${result.checkNumber}`);
      }
    } catch (error) {
      console.error('HISOB chiqarishda xato:', error);
      showToast('error', `Xato: ${error.message}`);
    } finally {
      setPrintingCheck(false);
    }
  };

  const handleRemoveItem = (item) => {
    setItemToReturn(item);
  };

  const handleReturnItem = async (itemId, quantity, reason) => {
    if (!window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const result = await ipcRenderer.invoke('return-order-item', { itemId, quantity, reason });

      if (result.success) {
        showToast('success', 'Mahsulot muvaffaqiyatli qaytarildi');
        loadOrderItems(table.id);
      }
      setItemToReturn(null);
    } catch (error) {
      console.error("Return item error:", error);
      showToast('error', "Qaytarishda xatolik: " + error.message);
    }
  };

  const confirmRemoveItem = async () => {
    if (!itemToDelete || !window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const result = await ipcRenderer.invoke('remove-order-item', itemToDelete.id);
      if (result.success) {
        showToast('success', 'Mahsulot o\'chirildi');
        loadOrderItems(table.id);
      }
      setItemToDelete(null);
    } catch (error) {
      console.error("Remove item error:", error);
      showToast('error', "Xatolik: " + error.message);
    }
  };

  const handleCancelOrder = async () => {
    if (!table || !window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const result = await ipcRenderer.invoke('cancel-order', table.id);
      if (result.success) {
        if (onDeselect) onDeselect();
      }
    } catch (error) {
      console.error("Cancel error:", error);
      showToast('error', "Xatolik yuz berdi: " + error.message);
    }
  };

  const handlePrintCheckDisabled = () => {
    return !table || orderItems.length === 0 || printingCheck || loading;
  };

  const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const guestsCount = table?.guests || 0;

  let service = 0;
  const svcValue = Number(settings.serviceChargeValue) || 0;

  if (settings.serviceChargeType === 'percent') {
    service = (subtotal * svcValue) / 100;
  } else {
    service = guestsCount * svcValue;
  }

  const preTotal = subtotal + service;

  let discountAmount = 0;
  if (selectedCustomer) {
    if (selectedCustomer.type === 'discount') {
      discountAmount = (subtotal * selectedCustomer.value) / 100;
    } else if (selectedCustomer.type === 'cashback') {
      discountAmount = bonusToUse;
    }
  }
  const finalTotal = preTotal - discountAmount;

  const handlePaymentSuccess = async (methodOrPayments, dueDateOrIsSplit) => {
    if (!table || !window.electron) return;
    try {
      const { ipcRenderer } = window.electron;

      let checkoutData;
      const isSplitPayment = Array.isArray(methodOrPayments);

      if (isSplitPayment) {
        const splitPayments = methodOrPayments;
        const paymentDetails = splitPayments.map(p => ({
          method: p.method,
          amount: p.amount,
          dueDate: p.dueDate || null
        }));

        checkoutData = {
          tableId: table.id,
          total: finalTotal,
          subtotal: subtotal,
          discount: discountAmount,
          paymentMethod: 'split',
          customerId: selectedCustomer ? selectedCustomer.id : null,
          items: orderItems,
          dueDate: null,
          paymentDetails: paymentDetails
        };
      } else {
        const method = methodOrPayments;
        const dueDate = dueDateOrIsSplit;

        checkoutData = {
          tableId: table.id,
          total: finalTotal,
          subtotal: subtotal,
          discount: discountAmount,
          paymentMethod: method,
          customerId: selectedCustomer ? selectedCustomer.id : null,
          items: orderItems,
          dueDate: dueDate || null
        };
      }

      await ipcRenderer.invoke('checkout', checkoutData);

      setIsPaymentModalOpen(false);
      if (onDeselect) onDeselect();

    } catch (error) {
      console.error(error);
    }
  };

  const handleBonusChange = (e) => {
    const valueStr = e.target.value;
    if (valueStr === '') {
      setBonusToUse(0);
      return;
    }
    let val = Number(valueStr);
    if (val < 0) return;
    if (val > selectedCustomer.balance) val = selectedCustomer.balance;
    if (val > preTotal) val = preTotal;
    setBonusToUse(val);
  };

  if (!table) {
    return (
      <div className="h-full w-full bg-card flex flex-col items-center justify-center text-muted-foreground p-10 text-center select-none animate-in fade-in">
        <div className="bg-secondary/50 p-8 rounded-full mb-6">
          <CreditCard size={64} strokeWidth={1.5} />
        </div>
        <h3 className="font-bold text-2xl text-foreground mb-2">Buyurtma yaratish uchun stol tanlang</h3>
        <p className="text-base max-w-xs opacity-70">Chap tomondagi ro'yxatdan stolni tanlang yoki yangi stol oching.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 w-full bg-card h-full flex flex-col border-none">
        {/* HEADER */}
        <div className={cn(
          "p-6 border-b border-border transition-colors",
          table.status === 'payment' ? 'bg-yellow-50 dark:bg-yellow-950/30' :
            table.status === 'free' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-secondary/30 dark:bg-secondary/10'
        )}>
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-2xl font-bold text-foreground">{table.name}</h2>

            {/* CHEK RAQAMI */}
            {table.current_check_number > 0 && (
              <div className="flex items-center gap-1 bg-background px-3 py-1 rounded-full shadow-sm border border-border">
                <Hash size={14} className="text-muted-foreground" />
                <span className="font-black text-lg text-foreground">{table.current_check_number}</span>
              </div>
            )}
            {table.status === 'free' && (
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                <span className="font-bold text-xs text-green-700 dark:text-green-300">YANGI BUYURTMA</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-2">
            {settings.serviceChargeType !== 'fixed' && <div></div>}

            {table.status !== 'free' && (
              <Badge variant={table.status === 'occupied' ? 'default' : 'secondary'} className={table.status === 'occupied' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800'}>
                {table.status === 'occupied' ? 'Band' : 'To\'lov'}
              </Badge>
            )}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="px-4 py-3 bg-card border-b border-border relative z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Mahsulot qidirish / Shtrixkod (F4)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-4 right-4 bg-popover shadow-xl rounded-b-xl border border-border max-h-60 overflow-y-auto mt-1 z-30">
              {searchResults.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => handleAddProduct(prod)}
                  className="p-3 hover:bg-secondary cursor-pointer border-b border-border last:border-0 flex justify-between items-center group"
                >
                  <div>
                    <p className="font-bold text-foreground text-sm">{prod.name}</p>
                    <p className="text-xs text-muted-foreground">{prod.code || 'Kod yo\'q'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-sm">{prod.price.toLocaleString()}</span>
                    <PlusCircle size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CUSTOMER */}
        {selectedCustomer && (
          <div className="px-6 py-4 bg-primary/5 border-b border-primary/10">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <User size={18} className="text-primary" />
                <div>
                  <p className="font-bold text-foreground">{selectedCustomer.name}</p>
                  <p className="text-xs text-primary">
                    {selectedCustomer.type === 'discount'
                      ? `VIP: ${selectedCustomer.value}% Chegirma`
                      : `Bonus: ${selectedCustomer.balance.toLocaleString()} so'm`}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-primary/20 rounded text-primary"><X size={16} /></button>
            </div>
            {selectedCustomer.type === 'cashback' && selectedCustomer.balance > 0 && (
              <div className="bg-background p-2 rounded-lg border border-border mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Bonusdan:</span><span>Max: {selectedCustomer.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-green-500" />
                  <input
                    type="number"
                    value={bonusToUse === 0 ? '' : bonusToUse}
                    onChange={handleBonusChange}
                    placeholder="Summa"
                    className="w-full outline-none text-sm font-bold text-foreground bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {loading ? <div className="text-center mt-10 text-muted-foreground">Yuklanmoqda...</div> :
            orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50">
                <PlusCircle size={48} strokeWidth={1} className="mb-2" />
                <p>Buyurtma qo'shish uchun mahsulot tanlang</p>
              </div>
            ) :
              orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 items-center gap-2 py-4 border-b border-dashed border-border last:border-0 group">
                  {/* Name */}
                  <div className="col-span-5 pr-2">
                    <p className="font-bold text-base text-foreground truncate" title={item.product_name}>
                      {item.product_name}
                    </p>
                  </div>

                  {/* Qty x Price */}
                  <div className="col-span-4 text-right">
                    <div className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-secondary/30 px-2 py-1 rounded-md inline-block">
                      <span className="text-foreground font-bold">{item.quantity}x</span> {item.price.toLocaleString()}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="col-span-2 text-right">
                    <p className="font-bold text-base text-foreground truncate">
                      {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="w-10 h-10 flex items-center justify-center text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      title="O'chirish"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
        </div>

        {/* TOTALS */}
        <div className="p-4 bg-secondary/20 border-t border-border space-y-2">
          <div className="flex justify-between text-muted-foreground text-sm"><span>Stol hisobi:</span><span>{subtotal.toLocaleString()}</span></div>

          <div className="flex justify-between text-muted-foreground text-sm">
            <span>Xizmat ({settings.serviceChargeType === 'percent' ? `${settings.serviceChargeValue}%` : 'Fixed'}):</span>
            <span>{service.toLocaleString()}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-orange-500 font-medium text-sm"><span>Chegirma:</span><span>- {discountAmount.toLocaleString()}</span></div>
          )}
          <div className="flex justify-between text-2xl font-bold text-primary mt-2 border-t border-border pt-2"><span>Jami:</span><span>{finalTotal.toLocaleString()}</span></div>
        </div>

        {/* BUTTONS */}
        <div className="p-4 border-t border-border space-y-3 bg-card">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={!table || orderItems.length === 0}
              className="text-destructive border-border hover:bg-destructive/10 hover:border-destructive/30"
              title="Buyurtmani bekor qilish"
            >
              <Trash2 size={20} />
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCustomerModalOpen(true)}
              className={cn("col-span-1 gap-2", selectedCustomer && "border-primary text-primary bg-primary/5")}
            >
              <User size={20} /> {selectedCustomer ? 'Almashtirish' : 'Mijoz'}
            </Button>
            <Button
              variant="outline"
              onClick={handlePrintCheck}
              disabled={handlePrintCheckDisabled()}
              className="gap-2"
            >
              <Printer size={20} /> {printingCheck ? 'Chop...' : 'Chek'}
            </Button>
          </div>
          <Button
            size="lg"
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full text-lg shadow-lg gap-2"
          >
            <CreditCard size={20} /> To'lovni Yopish
          </Button>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={finalTotal}
        onPay={handlePaymentSuccess}
        selectedCustomer={selectedCustomer}
      />
      <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSelectCustomer={setSelectedCustomer} />

      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        title="Buyurtmani bekor qilish"
        message="Haqiqatan ham bu stol buyurtmasini butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Yo'q, qolsin"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmRemoveItem}
        title="Mahsulotni o'chirish"
        message={`Haqiqatan ham "${itemToDelete?.product_name}" ni buyurtmadan o'chirmoqchimisiz?`}
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        isDanger={true}
      />

      <ReturnModal
        isOpen={!!itemToReturn}
        onClose={() => setItemToReturn(null)}
        onConfirm={handleReturnItem}
        item={itemToReturn}
      />
    </>
  );
};

export default OrderSummary;