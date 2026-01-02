import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layout, Square, Armchair, X, Edit2, Check, MapPin } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { cn } from '../utils/cn'; // Assuming cn utility exists from previous edits or standard codebase
import { Button } from './ui/button'; // Assuming button component exists
import { Input } from './ui/input'; // Assuming input component exists

// --- MODAL KOMPONENT ---
const TableModal = ({ isOpen, onClose, onSubmit, newTableName, setNewTableName, activeHallName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-background w-[450px] rounded-2xl shadow-2xl p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2"><X size={24} /></button>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Yangi Stol</h2>
          <p className="text-sm text-muted-foreground">Zal: <span className="font-bold text-primary text-base">{activeHallName}</span></p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">Stol Nomi</label>
            <input
              autoFocus
              required
              type="text"
              value={newTableName}
              onChange={e => setNewTableName(e.target.value)}
              className="w-full p-4 bg-secondary/30 rounded-xl border border-transparent focus:border-primary outline-none text-foreground text-lg font-medium transition-all text-center"
              placeholder="Masalan: 15"
            />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 text-lg transition-transform active:scale-95">Saqlash</button>
        </form>
      </div>
    </div>
  );
};

// --- ASOSIY ---
const TablesManagement = () => {
  const [halls, setHalls] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeHall, setActiveHall] = useState(null);

  const [isAddingHall, setIsAddingHall] = useState(false);
  const [newHallName, setNewHallName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  // Delete Modal State
  const [modal, setModal] = useState({ isOpen: false, type: null, id: null, message: '' });

  const loadHalls = async () => {
    if (!window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const data = await ipcRenderer.invoke('get-halls');
      setHalls(data);
      if (!activeHall && data.length > 0) setActiveHall(data[0].id);
    } catch (err) { console.error(err); }
  };

  const loadTables = async () => {
    if (!activeHall || !window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const data = await ipcRenderer.invoke('get-tables-by-hall', activeHall);
      setTables(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadHalls(); }, []);
  useEffect(() => { loadTables(); }, [activeHall]);

  const handleAddHall = async (e) => {
    e.preventDefault();
    if (!newHallName.trim()) return;
    const { ipcRenderer } = window.electron;
    await ipcRenderer.invoke('add-hall', newHallName);
    setNewHallName('');
    setIsAddingHall(false);
    loadHalls();
  };

  const confirmDeleteHall = (id) => {
    setModal({ isOpen: true, type: 'hall', id, message: "DIQQAT: Zal va unga tegishli barcha stollar o'chiriladi!" });
  };

  const confirmDeleteTable = (id) => {
    setModal({ isOpen: true, type: 'table', id, message: "Stolni o'chirmoqchimisiz?" });
  };

  const performDelete = async () => {
    try {
      const { ipcRenderer } = window.electron;
      if (modal.type === 'hall') {
        await ipcRenderer.invoke('delete-hall', modal.id);
        if (activeHall === modal.id) setActiveHall(null);
        loadHalls();
      } else if (modal.type === 'table') {
        await ipcRenderer.invoke('delete-table', modal.id);
        loadTables();
      }
    } catch (err) { console.error(err); }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim() || !activeHall) return;
    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('add-table', { hallId: activeHall, name: newTableName });
      setIsModalOpen(false);
      setNewTableName('');
      loadTables();
    } catch (err) { console.error(err); }
  };

  const activeHallObj = halls.find(h => h.id === activeHall);

  return (
    <div className="flex w-full h-full relative bg-background">
      {/* 2-QISM: ZALLAR (SIDEBAR) */}
      <div className="w-80 bg-card border-r border-border flex flex-col h-full z-10 shadow-sm">
        <div className="p-6 border-b border-border flex justify-between items-center bg-card">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Layout className="text-primary" size={24} />
            Zallar
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full hover:bg-secondary text-primary hover:text-primary"
            onClick={() => setIsAddingHall(true)}
          >
            <Plus size={24} />
          </Button>
        </div>

        {isAddingHall && (
          <form onSubmit={handleAddHall} className="p-4 bg-secondary/10 border-b border-border animate-in slide-in-from-top">
            <input
              autoFocus
              type="text"
              placeholder="Zal nomi..."
              value={newHallName}
              onChange={(e) => setNewHallName(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-background focus:border-primary outline-none mb-3 text-lg text-foreground shadow-sm"
            />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddingHall(false)} className="flex-1 text-muted-foreground hover:text-foreground">Bekor</Button>
              <Button type="submit" className="flex-1">Qo'shish</Button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {halls.map(hall => (
            <div key={hall.id} className="relative group">
              <div
                onClick={() => setActiveHall(hall.id)}
                className={cn(
                  "w-full px-5 py-4 rounded-xl font-bold text-lg transition-all cursor-pointer flex items-center justify-between shadow-sm border border-transparent",
                  activeHall === hall.id
                    ? "bg-primary text-primary-foreground shadow-md border-primary/20 scale-[1.02]"
                    : "bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={20} className={activeHall === hall.id ? 'opacity-100' : 'opacity-50'} />
                  <span className="truncate">{hall.name}</span>
                </div>

                {/* Delete Button */}
                {activeHall === hall.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); confirmDeleteHall(hall.id); }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-QISM: STOLLAR (CONTENT) */}
      <div className="flex-1 bg-background flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <div className="bg-card px-8 py-5 border-b border-border flex justify-between items-center shadow-sm z-20">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {activeHallObj?.name || "Zallar"}
              {activeHallObj && <span className="text-sm font-medium px-3 py-1 bg-secondary text-muted-foreground rounded-full">{tables.length} ta stol</span>}
            </h1>
          </div>

          {activeHall && (
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="rounded-xl shadow-lg gap-2 text-lg h-12 px-6">
              <Plus size={24} /> Yangi Stol
            </Button>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-secondary/5">
          {activeHall ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {tables.map(table => (
                <div
                  key={table.id}
                  className="bg-card dark:bg-card p-6 rounded-3xl shadow-sm border border-border hover:border-primary/50 hover:shadow-md transition-all group flex flex-col items-center justify-center text-center relative aspect-[4/3] cursor-pointer"
                >
                  <div className="mb-4 p-4 rounded-full bg-secondary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Square size={32} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-foreground text-2xl mb-1">{table.name}</h3>
                  <div className="text-muted-foreground text-sm flex items-center gap-1 font-medium bg-secondary/20 px-2 py-0.5 rounded-md">
                    <Armchair size={14} /> Standard
                  </div>

                  <button
                    onClick={() => confirmDeleteTable(table.id)}
                    className="absolute top-3 right-3 p-2 rounded-xl text-muted-foreground hover:bg-destructive hover:text-white opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                    title="Stolni o'chirish"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}

              {/* Empty State */}
              {tables.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-3xl bg-card/50">
                  <Layout size={64} className="mb-4 opacity-20" strokeWidth={1} />
                  <p className="text-xl font-medium">Bu zalda stollar yo'q</p>
                  <p className="text-sm opacity-60">"Yangi Stol" tugmasini bosib qo'shing</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <MapPin size={80} className="mb-6 opacity-20 animate-bounce" strokeWidth={1} />
              <p className="text-2xl font-medium">Ishlash uchun chap tomondan zalni tanlang</p>
            </div>
          )}
        </div>
      </div>

      <TableModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddTable} newTableName={newTableName} setNewTableName={setNewTableName} activeHallName={activeHallObj?.name} />

      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={performDelete}
        message={modal.message}
      />
    </div>
  );
};

export default TablesManagement;