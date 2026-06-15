// Login Screen

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { LoginFormData } from '../../types';

const LoginScreen = ({ navigation }: any) => {
    const { login } = useAuth();
    const { showError, showSuccess } = useToast();
    const [formData, setFormData] = useState<LoginFormData>({
        emailOrPhone: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!formData.emailOrPhone || !formData.password) {
            showError('Please fill in all fields');
            return;
        }

        const isEmail = formData.emailOrPhone.includes('@');
        const isPhone = /^\+?[0-9]{10,15}$/.test(formData.emailOrPhone.replace(/[\s-()]/g, ''));

        if (!isEmail && !isPhone) {
            showError('Please enter a valid email address or phone number');
            return;
        }

        try {
            setLoading(true);
            await login(formData);
            showSuccess('Welcome back! 👋');
        } catch (err: any) {
            showError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Image
                        source={require('../../../assets/app-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text variant="displaySmall" style={styles.title}>
                        IZZA Catering
                    </Text>
                    <Text variant="titleMedium" style={styles.subtitle}>
                        Event Management System
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Email or Phone Number"
                        value={formData.emailOrPhone}
                        onChangeText={(text) => setFormData({ ...formData, emailOrPhone: text })}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        left={<TextInput.Icon icon="account" />}
                    />

                    <TextInput
                        label="Password"
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        left={<TextInput.Icon icon="lock" />}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? 'eye-off' : 'eye'}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        }
                    />

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                    >
                        Login
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => navigation.navigate('Register')}
                        style={styles.linkButton}
                    >
                        Don't have an account? Register
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 10,
    },
    title: {
        fontWeight: 'bold',
        color: '#6200ee',
        marginBottom: 8,
    },
    subtitle: {
        color: '#666',
    },
    form: {
        width: '100%',
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        paddingVertical: 6,
    },
    linkButton: {
        marginTop: 16,
    },
});

export default LoginScreen;

