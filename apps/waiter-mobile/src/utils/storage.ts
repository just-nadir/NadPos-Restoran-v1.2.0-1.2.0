import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
    SERVER_CONFIG: 'server_config', // { ip, port }
    USER_TOKEN: 'user_token',
};

export interface ServerConfig {
    ip: string;
    port: number;
}

export const saveServerConfig = async (ip: string, port: number) => {
    await AsyncStorage.setItem(StorageKeys.SERVER_CONFIG, JSON.stringify({ ip, port }));
};

export const getServerConfig = async (): Promise<ServerConfig | null> => {
    try {
        const data = await AsyncStorage.getItem(StorageKeys.SERVER_CONFIG);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
};

export const clearServerConfig = async () => {
    await AsyncStorage.removeItem(StorageKeys.SERVER_CONFIG);
};
