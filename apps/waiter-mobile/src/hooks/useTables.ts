import { useState, useEffect } from 'react';
import { useNetwork } from '../context/NetworkContext';
import axios from 'axios';

export interface Table {
    id: number;
    name: string;
    hall_id: number;
    status: 'free' | 'busy' | 'reserved' | 'occupied' | 'payment';
    current_check_number: number;
    guests: number;
    waiter_id?: string;
    waiter_name?: string;
    start_time?: string;
    total_amount?: number;
}

export interface Hall {
    id: number;
    name: string;
}

export const useTables = () => {
    const { serverUrl, socket } = useNetwork();
    const [tables, setTables] = useState<Table[]>([]);
    const [halls, setHalls] = useState<Hall[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!serverUrl) return;
        try {
            const [hallsRes, tablesRes] = await Promise.all([
                axios.get(`${serverUrl}/api/halls`),
                axios.get(`${serverUrl}/api/tables`)
            ]);
            setHalls(hallsRes.data);
            setTables(tablesRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        if (socket) {
            socket.on('update', (data: { type: string, id: any }) => {
                // Oddiylik uchun har qanday update da to'liq yangilaymiz
                // Keyinchalik optimizatsiya qilish mumkin
                if (['table', 'tables', 'order', 'orders', 'table-items'].includes(data.type)) {
                    loadData();
                }
            });
        }

        return () => {
            if (socket) socket.off('update');
        };
    }, [serverUrl, socket]);

    return { tables, halls, loading, refresh: loadData };
};
