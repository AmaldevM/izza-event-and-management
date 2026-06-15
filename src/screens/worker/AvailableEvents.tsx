// Worker Available Events Screen - Minimalist Dark Mode with swipe-to-action gestures

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { getWorkerAssignments, updateAssignmentStatus } from '../../services/assignmentService';
import { EventAssignment } from '../../types';
import { useToast } from '../../components/Toast';
import PressableScale from '../../components/PressableScale';
import SwipeableRow from '../../components/SwipeableRow';

const AvailableEvents = ({ navigation }: any) => {
    const theme = useTheme();
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();
    const [assignments, setAssignments] = useState<EventAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAvailableWork = async () => {
        if (!user) return;
        try {
            const list = await getWorkerAssignments(user.id);
            // Filter assignments that are in 'assigned' status (pending worker accept/decline)
            const available = list.filter(a => a.status === 'assigned');
            available.sort((a, b) => a.eventDate.seconds - b.eventDate.seconds);
            setAssignments(available);
        } catch (error) {
            console.error('Error fetching available work:', error);
            showError('Failed to retrieve available work requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchAvailableWork();
        });
        return unsubscribe;
    }, [navigation, user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAvailableWork();
    };

    const handleAcceptGig = async (assignmentId: string) => {
        try {
            await updateAssignmentStatus(assignmentId, 'accepted');
            showSuccess('Gig accepted! 🎉');
            fetchAvailableWork();
        } catch (error) {
            showError('Failed to accept gig');
        }
    };

    const handleDeclineGig = async (assignmentId: string) => {
        try {
            await updateAssignmentStatus(assignmentId, 'declined');
            showSuccess('Gig declined ❌');
            fetchAvailableWork();
        } catch (error) {
            showError('Failed to decline gig');
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>Searching for available gigs...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={assignments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
                renderItem={({ item }) => (
                    <SwipeableRow
                        leftActionText="Accept"
                        leftActionColor="#10b981"
                        onSwipeRightOpen={() => handleAcceptGig(item.id)}
                        rightActionText="Decline"
                        rightActionColor="#ef4444"
                        onSwipeLeftOpen={() => handleDeclineGig(item.id)}
                    >
                        <PressableScale
                            onPress={() => navigation.navigate('EventDetails', { eventId: item.eventId })}
                        >
                            <Card
                                style={[styles.card, { backgroundColor: theme.colors.surface }]}
                                elevation={1}
                            >
                                <Card.Content style={styles.cardContent}>
                                    <View style={styles.cardLeft}>
                                        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface, fontWeight: 'bold' }]}>{item.eventTitle}</Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                                            📅 {item.eventDate.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 2 }}>
                                            💰 Payout: ₹{item.payoutAmount}
                                        </Text>
                                    </View>
                                    <Chip
                                        mode="flat"
                                        style={{ backgroundColor: theme.colors.primaryContainer + '20' }}
                                        textStyle={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 10 }}
                                    >
                                        NEW REQUEST
                                    </Chip>
                                </Card.Content>
                            </Card>
                        </PressableScale>
                    </SwipeableRow>
                )}
                ListEmptyComponent={
                    <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content>
                            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>No new event requests available right now.</Text>
                            <Text style={[styles.emptySubText, { color: theme.colors.onSurfaceVariant }]}>You will receive notifications when the Admin assigns you to new events.</Text>
                        </Card.Content>
                    </Card>
                }
            />
        </View>
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
    list: {
        padding: 16,
    },
    card: {
        marginBottom: 12,
        borderRadius: 12,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLeft: {
        flex: 1,
    },
    title: {
        fontWeight: 'bold',
    },
    emptyCard: {
        padding: 24,
        alignItems: 'center',
        borderRadius: 12,
    },
    emptyText: {
        fontWeight: 'bold',
        fontSize: 15,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 18,
    },
});

export default AvailableEvents;
