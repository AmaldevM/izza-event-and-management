// Admin Dashboard Screen - Minimalist Dark Mode with tactile micro-interactions

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Avatar, Surface, Portal, Dialog, TextInput, ActivityIndicator, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { broadcastToWorkers } from '../../services/notificationService';
import { Event } from '../../types';
import PressableScale from '../../components/PressableScale';

const AdminDashboard = ({ navigation }: any) => {
    const theme = useTheme();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Stats state
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalWorkers: 0,
        totalEvents: 0,
        pendingApprovals: 0,
        completedEvents: 0,
        upcomingEvents: 0,
        totalPaid: 0,
        totalPendingPayouts: 0,
    });

    const [pendingEvents, setPendingEvents] = useState<Event[]>([]);

    // Broadcast state
    const [broadcastVisible, setBroadcastVisible] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastLoading, setBroadcastLoading] = useState(false);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Users
            const usersSnapshot = await getDocs(collection(db, 'users'));
            let usersCount = 0;
            let workersCount = 0;
            usersSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.role === 'user') usersCount++;
                else if (data.role === 'worker') workersCount++;
            });

            // 2. Fetch Events
            const eventsSnapshot = await getDocs(collection(db, 'events'));
            let eventsCount = 0;
            let pendingCount = 0;
            let completedCount = 0;
            let upcomingCount = 0;
            const pendingList: Event[] = [];
            const now = Timestamp.now().toDate();

            eventsSnapshot.forEach(docSnapshot => {
                const eventData = { id: docSnapshot.id, ...docSnapshot.data() } as Event;
                eventsCount++;
                if (eventData.status === 'pending') {
                    pendingCount++;
                    pendingList.push(eventData);
                } else if (eventData.status === 'completed') {
                    completedCount++;
                } else if (eventData.status === 'approved') {
                    const eventDate = eventData.eventDate.toDate();
                    if (eventDate >= now) {
                        upcomingCount++;
                    }
                }
            });

            // Sort pending events by date
            pendingList.sort((a, b) => a.eventDate.seconds - b.eventDate.seconds);
            setPendingEvents(pendingList);

            // 3. Fetch Payments
            const paymentsSnapshot = await getDocs(collection(db, 'payments'));
            let paidSum = 0;
            let pendingSum = 0;
            paymentsSnapshot.forEach(doc => {
                const paymentData = doc.data();
                if (paymentData.status === 'paid') {
                    paidSum += paymentData.amount || 0;
                } else {
                    pendingSum += paymentData.amount || 0;
                }
            });

            setStats({
                totalUsers: usersCount,
                totalWorkers: workersCount,
                totalEvents: eventsCount,
                pendingApprovals: pendingCount,
                completedEvents: completedCount,
                upcomingEvents: upcomingCount,
                totalPaid: paidSum,
                totalPendingPayouts: pendingSum,
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            Alert.alert('Error', 'Failed to retrieve system statistics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleSendBroadcast = async () => {
        if (!broadcastTitle || !broadcastMessage) {
            Alert.alert('Validation Error', 'Please enter a title and message');
            return;
        }

        try {
            setBroadcastLoading(true);
            await broadcastToWorkers(broadcastTitle, broadcastMessage);
            Alert.alert('Success', 'Broadcast notification sent to all workers');
            setBroadcastTitle('');
            setBroadcastMessage('');
            setBroadcastVisible(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to send broadcast');
        } finally {
            setBroadcastLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>Loading statistics...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        >
            {/* Header section */}
            <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <View style={styles.headerContent}>
                    <Avatar.Icon size={52} icon="shield-account" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
                    <View style={styles.userInfo}>
                        <Text variant="titleLarge" style={[styles.userName, { color: theme.colors.onSurface }]}>
                            {user?.name}
                        </Text>
                        <Text variant="bodySmall" style={[styles.userRole, { color: theme.colors.primary }]}>
                            SYSTEM ADMINISTRATOR
                        </Text>
                    </View>
                    <Button mode="outlined" onPress={logout} style={[styles.logoutButton, { borderColor: theme.colors.outline }]} textColor={theme.colors.primary}>
                        Sign Out
                    </Button>
                </View>
            </Surface>

            <View style={styles.content}>
                {/* Stats Grid */}
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>System Summary</Text>
                
                <View style={styles.grid}>
                    <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content style={styles.statContent}>
                            <View style={[styles.accentLine, { backgroundColor: '#3b82f6' }]} />
                            <Text variant="headlineMedium" style={[styles.statNumber, { color: '#3b82f6' }]}>
                                {stats.totalUsers}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Customers</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content style={styles.statContent}>
                            <View style={[styles.accentLine, { backgroundColor: '#10b981' }]} />
                            <Text variant="headlineMedium" style={[styles.statNumber, { color: '#10b981' }]}>
                                {stats.totalWorkers}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Workers</Text>
                        </Card.Content>
                    </Card>
                </View>

                <View style={styles.grid}>
                    <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content style={styles.statContent}>
                            <View style={[styles.accentLine, { backgroundColor: '#eab308' }]} />
                            <Text variant="headlineMedium" style={[styles.statNumber, { color: '#eab308' }]}>
                                {stats.pendingApprovals}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Pending Approval</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content style={styles.statContent}>
                            <View style={[styles.accentLine, { backgroundColor: '#a855f7' }]} />
                            <Text variant="headlineMedium" style={[styles.statNumber, { color: '#a855f7' }]}>
                                {stats.upcomingEvents}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Upcoming Events</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Financial Summary */}
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Financials</Text>
                <Card style={[styles.financeCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <Card.Content style={styles.financeGrid}>
                        <View style={styles.financeItem}>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>Total Paid Payouts</Text>
                            <Text variant="titleLarge" style={{ color: '#10b981', fontWeight: 'bold' }}>
                                ₹{stats.totalPaid}
                            </Text>
                        </View>
                        <View style={[styles.financeDivider, { backgroundColor: theme.colors.outline }]} />
                        <View style={styles.financeItem}>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>Pending Payouts</Text>
                            <Text variant="titleLarge" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                ₹{stats.totalPendingPayouts}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Quick Actions */}
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Quick Management</Text>
                <View style={styles.actionsRow}>
                    <PressableScale style={styles.actionPressable} onPress={() => setBroadcastVisible(true)}>
                        <Button
                            mode="contained"
                            icon="bullhorn-outline"
                            buttonColor={theme.colors.primary}
                            textColor={theme.colors.onPrimary}
                            style={styles.actionButton}
                            onPress={() => setBroadcastVisible(true)}
                        >
                            Broadcast
                        </Button>
                    </PressableScale>
                    
                    <PressableScale style={styles.actionPressable} onPress={() => navigation.navigate('Events')}>
                        <Button
                            mode="outlined"
                            icon="calendar-text-outline"
                            textColor={theme.colors.primary}
                            style={[styles.actionButton, { borderColor: theme.colors.outline }]}
                            onPress={() => navigation.navigate('Events')}
                        >
                            Events
                        </Button>
                    </PressableScale>
                </View>

                {/* Pending Requests List */}
                <View style={styles.headerRow}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Pending Approvals</Text>
                    <Button mode="text" onPress={() => navigation.navigate('Events')} textColor={theme.colors.primary}>View All</Button>
                </View>

                {pendingEvents.length === 0 ? (
                    <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content>
                            <Text style={{ color: theme.colors.onSurfaceVariant }}>No pending event requests to approve.</Text>
                        </Card.Content>
                    </Card>
                ) : (
                    pendingEvents.slice(0, 3).map(event => (
                        <PressableScale
                            key={event.id}
                            onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
                        >
                            <Card
                                style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}
                                elevation={1}
                            >
                                <Card.Content>
                                    <View style={styles.eventHeader}>
                                        <Text variant="titleMedium" style={[styles.eventTitle, { color: theme.colors.onSurface }]}>{event.title}</Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>By: {event.userName}</Text>
                                    </View>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                                        📅 {event.eventDate.toDate().toLocaleDateString()}  |  📍 {event.location}
                                    </Text>
                                </Card.Content>
                            </Card>
                        </PressableScale>
                    ))
                )}
            </View>

            {/* Broadcast announcement portal */}
            <Portal>
                <Dialog visible={broadcastVisible} onDismiss={() => setBroadcastVisible(false)} style={{ backgroundColor: theme.colors.surface }}>
                    <Dialog.Title style={{ color: theme.colors.onSurface }}>Send Workers Broadcast</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Announcement Title"
                            value={broadcastTitle}
                            onChangeText={setBroadcastTitle}
                            mode="flat"
                            style={[styles.broadcastInput, { backgroundColor: theme.colors.surface }]}
                            activeUnderlineColor={theme.colors.primary}
                        />
                        <TextInput
                            label="Message Content"
                            value={broadcastMessage}
                            onChangeText={setBroadcastMessage}
                            mode="flat"
                            multiline
                            numberOfLines={4}
                            style={[styles.broadcastInput, { backgroundColor: theme.colors.surface }]}
                            activeUnderlineColor={theme.colors.primary}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setBroadcastVisible(false)} disabled={broadcastLoading} textColor={theme.colors.onSurfaceVariant}>Cancel</Button>
                        <Button
                            onPress={handleSendBroadcast}
                            loading={broadcastLoading}
                            disabled={broadcastLoading}
                            textColor={theme.colors.primary}
                        >
                            Send
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
    },
    header: {
        padding: 24,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        marginLeft: 16,
        flex: 1,
    },
    userName: {
        fontWeight: 'bold',
    },
    userRole: {
        fontWeight: 'bold',
        fontSize: 11,
        letterSpacing: 1,
    },
    logoutButton: {
        borderRadius: 8,
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontWeight: '700',
        marginVertical: 12,
    },
    grid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statContent: {
        paddingVertical: 16,
        alignItems: 'center',
        position: 'relative',
    },
    accentLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    statNumber: {
        fontWeight: 'bold',
    },
    financeCard: {
        borderRadius: 12,
        marginBottom: 12,
    },
    financeGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 4,
    },
    financeItem: {
        alignItems: 'center',
        flex: 1,
    },
    financeDivider: {
        width: 1,
        height: 40,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionPressable: {
        flex: 1,
    },
    actionButton: {
        width: '100%',
        borderRadius: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    emptyCard: {
        borderRadius: 12,
        alignItems: 'center',
        paddingVertical: 20,
    },
    eventCard: {
        marginBottom: 12,
        borderRadius: 12,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    eventTitle: {
        fontWeight: 'bold',
    },
    broadcastInput: {
        marginBottom: 12,
    },
});

export default AdminDashboard;
