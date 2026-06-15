// Login Screen - Minimalist Dark Mode with tactile micro-interactions

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { LoginFormData } from '../../types';
import PressableScale from '../../components/PressableScale';

const LoginScreen = ({ navigation }: any) => {
    const theme = useTheme();
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
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Image
                        source={require('../../../assets/app-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
                        IZZA
                    </Text>
                    <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Event & Catering Management
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Email or Phone Number"
                        value={formData.emailOrPhone}
                        onChangeText={(text) => setFormData({ ...formData, emailOrPhone: text })}
                        mode="flat"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={[styles.input, { backgroundColor: theme.colors.surface }]}
                        left={<TextInput.Icon icon="account-outline" />}
                        activeUnderlineColor={theme.colors.primary}
                    />

                    <TextInput
                        label="Password"
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        mode="flat"
                        secureTextEntry={!showPassword}
                        style={[styles.input, { backgroundColor: theme.colors.surface }]}
                        left={<TextInput.Icon icon="lock-outline" />}
                        activeUnderlineColor={theme.colors.primary}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        }
                    />

                    <PressableScale style={styles.buttonWrapper}>
                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            buttonColor={theme.colors.primary}
                            textColor={theme.colors.onPrimary}
                        >
                            Sign In
                        </Button>
                    </PressableScale>

                    <PressableScale>
                        <Button
                            mode="text"
                            onPress={() => navigation.navigate('Register')}
                            style={styles.linkButton}
                            textColor={theme.colors.primary}
                        >
                            Create a new account
                        </Button>
                    </PressableScale>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        width: 110,
        height: 110,
        marginBottom: 16,
    },
    title: {
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 6,
    },
    subtitle: {
        letterSpacing: 0.5,
        fontWeight: '300',
    },
    form: {
        width: '100%',
        gap: 8,
    },
    input: {
        marginBottom: 12,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    buttonWrapper: {
        marginTop: 16,
    },
    button: {
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    linkButton: {
        marginTop: 8,
    },
});

export default LoginScreen;
