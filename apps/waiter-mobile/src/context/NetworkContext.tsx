import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { getServerConfig } from '../utils/storage';

interface NetworkContextType {
    socket: Socket | null;
    isConnected: boolean;
    serverUrl: string | null;
    connect: (ip: string, port: number) => void;
    disconnect: () => void;
}

const NetworkContext = createContext<NetworkContextType>({} as any);

export const useNetwork = () => useContext(NetworkContext);

import NetInfo from '@react-native-community/netinfo';

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isWifiConnected, setIsWifiConnected] = useState(true);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkStoredConfig();

        const unsubscribe = NetInfo.addEventListener(state => {
            setIsWifiConnected(!!(state.isConnected && state.type === 'wifi'));
        });

        return () => unsubscribe();
    }, []);

    const checkStoredConfig = async () => {
        const config = await getServerConfig();
        if (config) {
            connect(config.ip, config.port);
        } else {
            setIsLoading(false);
        }
    };

    const connect = (ip: string, port: number) => {
        // Ensure protocol. Default to http for local IPs unless 443
        let protocol = 'http';
        if (port === 443) protocol = 'https';

        const url = `${protocol}://${ip}:${port}`;
        setServerUrl(url);

        if (socket) socket.disconnect();

        console.log(`Connecting to ${url}...`);

        // Log connection attempt
        setIsLoading(true);

        const newSocket = io(url, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            timeout: 10000, // 10s connection timeout
        });

        newSocket.on('connect', () => {
            console.log('Connected to', url);
            setIsConnected(true);
            setIsLoading(false); // Stop loading on connect
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.log('Connection error:', err);
        });

        setSocket(newSocket);
        setIsLoading(false);
    };

    const disconnect = () => {
        if (socket) socket.disconnect();
        setSocket(null);
        setServerUrl(null);
        setIsConnected(false);
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <NetworkContext.Provider value={{ socket, isConnected, serverUrl, connect, disconnect }}>
            {children}
            {(!isWifiConnected || (serverUrl && !isConnected)) && (
                <View style={[styles.overlay, !isWifiConnected && { backgroundColor: '#ef4444' }]}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.overlayText}>
                        {!isWifiConnected ? "Wi-Fi Aloqasi Yo'q" : "Server bilan aloqa yo'q"}
                    </Text>
                    <Text style={styles.subText}>
                        {!isWifiConnected ? "Iltimos, Wi-Fi ga ulaning" : "Qayta ulanmoqda..."}
                    </Text>
                </View>
            )}
        </NetworkContext.Provider>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    overlayText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
    },
    subText: {
        color: '#ccc',
        marginTop: 8,
    }
});
