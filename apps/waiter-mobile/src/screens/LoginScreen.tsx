import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Delete } from 'lucide-react-native';
import { useNetwork } from '../context/NetworkContext'; // for serverUrl
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../utils/storage';

interface User {
    id: string;
    name: string;
    role: string;
}

export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (user: User) => void }) {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const { serverUrl } = useNetwork();

    const handlePress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) handleLogin(newPin);
        }
    };

    const handleDelete = () => setPin(prev => prev.slice(0, -1));

    const handleLogin = async (code: string) => {
        if (!serverUrl) return;
        setLoading(true);
        try {
            const { data } = await axios.post(`${serverUrl}/api/login`, { pin: code });
            // Save token/user if needed, for now just callback
            await AsyncStorage.setItem(StorageKeys.USER_TOKEN, JSON.stringify(data));
            onLoginSuccess(data);
        } catch (e: any) {
            setPin('');
            Alert.alert("Xatolik", e.response?.data?.error || "PIN kod noto'g'ri");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Kirish</Text>
                <Text style={styles.subtitle}>PIN kodingizni kiriting</Text>

                <View style={styles.pinDisplay}>
                    {[1, 2, 3, 4].map(i => (
                        <View key={i} style={[styles.dot, i <= pin.length && styles.dotActive]} />
                    ))}
                </View>

                {loading && <ActivityIndicator size="small" color="#3b82f6" style={{ marginTop: 20 }} />}

                <View style={styles.keypad}>
                    {[1, 2, 3].map(row => (
                        <View key={row} style={styles.row}>
                            {[1, 2, 3].map(col => {
                                const num = ((row - 1) * 3 + col).toString();
                                return (
                                    <TouchableOpacity key={num} style={styles.key} onPress={() => handlePress(num)} disabled={loading}>
                                        <Text style={styles.keyText}>{num}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                    <View style={styles.row}>
                        <View style={[styles.key, { opacity: 0 }]} />
                        <TouchableOpacity style={styles.key} onPress={() => handlePress('0')} disabled={loading}>
                            <Text style={styles.keyText}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.key} onPress={handleDelete} disabled={loading}>
                            <Delete size={28} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
    title: { fontSize: 36, fontWeight: '800', color: '#1e293b', marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#64748b', marginBottom: 60, fontWeight: '500' },

    pinDisplay: { flexDirection: 'row', gap: 24, marginBottom: 60 },
    dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#cbd5e1' },
    dotActive: { backgroundColor: '#2563eb', borderColor: '#2563eb', transform: [{ scale: 1.2 }], shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

    keypad: { gap: 24 },
    row: { flexDirection: 'row', gap: 32 },
    key: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: 'white',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#64748b", shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    keyText: { fontSize: 32, fontWeight: '600', color: '#1e293b' }
});
