import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, Package, ArrowRight, Trash2, CheckCircle, Clock, X, Save, AlertCircle, Calendar, DollarSign, Archive, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';

// --- MODAL: Yangi Kirim (Hujjat Yaratish) ---
const CreateSupplyModal = ({ isOpen, onClose, onCreate }) => {
    const [supplier, setSupplier] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate({ supplier, date, note });
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
            <div className="bg-card w-[500px] rounded-2xl shadow-2xl p-6 relative border border-border">
                <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4"><X size={20} /></Button>
                <h2 className="text-xl font-bold text-foreground mb-6">Yangi Kirim Hujjati</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Yetkazib Beruvchi (Supplier)</label>
                        <Input required type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Masalan: Bozor, Firma nomi" autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Sana</label>
                        <Input required type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Izoh</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="w-full p-3 bg-secondary rounded-xl border border-input outline-none focus:ring-2 focus:ring-ring text-foreground text-sm resize-none"
                            rows={3}
                            placeholder="Qo'shimcha ma'lumot..."
                        />
                    </div>
                    <Button type="submit" className="w-full mt-2" size="lg">Hujjat Yaratish</Button>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENT: Hujjat Ko'rish/Tahrirlash ---
const SupplyEditor = ({ supplyId, onClose, refreshHelper }) => {
    const [supply, setSupply] = useState(null);
    const [items, setItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states for adding item
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState('');
    const [price, setPrice] = useState('');
    const [searchProd, setSearchProd] = useState('');

    const loadDetails = async () => {
        setLoading(true);
        try {
            const { ipcRenderer } = window.electron;
            const data = await ipcRenderer.invoke('get-supply-details', supplyId);
            const prods = await ipcRenderer.invoke('get-products');
            setSupply(data);
            setItems(data.items || []);
            setProducts(prods || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadDetails(); }, [supplyId]);

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const { ipcRenderer } = window.electron;
            await ipcRenderer.invoke('add-supply-item', {
                supplyId,
                productId: selectedProduct,
                quantity: Number(qty),
                price: Number(price)
            });
            // Reset form
            setQty('');
            setPrice('');
            setSelectedProduct('');
            setSearchProd('');
            const searchInput = document.getElementById('product-search-input');
            if (searchInput) searchInput.focus();
            loadDetails();
            refreshHelper(); // Refresh parent list amount
        } catch (err) { console.error(err); }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            const { ipcRenderer } = window.electron;
            await ipcRenderer.invoke('remove-supply-item', itemId);
            loadDetails();
            refreshHelper();
        } catch (err) { console.error(err); }
    };

    const handleComplete = async () => {
        if (!confirm("Diqqat! Hujjat tasdiqlangandan so'ng uni o'zgartirib bo'lmaydi va mahsulotlar omborga kirim qilinadi. Davom etasizmi?")) return;
        try {
            const { ipcRenderer } = window.electron;
            await ipcRenderer.invoke('complete-supply', supplyId);
            onClose(); // Close editor
            refreshHelper(); // Refresh parent list
        } catch (err) { console.error(err); alert("Xatolik yuz berdi"); }
    };

    if (loading) return <div className="p-10 text-center text-muted-foreground">Yuklanmoqda...</div>;
    if (!supply) return <div className="p-10 text-center text-muted-foreground">Hujjat topilmadi</div>;

    const filteredProds = products.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase()));

    const isDraft = supply.status === 'draft';

    return (
        <div className="absolute inset-0 bg-background z-10 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-card px-8 py-4 border-b border-border flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><ArrowRight className="rotate-180" size={20} /></Button>
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            {isDraft ? <Clock className="text-yellow-500" size={20} /> : <CheckCircle className="text-green-500" size={20} />}
                            {supply.supplier_name}
                        </h2>
                        <p className="text-sm text-muted-foreground">{format(new Date(supply.date), 'dd.MM.yyyy')} • {supply.note}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Jami Summa</p>
                        <p className="text-2xl font-bold text-primary tabular-nums">{supply.total_amount?.toLocaleString() || 0} so'm</p>
                    </div>
                    {isDraft && (
                        <Button onClick={handleComplete} className="gap-2 bg-green-600 hover:bg-green-700 text-white" size="lg">
                            <Save size={18} /> Tasdiqlash
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6 bg-secondary/20">
                {/* Left: Items List */}
                <div className="flex-1 bg-card rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden">
                    <div className="overflow-y-auto flex-1 p-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-secondary/50 sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Mahsulot</th>
                                    <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Miqdor</th>
                                    <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Narx</th>
                                    <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Jami</th>
                                    {isDraft && <th className="px-6 py-4 w-10"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{idx + 1}. {item.product_name}</td>
                                        <td className="px-6 py-4 text-foreground/80">{item.quantity} {item.unit_type}</td>
                                        <td className="px-6 py-4 text-foreground/80 tabular-nums">{item.price?.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-bold text-foreground tabular-nums">{item.total?.toLocaleString()}</td>
                                        {isDraft && (
                                            <td className="px-6 py-4 text-right">
                                                <Button size="icon" variant="ghost" onClick={() => handleRemoveItem(item.id)} className="text-muted-foreground hover:text-destructive h-8 w-8"><Trash2 size={16} /></Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr><td colSpan="5" className="p-12 text-center text-muted-foreground">Hujjat bo'sh</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Add Item Form (Only Draft) */}
                {isDraft && (
                    <Card className="w-[350px] shadow-sm border-border h-fit">
                        <CardHeader>
                            <CardTitle>Mahsulot qo'shish</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {/* Search Product */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input
                                    id="product-search-input"
                                    type="text"
                                    placeholder="Mahsulot qidirish..."
                                    value={searchProd}
                                    onChange={e => { setSearchProd(e.target.value); setSelectedProduct(''); }}
                                    className="pl-9"
                                />
                                {searchProd && !selectedProduct && (
                                    <div className="absolute top-full left-0 right-0 bg-popover shadow-xl rounded-xl mt-1 border border-border max-h-[200px] overflow-auto z-20">
                                        {filteredProds.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => { setSelectedProduct(p.id); setSearchProd(p.name); }}
                                                className="p-3 hover:bg-secondary cursor-pointer border-b border-border last:border-0"
                                            >
                                                <div className="font-bold text-foreground text-sm">{p.name}</div>
                                                <div className="text-xs text-muted-foreground">{p.price.toLocaleString()} so'm</div>
                                            </div>
                                        ))}
                                        {filteredProds.length === 0 && <div className="p-3 text-muted-foreground text-sm">Topilmadi</div>}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleAddItem} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Miqdor</label>
                                    <Input required type="number" step="0.01" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" className="font-bold text-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Kirish Narxi</label>
                                    <Input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="font-bold text-lg" />
                                </div>

                                <Button disabled={!selectedProduct} type="submit" className="w-full" size="lg">
                                    Qo'shish
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};


const InventoryManagement = () => {
    const [activeTab, setActiveTab] = useState('supplies'); // supplies | stocks
    const [supplies, setSupplies] = useState([]);
    const [products, setProducts] = useState([]);

    // Create Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Edit Mode
    const [editingSupplyId, setEditingSupplyId] = useState(null);

    const loadData = async () => {
        if (!window.electron) return;
        try {
            const { ipcRenderer } = window.electron;

            if (activeTab === 'supplies') {
                const data = await ipcRenderer.invoke('get-supplies', 'all'); // 'all' status
                setSupplies(data || []);
            } else {
                const prods = await ipcRenderer.invoke('get-products');
                setProducts(prods || []);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { loadData(); }, [activeTab]);

    const handleCreateSupply = async (data) => {
        try {
            const { ipcRenderer } = window.electron;
            const res = await ipcRenderer.invoke('create-supply', data);
            setIsCreateOpen(false);
            setEditingSupplyId(res.id); // Open immediately
            loadData();
        } catch (err) { console.error(err); }
    };

    const deleteDraft = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Hujjatni o'chirmoqchimisiz?")) return;
        try {
            const { ipcRenderer } = window.electron;
            await ipcRenderer.invoke('delete-supply', id);
            loadData();
        } catch (err) { console.error(err); }
    }

    return (
        <div className="flex flex-col h-full bg-secondary/30 relative">
            {/* HEADER */}
            <div className="bg-background px-8 py-5 border-b border-border flex justify-between items-center shadow-sm">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Package className="text-primary" />
                    Ombor Boshqaruvi
                </h1>
                <div className="flex bg-secondary p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('supplies')}
                        className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-all text-sm",
                            activeTab === 'supplies' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        Hujjatlar (Kirim)
                    </button>
                    <button
                        onClick={() => setActiveTab('stocks')}
                        className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-all text-sm",
                            activeTab === 'stocks' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        Qoldiqlar
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 p-8 overflow-hidden flex flex-col">

                {/* --- TAB: SUPPLIES (DOCUMENTS) --- */}
                {activeTab === 'supplies' && (
                    <>
                        <div className="flex justify-between mb-6">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <Input type="text" placeholder="Qidirish..." className="pl-10 bg-background" />
                            </div>
                            <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-lg hover:shadow-xl transition-all">
                                <Plus size={18} /> Yangi Kirim
                            </Button>
                        </div>

                        <div className="bg-card rounded-2xl shadow-sm border border-border flex-1 overflow-hidden flex flex-col">
                            <div className="overflow-y-auto flex-1 p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-secondary/50 sticky top-0 z-10 backdrop-blur-sm border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Sana</th>
                                            <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Yetkazib Beruvchi</th>
                                            <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Summa</th>
                                            <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider text-right">Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {supplies.map(s => (
                                            <tr key={s.id} onClick={() => setEditingSupplyId(s.id)} className="hover:bg-secondary/40 cursor-pointer transition-colors group">
                                                <td className="px-6 py-4 text-foreground font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={16} className="text-muted-foreground" />
                                                        {format(new Date(s.date), 'dd.MM.yyyy')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-foreground">{s.supplier_name}</td>
                                                <td className="px-6 py-4">
                                                    {s.status === 'draft'
                                                        ? <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock size={12} /> Qoralama</Badge>
                                                        : <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"><CheckCircle size={12} /> Tasdiqlangan</Badge>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 font-bold text-primary tabular-nums">{s.total_amount?.toLocaleString()} so'm</td>
                                                <td className="px-6 py-4 text-right">
                                                    {s.status === 'draft' && (
                                                        <Button size="icon" variant="ghost" onClick={(e) => deleteDraft(s.id, e)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
                                                            <Trash2 size={18} />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {supplies.length === 0 && (
                                            <tr><td colSpan="5" className="p-20 text-center text-muted-foreground">Hujjatlar mavjud emas</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* --- TAB: STOCKS (VIEW ONLY) --- */}
                {activeTab === 'stocks' && (
                    <div className="bg-card rounded-2xl shadow-sm border border-border flex-1 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-yellow-200/50 bg-yellow-50/50 dark:bg-yellow-900/10 flex items-start gap-3">
                            <AlertCircle className="text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" size={20} />
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">Bu yerda faqat joriy qoldiqlar ko'rsatiladi. O'zgartirish uchun "Hujjatlar" bo'limidan yangi kirim qiling.</p>
                        </div>
                        <div className="overflow-y-auto flex-1 p-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-secondary/50 sticky top-0 z-10 backdrop-blur-sm border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Mahsulot</th>
                                        <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Kategoriya</th>
                                        <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Qoldiq</th>
                                        <th className="px-6 py-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Sotuv Narxi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {products.map(p => (
                                        <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-foreground">{p.name}</td>
                                            <td className="px-6 py-4 text-muted-foreground text-sm">{p.category_name || '-'}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={p.stock <= 5 ? "destructive" : "outline"} className={cn(
                                                    "font-bold text-sm px-3 py-1",
                                                    p.stock > 5 && "border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
                                                )}>
                                                    {p.stock} {p.unit_type}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-foreground font-medium tabular-nums">{p.price.toLocaleString()} so'm</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS & EDITORS */}
            <CreateSupplyModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreateSupply} />

            {editingSupplyId && (
                <SupplyEditor
                    supplyId={editingSupplyId}
                    onClose={() => { setEditingSupplyId(null); loadData(); }}
                    refreshHelper={loadData}
                />
            )}
        </div>
    );
};

export default InventoryManagement;
