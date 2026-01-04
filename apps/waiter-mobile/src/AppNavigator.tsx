import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useNetwork } from './context/NetworkContext';
import ConnectionScreen from './screens/ConnectionScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import MenuScreen from './screens/MenuScreen';

import { useAuth } from './context/AuthContext';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { serverUrl } = useNetwork();
    const { user, login } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!serverUrl ? (
                    <Stack.Screen name="Connection" component={ConnectionScreen} />
                ) : !user ? (
                    <Stack.Screen name="Login">
                        {props => <LoginScreen {...props} onLoginSuccess={login} />}
                    </Stack.Screen>
                ) : (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Menu" component={MenuScreen} options={{ headerShown: true, title: 'Menyu' }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
