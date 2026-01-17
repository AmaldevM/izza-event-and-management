// User Dashboard Screen

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, Avatar, Surface } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { getEventsByUserId } from '../../services/eventService';
import { Event } from '../../types';

const UserDashboard = ({ navigation }: any) => {
    const { user, logout } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEvents = async () => {
        if (!user) return;
        try {
            const userEvents = await getEventsByUserId(user.id);
            setEvents(userEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const pendingEvents = events.filter(e => e.status === 'pending').length;
    const approvedEvents = events.filter(e => e.status === 'approved').length;
    const completedEvents = events.filter(e => e.status === 'completed').length;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Surface style={styles.header}>
                <View style={styles.headerContent}>
                    <Avatar.Icon size={60} icon="account" style={styles.avatar} />
                    <View style={styles.userInfo}>
                        <Text variant="headlineSmall" style={styles.userName}>
                            {user?.name}
                        </Text>
                        <Text variant="bodyMedium" style={styles.userEmail}>
                            {user?.email}
                        </Text>
                    </View>
                </View>
                <Button mode="text" onPress={logout} style={styles.logoutButton}>
                    Logout
                </Button>
            </Surface>

            <View style={styles.statsContainer}>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                    Event Statistics
                </Text>

                <View style={styles.statsGrid}>
                    <Card style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
                        <Card.Content>
                            <Text variant="displaySmall" style={{ color: '#f57c00', fontWeight: 'bold' }}>
                                {pendingEvents}
                            </Text>
                            <Text variant="bodyMedium">Pending</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
                        <Card.Content>
                            <Text variant="displaySmall" style={{ color: '#388e3c', fontWeight: 'bold' }}>
                                {approvedEvents}
                            </Text>
                            <Text variant="bodyMedium">Approved</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
                        <Card.Content>
                            <Text variant="displaySmall" style={{ color: '#1976d2', fontWeight: 'bold' }}>
                                {completedEvents}
                            </Text>
                            <Text variant="bodyMedium">Completed</Text>
                        </Card.Content>
                    </Card>
                </View>
            </View>

            <View style={styles.actionsContainer}>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                    Quick Actions
                </Text>

                <Button
                    mode="contained"
                    icon="calendar-plus"
                    onPress={() => navigation.navigate('Request Event')}
                    style={styles.actionButton}
                >
                    Request New Event
                </Button>

                <Button
                    mode="outlined"
                    icon="calendar-month"
                    onPress={() => navigation.navigate('My Events')}
                    style={styles.actionButton}
                >
                    View My Events
                </Button>
            </View>

            <View style={styles.recentContainer}>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                    Recent Events
                </Text>

                {events.slice(0, 3).map((event) => (
                    <Card key={event.id} style={styles.eventCard}>
                        <Card.Content>
                            <Text variant="titleMedium">{event.title}</Text>
                            <Text variant="bodySmall" style={styles.eventLocation}>
                                📍 {event.location}
                            </Text>
                            <Text variant="bodySmall" style={styles.eventDate}>
                                📅 {event.eventDate.toDate().toLocaleDateString()}
                            </Text>
                            <View style={styles.statusBadge}>
                                <Text
                                    style={[
                                        styles.statusText,
                                        { color: event.status === 'approved' ? '#388e3c' : '#f57c00' },
                                    ]}
                                >
                                    {event.status.toUpperCase()}
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>
                ))}

                {events.length === 0 && (
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text variant="bodyLarge" style={{ textAlign: 'center', color: '#666' }}>
                                No events yet. Request your first event!
                            </Text>
                        </Card.Content>
                    </Card>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#6200ee',
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        backgroundColor: '#fff',
    },
    userInfo: {
        marginLeft: 16,
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontWeight: 'bold',
    },
    userEmail: {
        color: '#e0e0e0',
    },
    logoutButton: {
        alignSelf: 'flex-start',
    },
    statsContainer: {
        padding: 20,
    },
    sectionTitle: {
        marginBottom: 16,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        marginHorizontal: 4,
        elevation: 2,
    },
    actionsContainer: {
        padding: 20,
    },
    actionButton: {
        marginBottom: 12,
    },
    recentContainer: {
        padding: 20,
    },
    eventCard: {
        marginBottom: 12,
        elevation: 2,
    },
    eventLocation: {
        color: '#666',
        marginTop: 4,
    },
    eventDate: {
        color: '#666',
        marginTop: 2,
    },
    statusBadge: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyCard: {
        padding: 20,
        elevation: 2,
    },
});

export default UserDashboard;
