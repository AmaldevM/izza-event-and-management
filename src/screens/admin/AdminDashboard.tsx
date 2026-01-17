// Admin Dashboard - Overview of all system activities

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Avatar } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
    const { user, logout } = useAuth();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Avatar.Icon size={60} icon="shield-account" />
                <Text variant="headlineMedium" style={styles.title}>
                    Admin Dashboard
                </Text>
                <Text variant="bodyLarge">Welcome, {user?.name}</Text>
                <Button mode="text" onPress={logout}>
                    Logout
                </Button>
            </View>

            <View style={styles.content}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge">System Overview</Text>
                        <Text variant="bodyMedium" style={styles.description}>
                            Manage events, assign workers, track attendance and payments.
                        </Text>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, backgroundColor: '#d32f2f', alignItems: 'center' },
    title: { color: '#fff', fontWeight: 'bold', marginTop: 8 },
    content: { padding: 20 },
    card: { marginBottom: 16 },
    description: { marginTop: 8, color: '#666' },
});

export default AdminDashboard;
