import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useTables, Table } from '../hooks/useTables';
import { useAuth } from '../context/AuthContext';
import { LogOut, Users, Clock, Receipt, UtensilsCrossed } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
    const { logout, user } = useAuth();
    const { tables, halls, loading, refresh } = useTables();
    const [activeHallId, setActiveHallId] = useState<number | 'all' | 'mine'>('all');
    const navigation = useNavigation();

    const filteredTables = useMemo(() => {
        if (activeHallId === 'all') return tables;
        if (activeHallId === 'mine') {
            return tables.filter(t => t.waiter_name === user?.name || (t.waiter_id && t.waiter_id == user?.id));
        }
        return tables.filter(t => t.hall_id === activeHallId);
    }, [tables, activeHallId, user]);

    const handleTablePress = (table: Table) => {
        // @ts-ignore
        navigation.navigate('Menu', { table });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'busy':
            case 'occupied':
            case 'payment':
                return '#ef4444'; // red-500
            case 'reserved': return '#f59e0b'; // amber-500
            default: return '#22c55e'; // green-500
        }
    };

    const renderTableItem = ({ item }: { item: Table }) => {
        const hall = halls.find(h => h.id === item.hall_id);
        const displayName = hall ? `${hall.name} ${item.name}` : item.name;

        const isBusy = ['busy', 'occupied', 'payment'].includes(item.status);

        return (
            <TouchableOpacity style={styles.tableRow} onPress={() => handleTablePress(item)}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />

                <View style={styles.tableInfo}>
                    <Text style={styles.tableName}>{displayName}</Text>
                    {isBusy && (
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Clock size={14} color="#6b7280" />
                                <Text style={styles.metaText}>{item.start_time ? item.start_time.substring(11, 16) : '--:--'}</Text>
                            </View>
                            <View style={[styles.metaItem, { marginLeft: 8 }]}>
                                <Receipt size={14} color="#6b7280" />
                                <Text style={styles.metaText}>#{item.current_check_number}</Text>
                            </View>
                            {item.waiter_name && (
                                <View style={[styles.metaItem, { marginLeft: 8 }]}>
                                    <Users size={14} color="#6b7280" />
                                    <Text style={styles.metaText}>{item.waiter_name}</Text>
                                </View>
                            )}
                        </View>
                    )}
                    {item.status === 'free' && (
                        <Text style={{ color: '#22c55e', fontSize: 12 }}>Bo'sh</Text>
                    )}
                </View>


            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Salom, {user?.name}</Text>
                    <View style={styles.headerSub}>
                        <UtensilsCrossed size={14} color="#6b7280" />
                        <Text style={styles.subtitle}>NadPos Restoran</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <LogOut size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Sidebar (Halls) */}
                <View style={styles.sidebar}>
                    <TouchableOpacity
                        style={[styles.sidebarItem, activeHallId === 'all' && styles.sidebarItemActive]}
                        onPress={() => setActiveHallId('all')}
                    >
                        <Text style={[styles.sidebarText, activeHallId === 'all' && styles.sidebarTextActive]}>Barchasi</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sidebarItem, activeHallId === 'mine' && styles.sidebarItemActive]}
                        onPress={() => setActiveHallId('mine')}
                    >
                        <Text style={[styles.sidebarText, activeHallId === 'mine' && styles.sidebarTextActive]}>Meniki</Text>
                    </TouchableOpacity>

                    {halls.map(hall => (
                        <TouchableOpacity
                            key={hall.id}
                            style={[styles.sidebarItem, activeHallId === hall.id && styles.sidebarItemActive]}
                            onPress={() => setActiveHallId(hall.id)}
                        >
                            <Text style={[styles.sidebarText, activeHallId === hall.id && styles.sidebarTextActive]}>{hall.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Main List */}
                <View style={styles.main}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={filteredTables}
                            renderItem={renderTableItem}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
                            ListEmptyComponent={<Text style={styles.emptyText}>Stollar yo'q</Text>}
                        />
                    )}
                </View>
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    greeting: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    headerSub: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    subtitle: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    logoutBtn: { padding: 10, backgroundColor: '#fee2e2', borderRadius: 12 },

    content: { flex: 1, flexDirection: 'row' },

    // Sidebar
    sidebar: { width: 80, backgroundColor: 'white', borderRightWidth: 1, borderRightColor: '#f1f5f9', alignItems: 'center' },
    sidebarItem: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginVertical: 8 },
    sidebarItemActive: { backgroundColor: '#eff6ff' },
    sidebarText: { fontSize: 10, color: '#64748b', textAlign: 'center', fontWeight: '600', marginTop: 4 },
    sidebarTextActive: { color: '#2563eb', fontWeight: '700' },

    main: { flex: 1, backgroundColor: '#f8fafc' },
    listContent: { padding: 16, gap: 12 },

    // Table Cards
    tableRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16,
        shadowColor: "#64748b", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        borderWidth: 1, borderColor: 'transparent'
    },
    statusIndicator: { width: 6, height: 40, borderRadius: 3, marginRight: 16 },
    tableInfo: { flex: 1 },
    tableName: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },

    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    metaText: { fontSize: 13, color: '#475569', fontWeight: '600' },

    guestBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8 },
    guestText: { fontSize: 13, fontWeight: '600', color: '#475569' },

    waiterBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
    waiterText: { fontSize: 12, fontWeight: '700', color: '#4338ca' },

    emptyText: { textAlign: 'center', marginTop: 60, color: '#94a3b8', fontSize: 16 }
});
