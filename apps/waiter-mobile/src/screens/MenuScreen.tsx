import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useMenu, Product } from '../hooks/useMenu';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useNetwork } from '../context/NetworkContext';
import { useAuth } from '../context/AuthContext';
import { Minus, Plus, ShoppingBag, Trash2, Search } from 'lucide-react-native';
import axios from 'axios';

interface CartItem extends Product {
    qty: number;
}

export default function MenuScreen() {
    const { products, categories, loading } = useMenu();
    const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [weightModalVisible, setWeightModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [weightInput, setWeightInput] = useState('');

    // New State for Tabs and Existing Orders
    const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
    const [existingItems, setExistingItems] = useState<any[]>([]);
    const [loadingExisting, setLoadingExisting] = useState(false);

    const route = useRoute();
    const navigation = useNavigation();
    const { serverUrl } = useNetwork();
    const { user } = useAuth();

    // @ts-ignore
    const { table } = route.params;

    // Fetch existing orders when screen loads or tab changes to orders
    const fetchExistingOrders = async () => {
        if (!serverUrl) return;
        setLoadingExisting(true);
        try {
            const res = await axios.get(`${serverUrl}/api/tables/${table.id}/items`);
            setExistingItems(res.data || []);
        } catch (e) {
            console.log("Error fetching items:", e);
        } finally {
            setLoadingExisting(false);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'orders') {
            fetchExistingOrders();
        }
    }, [serverUrl, table.id, activeTab]);

    const filteredProducts = useMemo(() => {
        let items = products;
        if (activeCategory !== 'all') {
            items = items.filter(p => p.category_id === activeCategory);
        }
        if (searchQuery) {
            items = items.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return items;
    }, [products, activeCategory, searchQuery]);

    const addToCart = (product: Product) => {
        if (product.unit_type === 'kg') {
            setSelectedProduct(product);
            setWeightInput('');
            setWeightModalVisible(true);
            return;
        }

        setCart(prev => {
            const exists = prev.find(i => i.id === product.id);
            if (exists) {
                return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const confirmWeight = () => {
        if (!selectedProduct) return;
        const weight = parseFloat(weightInput.replace(',', '.'));
        if (isNaN(weight) || weight <= 0) {
            Alert.alert("Xatolik", "Noto'g'ri vazn kiritildi");
            return;
        }

        setCart(prev => {
            const exists = prev.find(i => i.id === selectedProduct.id);
            if (exists) {
                // For kg items, usually adding more means adding to total weight? 
                // Or replacing? Standard POS usually increments. 
                // Let's increment.
                return prev.map(i => i.id === selectedProduct.id ? { ...i, qty: i.qty + weight } : i);
            }
            return [...prev, { ...selectedProduct, qty: weight }];
        });

        setWeightModalVisible(false);
        setSelectedProduct(null);
    };

    const removeFromCart = (id: string) => {
        setCart(prev => {
            const exists = prev.find(i => i.id === id);
            if (exists && exists.qty > 1) {
                return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
            }
            return prev.filter(i => i.id !== id);
        });
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    }, [cart]);

    const handleSendOrder = async () => {
        if (cart.length === 0) return;
        setSubmitting(true);
        try {
            // Guest count logic skipped for simplicity, assumed existing or default

            await axios.post(`${serverUrl}/api/orders/bulk-add`, {
                tableId: table.id,
                items: cart.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    qty: item.qty,
                    destination: 'kitchen' // Default
                })),
                waiterId: user?.id
            });

            Alert.alert("Muvaffaqiyatli", "Buyurtma yuborildi!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
            setCart([]);
        } catch (e) {
            Alert.alert("Xatolik", "Buyurtma yuborilmadi. Qayta urinib ko'ring.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderProductItem = ({ item }: { item: Product }) => {
        const cartItem = cart.find(c => c.id === item.id);

        return (
            <TouchableOpacity
                style={styles.productRow}
                onPress={() => addToCart(item)}
                activeOpacity={0.7}
            >


                <View style={styles.prodInfo}>
                    <Text style={styles.prodName}>{item.name}</Text>
                    <Text style={styles.prodPrice}>{item.price.toLocaleString()} UZS</Text>
                </View>

                {cartItem ? (
                    <View style={styles.qtyControls}>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.qtyBtn}>
                            {cartItem.qty === 1 ? <Trash2 size={16} color="#ef4444" /> : <Minus size={16} color="#374151" />}
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{cartItem.qty}</Text>
                        <TouchableOpacity onPress={() => addToCart(item)} style={styles.qtyBtn}>
                            <Plus size={16} color="#374151" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.addBtn}>
                        <Plus size={24} color="#2563eb" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'menu' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('menu')}
                >
                    <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>Menyu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'orders' && styles.tabButtonActive]}
                    onPress={() => {
                        setActiveTab('orders');
                        fetchExistingOrders();
                    }}
                >
                    <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>Buyurtmalar</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'menu' ? (
                <>
                    {/* Categories */}
                    <View style={styles.categories}>
                        <FlatList
                            horizontal
                            data={[{ id: 'all', name: 'Barchasi' }, ...categories]}
                            keyExtractor={item => item.id.toString()}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.catItem, activeCategory === item.id && styles.catItemActive]}
                                    onPress={() => setActiveCategory(item.id)}
                                >
                                    <Text style={[styles.catText, activeCategory === item.id && styles.catTextActive]}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    {/* Search */}
                    <View style={styles.searchContainer}>
                        <Search size={20} color="#9ca3af" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Qidirish..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Products List */}
                    {loading ? (
                        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            data={filteredProducts}
                            extraData={cart}
                            renderItem={renderProductItem}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </>
            ) : (
                /* Existing Orders View */
                <View style={{ flex: 1 }}>
                    {loadingExisting ? (
                        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            data={existingItems}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: '#9ca3af' }}>Hozircha buyurtmalar yo'q</Text>}
                            renderItem={({ item }) => (
                                <View style={styles.orderRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.orderName}>{item.product_name}</Text>
                                        <Text style={styles.orderPrice}>{parseFloat(item.price).toLocaleString()} UZS</Text>
                                    </View>
                                    <View style={styles.orderBadge}>
                                        <Text style={styles.orderQty}>{item.quantity} {item.unit_type === 'kg' ? 'kg' : 'x'}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                                        <Text style={styles.orderTotal}>{(item.price * item.quantity).toLocaleString()} UZS</Text>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                    <View style={styles.totalFooter}>
                        <Text style={styles.totalLabel}>Jami:</Text>
                        <Text style={styles.totalValue}>
                            {existingItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()} UZS
                        </Text>
                    </View>
                </View>
            )}

            {/* Cart Bar */}
            {cart.length > 0 && (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.cartBarWrapper}>
                    <View style={styles.cartBar}>
                        <View style={styles.cartInfo}>
                            <View style={styles.cartIconBadge}>
                                <ShoppingBag size={20} color="white" />
                                <View style={styles.badge}><Text style={styles.badgeText}>{cart.reduce((a, b) => a + b.qty, 0)}</Text></View>
                            </View>
                            <Text style={styles.cartTotal}>{cartTotal.toLocaleString()} UZS</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.checkoutBtn, submitting && styles.btnDisabled]}
                            onPress={handleSendOrder}
                            disabled={submitting}
                        >
                            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.checkoutText}>Buyurtma Berish</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
            {/* Weight Modal */}
            <Modal
                visible={weightModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setWeightModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
                        <Text style={styles.modalSubtitle}>Vazn kiriting (kg):</Text>

                        <TextInput
                            style={styles.weightInput}
                            value={weightInput}
                            onChangeText={setWeightInput}
                            keyboardType="decimal-pad"
                            placeholder="0.0"
                            autoFocus={true}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setWeightModalVisible(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Bekor qilish</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmWeight} style={styles.confirmButton}>
                                <Text style={styles.confirmButtonText}>Qo'shish</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    // Tabs
    tabContainer: { flexDirection: 'row', backgroundColor: 'white', padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' },
    tabButtonActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#cad4e0' }, // Light border for active
    tabText: { fontWeight: '600', color: '#64748b', fontSize: 15 },
    tabTextActive: { color: '#2563eb', fontWeight: '700' },

    // Categories
    categories: { backgroundColor: 'white', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    catItem: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f1f5f9', marginHorizontal: 4 },
    catItemActive: { backgroundColor: '#2563eb', shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
    catText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    catTextActive: { color: 'white', fontWeight: '700' },

    // Search
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 16, paddingHorizontal: 16, borderRadius: 12, gap: 12, borderWidth: 1, borderColor: '#e2e8f0', height: 50 },
    searchIcon: { opacity: 0.5 },
    searchInput: { flex: 1, fontSize: 16, color: '#1e293b', height: '100%' },

    listContent: { padding: 16, paddingBottom: 100 },

    // Product Grid (Rows)
    productRow: {
        flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, marginBottom: 16, padding: 12,
        shadowColor: "#64748b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
        borderWidth: 1, borderColor: 'transparent'
    },
    // prodImage -> productImage (if used in component), but component uses prodImage style name currently? 
    // Wait, let's check component usages.
    // Component uses: style={styles.productRow}, style={styles.prodImage}, style={styles.prodInfo}, style={styles.prodName}, style={styles.prodPrice}, style={styles.addBtn}
    // I need to keep the keys same or update component. Keeping keys same is safer.

    prodImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f1f5f9' },
    placeholderImage: { backgroundColor: '#f3f4f6' }, // Keep if needed
    prodInfo: { flex: 1, marginLeft: 16, justifyContent: 'center', gap: 4 },
    prodName: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 0 },
    prodPrice: { fontSize: 15, color: '#64748b', fontWeight: '500' },

    addBtn: {
        backgroundColor: '#f1f5f9', width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center'
    },



    // Cart Bar
    cartBarWrapper: { position: 'absolute', bottom: 24, left: 16, right: 16, borderRadius: 20 }, // Adjusted
    cartBar: {
        backgroundColor: 'white', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
        shadowColor: "#1e293b", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8
    },
    cartInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cartIconBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: 'white' },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    cartTotal: { fontSize: 20, fontWeight: '800', color: '#0f172a' },

    checkoutBtn: { backgroundColor: '#0f172a', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
    btnDisabled: { opacity: 0.5 },
    checkoutText: { color: 'white', fontWeight: '700', fontSize: 16 },

    // Orders Tab
    orderRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12,
        shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    orderName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    orderPrice: { fontSize: 14, color: '#64748b', marginTop: 2 },
    orderBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginHorizontal: 12 },
    orderQty: { color: '#4338ca', fontWeight: '700', fontSize: 14 },
    orderTotal: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

    totalFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    totalLabel: { fontSize: 18, fontWeight: '700', color: '#475569' },
    totalValue: { fontSize: 22, fontWeight: '900', color: '#0f172a' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', width: '100%', maxWidth: 340, padding: 24, borderRadius: 24, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 10 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 15, color: '#64748b', marginBottom: 24, textAlign: 'center' },
    weightInput: { width: '100%', height: 60, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 16, padding: 12, fontSize: 24, textAlign: 'center', marginBottom: 24, fontWeight: '700', color: '#0f172a' },
    modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
    cancelButton: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center' },
    cancelButtonText: { color: '#475569', fontWeight: '700', fontSize: 16 },
    confirmButton: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#2563eb', alignItems: 'center' },
    confirmButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },

    // Quantity Controls (Restored & Improved)
    qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#e2e8f0' },
    qtyBtn: { width: 32, height: 32, backgroundColor: 'white', borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    qtyText: { fontSize: 16, fontWeight: '700', paddingHorizontal: 10, minWidth: 24, textAlign: 'center', color: '#0f172a' }
});
