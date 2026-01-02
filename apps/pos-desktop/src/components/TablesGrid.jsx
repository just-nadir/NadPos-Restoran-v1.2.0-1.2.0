import React, { useState, useEffect } from 'react';
import {
  Users, Clock, Receipt, Hash, User, Search, ArrowRight
} from 'lucide-react';
import { useIpcListener } from '../hooks/useIpcListener';
import { useGlobal } from '../context/GlobalContext';
import { formatDate, formatTime } from '../utils/dateUtils';
import { cn } from '../utils/cn';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/* ... Imports remain ... */
/* ... Imports remain ... */
import MenuModal from './MenuModal';


// --- NEW ORDER MODAL ---


const TablesGrid = ({ onSelectTable, selectedTableId }) => { // Accepted selectedTableId prop
  const [tables, setTables] = useState([]);
  const [halls, setHalls] = useState([]);
  const [activeHallId, setActiveHallId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showFree, setShowFree] = useState(false);
  // Modal State
  const [menuModal, setMenuModal] = useState({ isOpen: false, table: null });

  const { settings } = useGlobal();

  const loadData = async () => {
    try {
      if (window.electron && window.electron.ipcRenderer) {
        const [hallsData, tablesData] = await Promise.all([
          window.electron.ipcRenderer.invoke('get-halls'),
          window.electron.ipcRenderer.invoke('get-tables')
        ]);

        setHalls(hallsData || []);
        setTables(tablesData || []);
      }
    } catch (error) {
      console.error("Xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useIpcListener('db-change', (event, data) => {
    if (['tables', 'sales', 'table-items'].includes(data.type)) {
      loadData();
    }
  });

  const filteredTables = tables.filter(table => {
    const isHallMatch = activeHallId === 'all' || table.hall_id === activeHallId;
    const isActiveStatus = showFree ? table.status === 'free' : table.status !== 'free';

    console.log(`Table: ${table.name}, Status: ${table.status}, ShowFree: ${showFree}, SafeActive: ${isActiveStatus}`);
    return isHallMatch && isActiveStatus;
  });

  // Sort: Occupied first
  const sortedTables = [...filteredTables].sort((a, b) => {
    const statusOrder = { 'payment': 0, 'occupied': 1, 'reserved': 2, 'free': 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  /* ... Helper functions ... */

  const handleTableClick = (table) => {
    const hall = halls.find(h => h.id === table.hall_id);
    const displayName = hall ? `${hall.name} ${table.name}` : table.name;
    onSelectTable({ ...table, displayName });
  };

  const handleTableDoubleClick = (table) => {
    // Agar stol bo'sh bo'lsa yoki band bo'lsa (qo'shimcha buyurtma uchun)
    if (table.status === 'free' || table.status === 'occupied') {
      const hall = halls.find(h => h.id === table.hall_id);
      const displayName = hall ? `${hall.name} ${table.name}` : table.name;
      setMenuModal({ isOpen: true, table: { ...table, name: displayName } });
    }
  };

  const handleMenuClose = () => {
    setMenuModal({ isOpen: false, table: null });
    if (menuModal.table) {
      // Try to select it after closing if it became occupied
      onSelectTable(menuModal.table);
      // Note: table status in 'menuModal.table' is stale ('free'), 
      // but onSelectTable just takes ID/Object. 
      // Ideally we fetch fresh data, but Global Listener handles that.
    }
  };

  const getStatusColor = (status, isSelected) => {
    if (isSelected) return 'bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2 ring-offset-background';
    switch (status) {
      case 'occupied': return 'bg-blue-50/50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800 dark:hover:bg-blue-900/50';
      case 'payment': return 'bg-yellow-50/50 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:border-yellow-800 dark:hover:bg-yellow-900/50';
      case 'reserved': return 'bg-purple-50/50 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:border-purple-800 dark:hover:bg-purple-900/50';
      case 'free': return 'bg-card border-border hover:bg-secondary/50 dark:hover:bg-secondary/20';
      default: return 'bg-card';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'occupied': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">BAND</Badge>;
      case 'payment': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">TO'LOV</Badge>;
      case 'reserved': return <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">BAND QILINGAN</Badge>;
      case 'free': return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">BO'SH</Badge>;
      default: return null;
    }
  };


  if (loading) return <div className="p-10 text-center text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="flex-1 bg-background h-full flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="p-4 border-b border-border bg-background z-10 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Stollar</h1>
          <Button
            variant={showFree ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFree(!showFree)}
            className="gap-2 text-xs"
          >
            {showFree ? "Faqat faollar" : "Bo'sh stollar"}
          </Button>
        </div>

        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={activeHallId === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveHallId('all')}
            size="sm"
            className="rounded-full px-4"
          >
            Hammasi
          </Button>
          {halls.map(hall => (
            <Button
              key={hall.id}
              variant={activeHallId === hall.id ? 'default' : 'outline'}
              onClick={() => setActiveHallId(hall.id)}
              size="sm"
              className="rounded-full whitespace-nowrap px-4"
            >
              {hall.name}
            </Button>
          ))}
        </div>


      </div>

      {/* LIST VIEW */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <div className="flex flex-col gap-2">
          {sortedTables.map((table) => {
            const isSelected = selectedTableId === table.id;
            const hall = halls.find(h => h.id === table.hall_id);
            const displayName = hall ? `${hall.name} ${table.name}` : table.name;

            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                onDoubleClick={() => handleTableDoubleClick(table)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none",
                  getStatusColor(table.status, isSelected),
                  isSelected ? "shadow-md z-10 scale-[1.01]" : "shadow-sm active:scale-[0.99]"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Table Icon/Number Container */}
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-sm border",
                    isSelected
                      ? "bg-background text-primary border-transparent shadow-none"
                      : table.status === 'free' ? "bg-secondary text-muted-foreground border-transparent" : "bg-white dark:bg-slate-800 text-foreground"
                  )}>
                    {table.name.replace(/\D/g, '') || <Hash size={20} />}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col">
                    <h3 className={cn("font-bold text-lg leading-none mb-1", isSelected ? "text-primary-foreground" : "text-foreground")}>
                      {displayName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      {table.waiter_name ? (
                        <span className="flex items-center gap-1"><User size={12} /> {table.waiter_name}</span>
                      ) : <span className="text-xs italic opacity-70">Ofitsiant yo'q</span>}

                      {table.status !== 'free' && (
                        <>
                          <span className="opacity-50">•</span>
                          <span className="flex items-center gap-1 font-mono"><Clock size={12} /> {table.start_time}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Status & Total */}
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(table.status)}

                  {table.total_amount > 0 && (
                    <div className={cn("font-bold text-lg tabular-nums mt-1", isSelected ? "text-white" : "text-primary")}>
                      {table.total_amount.toLocaleString()} <span className="text-sm opacity-70">so'm</span>
                    </div>
                  )}
                  {table.status === 'free' && <span className="text-xs text-muted-foreground opacity-50 font-medium">--</span>}
                </div>
              </div>
            )
          })}

          {sortedTables.length === 0 && (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
              <p className="font-medium">Faol buyurtmalar yo'q</p>
              {!showFree && (
                <Button variant="link" onClick={() => setShowFree(true)} className="text-primary mt-2">
                  + Yangi buyurtma ochish
                </Button>
              )}
            </div>
          )}
        </div>
      </div>


      <MenuModal
        isOpen={menuModal.isOpen}
        onClose={handleMenuClose}
        tableId={menuModal.table?.id}
        tableName={menuModal.table?.name}
      />
    </div>
  );
};

export default TablesGrid;