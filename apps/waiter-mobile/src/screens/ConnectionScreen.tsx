import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNetwork } from '../context/NetworkContext';
import { saveServerConfig } from '../utils/storage';
import { ScanLine, RefreshCw } from 'lucide-react-native';

export default function ConnectionScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const { connect } = useNetwork();

    // Permission handling
    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        getPermissions();
    }, []);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        setScanned(true);
        try {
            // Data validation
            const config = JSON.parse(data);
            if (!config.ip || !config.port) throw new Error("Invalid QR Code");

            // Save and Connect
            await saveServerConfig(config.ip, config.port);
            connect(config.ip, config.port); // Network Context handles the rest
        } catch (error) {
            Alert.alert("Xatolik", "Noto'g'ri QR kod skanerlandi. Iltimos, kassadagi kodni ishlating.");
            setScanned(false);
        }
    };

    if (hasPermission === null) {
        return <View style={styles.center}><Text>Kamera ruxsati so'ralmoqda...</Text></View>;
    }
    if (hasPermission === false) {
        return <View style={styles.center}><Text>Kameraga ruxsat yo'q</Text></View>;
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.overlay}>
                <View style={styles.header}>
                    <Text style={styles.title}>Serverga ulanish</Text>
                    <Text style={styles.subtitle}>Kassadagi QR kodni skanerlang</Text>
                </View>

                <View style={styles.scanArea}>
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />
                    <ScanLine color="rgba(255,255,255,0.5)" size={100} style={styles.scanIcon} />
                </View>

                {scanned && (
                    <TouchableOpacity onPress={() => setScanned(false)} style={styles.rescanBtn}>
                        <RefreshCw color="white" size={24} />
                        <Text style={styles.btnText}>Qayta urinish</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
    header: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20, borderRadius: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#ddd' },

    scanArea: { width: 280, height: 280, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#3b82f6' },
    cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#3b82f6' },
    cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#3b82f6' },
    cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#3b82f6' },
    scanIcon: { opacity: 0.8 },

    rescanBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
