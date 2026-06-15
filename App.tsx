// Main App Entry Point

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/components/Toast';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/Theme';

export default function App() {
    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <ToastProvider>
                    <AuthProvider>
                        <NavigationContainer>
                            <AppNavigator />
                            <StatusBar style="auto" />
                        </NavigationContainer>
                    </AuthProvider>
                </ToastProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
