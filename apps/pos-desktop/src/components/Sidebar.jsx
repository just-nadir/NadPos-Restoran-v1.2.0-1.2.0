import React from 'react';
import { LayoutGrid, UtensilsCrossed, Settings, LogOut, Square, Users, FileText, PieChart, MessageSquare, Lock, Search, ChevronRight, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { APP_INFO } from '../config/appConfig';

const Sidebar = ({ activePage, onNavigate, onLogout, user, onCloseShift, syncStatus }) => {
  const getSyncIcon = () => {
    const { status } = syncStatus || {};
    if (status === 'syncing') return <RefreshCw className="animate-spin text-blue-500" size={20} />;
    if (status === 'online') return <Cloud className="text-green-500" size={20} />;
    if (status === 'error') return <CloudOff className="text-red-500" size={20} />;
    return <CloudOff className="text-gray-300" size={20} />;
  };

  const menuItems = [
    { id: 'pos', icon: <LayoutGrid size={28} />, label: "Kassa" },
    { id: 'menu', icon: <UtensilsCrossed size={28} />, label: "Menyu" },
    { id: 'tables', icon: <Square size={28} />, label: "Zallar" },
    { id: 'customers', icon: <Users size={28} />, label: "Mijozlar" },
    { id: 'debtors', icon: <FileText size={28} />, label: "Qarzdorlar" },
    { id: 'reports', icon: <PieChart size={28} />, label: "Xisobotlar" },
    { id: 'marketing', icon: <MessageSquare size={28} />, label: "SMS" },
    { id: 'settings', icon: <Settings size={28} />, label: "Sozlamalar" },
  ];

  // Ruxsatlar mantiqi
  const filteredItems = menuItems.filter(item => {
    // Admin: Hammasi
    if (user?.role === 'admin') return true;

    // Kassir: Faqat Kassa, Mijozlar, Qarzdorlar
    if (user?.role === 'cashier') {
      return ['pos', 'customers', 'debtors'].includes(item.id);
    }

    return false;
  });

  return (
    <div className="w-[90px] bg-white h-screen flex flex-col items-center py-4 shadow-lg z-10">
      {/* Logo olib tashlandi */}

      <div className="flex-1 flex flex-col gap-3 w-full px-2 overflow-y-auto scrollbar-hide mt-2">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all duration-200 group
              ${activePage === item.id
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            title={item.label}
          >
            <div className="mb-1">
              {React.cloneElement(item.icon, { size: 28 })}
            </div>
            <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full px-2 mb-2 border-t pt-4 border-gray-100">
        {onCloseShift && (
          <button
            onClick={onCloseShift}
            className="flex flex-col items-center justify-center p-3 text-orange-400 hover:text-orange-600 rounded-xl hover:bg-orange-50 transition-colors"
            title="Smenani Yopish"
          >
            <Lock size={24} />
          </button>
        )}
        <div className="flex flex-col items-center gap-3 mb-2">
          {/* Sync Indicator */}
          <div className="p-2 rounded-full bg-gray-50 flex items-center justify-center" title={`Sync: ${syncStatus?.status || 'Offline'} - ${syncStatus?.lastSync || ''}`}>
            {getSyncIcon()}
          </div>

          <button onClick={onLogout} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-red-100" title="Chiqish">
            <LogOut size={24} />
          </button>
          <span className="text-[10px] text-gray-400 font-bold">{APP_INFO.version}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;