import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Avatar, Surface, Portal, Dialog, TextInput, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { broadcastToWorkers } from '../../services/notificationService';
import { Event } from '../../types';

const AdminDashboard = ({ navigation }: any) => {
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d32f2f" />
                <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header section */}
            <Surface style={styles.header}>
                <View style={styles.headerContent}>
                    <Avatar.Icon size={50} icon="shield-account" style={styles.avatar} />
                    <View style={styles.userInfo}>
                        <Text variant="titleLarge" style={styles.userName}>
                            {user?.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.userRole}>
                            SYSTEM ADMINISTRATOR
                        </Text>
                    </View>
                    <Button mode="outlined" textColor="#fff" onPress={logout} style={styles.logoutButton}>
                        Logout
                    </Button>
                </View>
            </Surface>

            <View style={styles.content}>
                {/* Stats Grid */}
                <Text variant="titleMedium" style={styles.sectionTitle}>System Summary</Text>
                <View style={styles.grid}>
                    <Card style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: '#1976d2' }]}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="displaySmall" style={[styles.statNumber, { color: '#1976d2' }]}>
                                {stats.totalUsers}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Customers</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: '#388e3c' }]}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="displaySmall" style={[styles.statNumber, { color: '#388e3c' }]}>
                                {stats.totalWorkers}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Workers</Text>
                        </Card.Content>
                    </Card>
                </View>

                <View style={styles.grid}>
                    <Card style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: '#ef6c00' }]}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="displaySmall" style={[styles.statNumber, { color: '#ef6c00' }]}>
                                {stats.pendingApprovals}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Pending Approval</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: '#7b1fa2' }]}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="displaySmall" style={[styles.statNumber, { color: '#7b1fa2' }]}>
                                {stats.upcomingEvents}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Upcoming Events</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Financial Summary */}
                <Text variant="titleMedium" style={styles.sectionTitle}>Financials</Text>
                <Card style={styles.financeCard}>
                    <Card.Content style={styles.financeGrid}>
                        <View style={styles.financeItem}>
                            <Text variant="bodyMedium" style={styles.financeLabel}>Total Paid Payouts</Text>
                            <Text variant="headlineSmall" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                ₹{stats.totalPaid}
                            </Text>
                        </View>
                        <View style={styles.financeDivider} />
                        <View style={styles.financeItem}>
                            <Text variant="bodyMedium" style={styles.financeLabel}>Pending Payouts</Text>
                            <Text variant="headlineSmall" style={{ color: '#c62828', fontWeight: 'bold' }}>
                                ₹{stats.totalPendingPayouts}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Quick Actions */}
                <Text variant="titleMedium" style={styles.sectionTitle}>Quick Management</Text>
                <View style={styles.actionsRow}>
                    <Button
                        mode="contained"
                        icon="bullhorn"
                        buttonColor="#d32f2f"
                        onPress={() => setBroadcastVisible(true)}
                        style={styles.actionButton}
                    >
                        Send Broadcast
                    </Button>
                    <Button
                        mode="contained"
                        icon="calendar"
                        buttonColor="#1976d2"
                        onPress={() => navigation.navigate('Events')}
                        style={styles.actionButton}
                    >
                        Event Manager
                    </Button>
                </View>

                {/* Pending Requests List */}
                <View style={styles.headerRow}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Pending Approvals</Text>
                    <Button mode="text" onPress={() => navigation.navigate('Events')}>View All</Button>
                </View>

                {pendingEvents.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text style={styles.emptyText}>No pending event requests to approve.</Text>
                        </Card.Content>
                    </Card>
                ) : (
                    pendingEvents.slice(0, 3).map(event => (
                        <Card
                            key={event.id}
                            style={styles.eventCard}
                            onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
                        >
                            <Card.Content>
                                <View style={styles.eventHeader}>
                                    <Text variant="titleMedium" style={styles.eventTitle}>{event.title}</Text>
                                    <Text variant="bodySmall" style={styles.eventUser}>By: {event.userName}</Text>
                                </View>
                                <Text variant="bodySmall" style={styles.eventDetails}>
                                    📅 {event.eventDate.toDate().toLocaleDateString()}  |  📍 {event.location}
                                </Text>
                            </Card.Content>
                        </Card>
                    ))
                )}
            </View>

            {/* Broadcast announcement portal */}
            <Portal>
                <Dialog visible={broadcastVisible} onDismiss={() => setBroadcastVisible(false)}>
                    <Dialog.Title>Send Workers Broadcast</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Announcement Title"
                            value={broadcastTitle}
                            onChangeText={setBroadcastTitle}
                            mode="outlined"
                            style={styles.broadcastInput}
                        />
                        <TextInput
                            label="Message Content"
                            value={broadcastMessage}
                            onChangeText={setBroadcastMessage}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            style={styles.broadcastInput}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setBroadcastVisible(false)} disabled={broadcastLoading}>Cancel</Button>
                        <Button
                            onPress={handleSendBroadcast}
                            loading={broadcastLoading}
                            disabled={broadcastLoading}
                            textColor="#d32f2f"
                        >
                            Send Broadcast
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
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
    },
    header: {
        padding: 16,
        backgroundColor: '#d32f2f',
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    userInfo: {
        marginLeft: 16,
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontWeight: 'bold',
    },
    userRole: {
        color: '#ffcdd2',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    logoutButton: {
        borderColor: '#fff',
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginVertical: 12,
        color: '#333',
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#fff',
    },
    statContent: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    statNumber: {
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#666',
        marginTop: 4,
    },
    financeCard: {
        borderRadius: 8,
        elevation: 2,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    financeGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    financeItem: {
        alignItems: 'center',
        flex: 1,
    },
    financeLabel: {
        color: '#666',
        marginBottom: 4,
    },
    financeDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e0e0e0',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    emptyCard: {
        padding: 16,
        borderRadius: 8,
        elevation: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    emptyText: {
        color: '#777',
    },
    eventCard: {
        marginBottom: 12,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#fff',
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    eventTitle: {
        fontWeight: 'bold',
        color: '#111',
    },
    eventUser: {
        color: '#666',
    },
    eventDetails: {
        color: '#666',
    },
    broadcastInput: {
        marginBottom: 12,
    },
});

export default AdminDashboard;
