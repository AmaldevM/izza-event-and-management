// Register Screen

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { TextInput, Button, Text, Snackbar, SegmentedButtons } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { RegisterFormData, UserRole } from '../../types';

const RegisterScreen = ({ navigation }: any) => {
    const { register } = useAuth();
    const [formData, setFormData] = useState<RegisterFormData>({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        role: 'user',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        if (!formData.email || !formData.password || !formData.name || !formData.phone) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await register(formData);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
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
                    <Text variant="headlineMedium" style={styles.title}>
                        Create Account
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Join IZZA Catering System
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text variant="labelLarge" style={styles.sectionTitle}>
                        Account Type
                    </Text>
                    <SegmentedButtons
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                        buttons={[
                            { value: 'user', label: 'User' },
                            { value: 'worker', label: 'Worker' },
                        ]}
                        style={styles.roleSelector}
                    />

                    <TextInput
                        label="Full Name"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        mode="outlined"
                        style={styles.input}
                        left={<TextInput.Icon icon="account" />}
                    />

                    <TextInput
                        label="Email"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        left={<TextInput.Icon icon="email" />}
                    />

                    <TextInput
                        label="Phone Number"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        mode="outlined"
                        keyboardType="phone-pad"
                        style={styles.input}
                        left={<TextInput.Icon icon="phone" />}
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

                    <TextInput
                        label="Confirm Password"
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        left={<TextInput.Icon icon="lock-check" />}
                    />

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                    >
                        Register
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.linkButton}
                    >
                        Already have an account? Login
                    </Button>
                </View>
            </ScrollView>

            <Snackbar
                visible={!!error}
                onDismiss={() => setError('')}
                duration={3000}
                action={{
                    label: 'Close',
                    onPress: () => setError(''),
                }}
            >
                {error}
            </Snackbar>
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
        marginBottom: 30,
    },
    title: {
        fontWeight: 'bold',
        color: '#6200ee',
    },
    subtitle: {
        color: '#666',
        marginTop: 4,
    },
    form: {
        width: '100%',
    },
    sectionTitle: {
        marginBottom: 8,
        color: '#333',
    },
    roleSelector: {
        marginBottom: 20,
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

export default RegisterScreen;
