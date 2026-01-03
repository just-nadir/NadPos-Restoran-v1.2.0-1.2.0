import React, { memo } from 'react';
import { User, Lock, Users } from 'lucide-react';

const MobileTableGrid = memo(({ tables, filterMode, setFilterMode, onTableClick, user }) => {
    const myTables = tables.filter(t => t.waiter_id === user.id && t.status !== 'free');
    const freeTables = tables.filter(t => t.status === 'free');

    let displayedTables = tables;
    if (filterMode === 'mine') displayedTables = myTables;
    if (filterMode === 'free') displayedTables = freeTables;

    return (
        <>
            {/* Filters */}
            <div className="px-4 py-4 flex gap-3 overflow-x-auto scrollbar-hide">
                <button onClick={() => setFilterMode('all')} className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${filterMode === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 shadow-sm'}`}>
                    Hammasi ({tables.length})
                </button>
                <button onClick={() => setFilterMode('mine')} className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${filterMode === 'mine' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 shadow-sm'}`}>
                    <User size={16} /> Meniki ({myTables.length})
                </button>
                <button onClick={() => setFilterMode('free')} className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${filterMode === 'free' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-white text-gray-500 shadow-sm'}`}>
                    Bo'sh ({freeTables.length})
                </button>
            </div>

            {/* Grid */}
            <div className="px-4 grid grid-cols-2 gap-4 pb-20">
                {displayedTables.map(table => {
                    const isMine = table.waiter_id === user.id && table.status !== 'free';
                    const isBusyOther = table.status !== 'free' && table.waiter_id !== user.id;
                    const isFree = table.status === 'free';

                    return (
                        <div key={table.id} onClick={() => onTableClick(table)}
                            className={`relative p-5 rounded-3xl flex flex-col justify-between h-40 transition-all active:scale-95 shadow-sm border-2
                  ${isMine ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200 shadow-xl' :
                                    isBusyOther ? 'bg-gray-50 border-gray-200 opacity-60' :
                                        'bg-white border-transparent shadow-md'}`}
                        >
                            {isBusyOther && <div className="absolute top-4 right-4 text-gray-400"><Lock size={20} /></div>}

                            <div>
                                <h3 className={`font-black text-xl mb-1 ${isMine ? 'text-white' : 'text-gray-800'}`}>{table.name}</h3>

                                {isBusyOther && table.waiter_name && (
                                    <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-md inline-block mb-2">
                                        {table.waiter_name}
                                    </span>
                                )}

                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg tracking-wider
                     ${isMine ? 'bg-white/20 text-white' :
                                        isBusyOther ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {isFree ? 'BO\'SH' : isBusyOther ? 'BAND' : 'MENIKI'}
                                </span>
                            </div>

                            <div className="flex items-end justify-between">
                                <div className={`text-xs font-bold flex items-center gap-1 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                                    <Users size={16} /> {table.guests}
                                </div>
                                {!isFree && (
                                    <div className={`font-black text-lg ${isMine ? 'text-white' : 'text-gray-900'}`}>
                                        {table.total_amount?.toLocaleString()}
                                    </div>
                                )}
                            </div>

                            {table.current_check_number > 0 && (
                                <div className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-2xl rounded-tr-2xl text-xs font-black 
                        ${isMine ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    #{table.current_check_number}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </>
    );
});

export default MobileTableGrid;
