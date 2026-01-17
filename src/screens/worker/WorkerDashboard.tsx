// Worker Dashboard

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Avatar } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const WorkerDashboard = () => {
    const { user, logout } = useAuth();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Avatar.Icon size={60} icon="worker" />
                <Text variant="headlineMedium" style={styles.title}>
                    Worker Dashboard
                </Text>
                <Text variant="bodyLarge">Welcome, {user?.name}</Text>
                <Button mode="text" onPress={logout}>
                    Logout
                </Button>
            </View>

            <View style={styles.content}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge">My Work</Text>
                        <Text variant="bodyMedium" style={styles.description}>
                            View assigned events, mark attendance, and track earnings.
                        </Text>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, backgroundColor: '#388e3c', alignItems: 'center' },
    title: { color: '#fff', fontWeight: 'bold', marginTop: 8 },
    content: { padding: 20 },
    card: { marginBottom: 16 },
    description: { marginTop: 8, color: '#666' },
});

export default WorkerDashboard;
