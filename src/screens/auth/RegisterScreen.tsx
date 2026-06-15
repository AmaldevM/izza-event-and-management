// Register Screen - Minimalist Dark Mode with tactile micro-interactions

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, useTheme } from 'react-native-paper';
import { useToast } from '../../components/Toast';
import { RegisterFormData, UserRole } from '../../types';
import { sendOtpEmail } from '../../services/otpService';
import PressableScale from '../../components/PressableScale';

const RegisterScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { showError, showSuccess, showWarning } = useToast();
    const [formData, setFormData] = useState<RegisterFormData>({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        role: 'user',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        if (!formData.email || !formData.password || !formData.name || !formData.phone) {
            showWarning('Please fill in all required fields');
            return;
        }

        if (!formData.email.includes('@')) {
            showError('Please enter a valid email address');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            showError('Passwords do not match. Please check and try again.');
            return;
        }

        if (formData.password.length < 6) {
            showWarning('Password must be at least 6 characters long');
            return;
        }

        if (formData.phone.length < 10) {
            showWarning('Please enter a valid phone number');
            return;
        }

        try {
            setLoading(true);
            await sendOtpEmail(formData.email);
            showSuccess('Verification code sent to your email! 📧');
            navigation.navigate('OtpVerification', {
                email: formData.email,
                formData: formData,
            });
        } catch (err: any) {
            showError(err.message || 'Registration failed. Please try again.');
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
                    <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.primary }]}>
                        Create Account
                    </Text>
                    <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Join the IZZA Catering platform
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                        I want to join as:
                    </Text>
                    <SegmentedButtons
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                        buttons={[
                            { value: 'user', label: 'Customer' },
                            { value: 'worker', label: 'Catering Staff' },
                        ]}
                        style={styles.roleSelector}
                        theme={{
                            colors: {
                                secondaryContainer: theme.colors.primaryContainer,
                                onSecondaryContainer: theme.colors.primary,
                            }
                        }}
                    />

                    <TextInput
                        label="Full Name"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        mode="flat"
                        style={[styles.input, { backgroundColor: theme.colors.surface }]}
                        left={<TextInput.Icon icon="account-outline" />}
                        activeUnderlineColor={theme.colors.primary}
                    />

                    <TextInput
                        label="Email Address"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        mode="flat"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={[styles.input, { backgroundColor: theme.colors.surface }]}
                        left={<TextInput.Icon icon="email-outline" />}
                        activeUnderlineColor={theme.colors.primary}
                    />

                    <TextInput
                        label="Phone Number"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        mode="flat"
                        keyboardType="phone-pad"
                        style={[styles.input, { backgroundColor: theme.colors.surface }]}
                        left={<TextInput.Icon icon="phone-outline" />}
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

                    <TextInput
                        label="Confirm Password"
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                        mode="flat"
                        secureTextEntry={!showPassword}
                        style={[styles.input, { backgroundColor: theme.colors.surface }]}
                        left={<TextInput.Icon icon="lock-check-outline" />}
                        activeUnderlineColor={theme.colors.primary}
                    />

                    <PressableScale style={styles.buttonWrapper}>
                        <Button
                            mode="contained"
                            onPress={handleRegister}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            buttonColor={theme.colors.primary}
                            textColor={theme.colors.onPrimary}
                        >
                            Send Verification OTP
                        </Button>
                    </PressableScale>

                    <PressableScale>
                        <Button
                            mode="text"
                            onPress={() => navigation.navigate('Login')}
                            style={styles.linkButton}
                            textColor={theme.colors.primary}
                        >
                            Already have an account? Sign In
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
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    title: {
        fontWeight: '900',
        marginBottom: 6,
    },
    subtitle: {
        fontWeight: '300',
    },
    form: {
        width: '100%',
        gap: 6,
    },
    sectionTitle: {
        marginBottom: 8,
        fontWeight: '600',
    },
    roleSelector: {
        marginBottom: 20,
    },
    input: {
        marginBottom: 10,
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

export default RegisterScreen;
