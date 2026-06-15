// User Dashboard Screen - Minimalist Dark Mode with tactile micro-interactions

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, Avatar, Surface, ActivityIndicator, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { getEventsByUserId } from '../../services/eventService';
import { useToast } from '../../components/Toast';
import { Event } from '../../types';
import PressableScale from '../../components/PressableScale';

const UserDashboard = ({ navigation }: any) => {
    const theme = useTheme();
    const { user, logout } = useAuth();
    const { showError } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEvents = async () => {
        if (!user) return;
        try {
            const fetchedEvents = await getEventsByUserId(user.id);
            setEvents(fetchedEvents);
        } catch (err: any) {
            showError('Failed to load events. Pull down to refresh.');
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

    // Calculate event statistics
    const pendingEvents = events.filter((e) => e.status === 'pending').length;
    const approvedEvents = events.filter((e) => ['approved', 'assigned', 'in progress'].includes(e.status)).length;
    const completedEvents = events.filter((e) => e.status === 'completed').length;

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
            }
        >
            {/* Header / User Profile card */}
            <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <View style={styles.headerContent}>
                    <Avatar.Icon
                        size={52}
                        icon="account"
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        color={theme.colors.primary}
                    />
                    <View style={styles.userInfo}>
                        <Text variant="titleLarge" style={[styles.userName, { color: theme.colors.onSurface }]}>
                            {user?.name}
                        </Text>
                        <Text variant="bodyMedium" style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
                            {user?.email}
                        </Text>
                    </View>
                </View>
                <Button
                    mode="outlined"
                    onPress={logout}
                    style={[styles.logoutButton, { borderColor: theme.colors.outline }]}
                    textColor={theme.colors.primary}
                >
                    Sign Out
                </Button>
            </Surface>

            {/* Statistics */}
            <View style={styles.statsContainer}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Event Statistics
                </Text>

                <View style={styles.statsGrid}>
                    <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content style={styles.statCardContent}>
                            <View style={[styles.accentLine, { backgroundColor: '#eab308' }]} />
                            <Text variant="headlineMedium" style={{ color: '#eab308', fontWeight: 'bold' }}>
                                {pendingEvents}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Pending</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content style={styles.statCardContent}>
                            <View style={[styles.accentLine, { backgroundColor: '#10b981' }]} />
                            <Text variant="headlineMedium" style={{ color: '#10b981', fontWeight: 'bold' }}>
                                {approvedEvents}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Approved</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content style={styles.statCardContent}>
                            <View style={[styles.accentLine, { backgroundColor: '#3b82f6' }]} />
                            <Text variant="headlineMedium" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                {completedEvents}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Completed</Text>
                        </Card.Content>
                    </Card>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Quick Actions
                </Text>

                <View style={styles.actionGrid}>
                    <PressableScale style={styles.actionPressable} onPress={() => navigation.navigate('Request Event')}>
                        <Button
                            mode="contained"
                            icon="calendar-plus"
                            onPress={() => navigation.navigate('Request Event')}
                            buttonColor={theme.colors.primary}
                            textColor={theme.colors.onPrimary}
                            style={styles.actionButton}
                        >
                            Request Event
                        </Button>
                    </PressableScale>

                    <PressableScale style={styles.actionPressable} onPress={() => navigation.navigate('My Events')}>
                        <Button
                            mode="outlined"
                            icon="calendar-month"
                            onPress={() => navigation.navigate('My Events')}
                            textColor={theme.colors.primary}
                            style={[styles.actionButton, { borderColor: theme.colors.outline }]}
                        >
                            My Events
                        </Button>
                    </PressableScale>
                </View>
            </View>

            {/* Recent Events */}
            <View style={styles.recentContainer}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Recent Event Requests
                </Text>

                {events.slice(0, 3).map((event) => (
                    <PressableScale
                        key={event.id}
                        onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
                    >
                        <Card style={[styles.eventCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                            <Card.Content style={styles.eventCardContent}>
                                <View style={styles.eventInfo}>
                                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                                        {event.title}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                                        📍 {event.location}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                        📅 {event.eventDate.toDate().toLocaleDateString()}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor:
                                                event.status === 'completed'
                                                    ? 'rgba(59, 130, 246, 0.15)'
                                                    : event.status === 'approved' || event.status === 'assigned'
                                                    ? 'rgba(16, 185, 129, 0.15)'
                                                    : 'rgba(234, 179, 8, 0.15)',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            {
                                                color:
                                                    event.status === 'completed'
                                                        ? '#3b82f6'
                                                        : event.status === 'approved' || event.status === 'assigned'
                                                        ? '#10b981'
                                                        : '#eab308',
                                            },
                                        ]}
                                    >
                                        {event.status.toUpperCase()}
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>
                    </PressableScale>
                ))}

                {events.length === 0 && (
                    <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content>
                            <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                                No event requests found. Tap "Request Event" to get started.
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
    },
    header: {
        padding: 24,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        gap: 16,
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
    userEmail: {
        fontSize: 14,
    },
    logoutButton: {
        alignSelf: 'flex-start',
        borderRadius: 8,
    },
    statsContainer: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    sectionTitle: {
        marginBottom: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statCardContent: {
        paddingTop: 16,
        paddingBottom: 12,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    accentLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    actionsContainer: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionPressable: {
        flex: 1,
    },
    actionButton: {
        borderRadius: 8,
        width: '100%',
    },
    recentContainer: {
        padding: 24,
    },
    eventCard: {
        marginBottom: 12,
        borderRadius: 12,
    },
    eventCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    eventInfo: {
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    emptyCard: {
        borderRadius: 12,
        paddingVertical: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default UserDashboard;
