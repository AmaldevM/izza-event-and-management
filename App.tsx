// Main App Entry Point

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/components/Toast';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/Theme';

const navTheme = {
    ...NavigationDarkTheme,
    colors: {
        ...NavigationDarkTheme.colors,
        background: '#09090c',
        card: '#121216',
        text: '#f3f4f6',
        border: '#272732',
        primary: '#bb86fc',
    },
};

export default function App() {
    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <ToastProvider>
                    <AuthProvider>
                        <NavigationContainer theme={navTheme}>
                            <AppNavigator />
                            <StatusBar style="light" />
                        </NavigationContainer>
                    </AuthProvider>
                </ToastProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
