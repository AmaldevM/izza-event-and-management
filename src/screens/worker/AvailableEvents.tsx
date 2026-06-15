import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Chip, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { getWorkerAssignments } from '../../services/assignmentService';
import { EventAssignment } from '../../types';

const AvailableEvents = ({ navigation }: any) => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<EventAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAvailableWork = async () => {
        if (!user) return;
        try {
            const list = await getWorkerAssignments(user.id);
            // Filter assignments that are in 'assigned' status (pending worker accept/decline)
            const available = list.filter(a => a.status === 'assigned');
            // Sort by event date
            available.sort((a, b) => a.eventDate.seconds - b.eventDate.seconds);
            setAssignments(available);
        } catch (error) {
            console.error('Error fetching available work:', error);
            Alert.alert('Error', 'Failed to retrieve available work requests');
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#388e3c" />
                <Text style={styles.loadingText}>Searching for available gigs...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={assignments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <Card
                        style={styles.card}
                        onPress={() => navigation.navigate('EventDetails', { eventId: item.eventId })}
                    >
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.cardLeft}>
                                <Text variant="titleMedium" style={styles.title}>{item.eventTitle}</Text>
                                <Text variant="bodySmall" style={styles.meta}>
                                    📅 {item.eventDate.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </Text>
                                <Text variant="bodySmall" style={styles.meta}>
                                    💰 Payout: ₹{item.payoutAmount}
                                </Text>
                            </View>
                            <Chip
                                mode="flat"
                                style={styles.statusChip}
                                textStyle={styles.statusChipText}
                            >
                                NEW REQUEST
                            </Chip>
                        </Card.Content>
                    </Card>
                )}
                ListEmptyComponent={
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text style={styles.emptyText}>No new event requests available right now.</Text>
                            <Text style={styles.emptySubText}>You will receive notifications when the Admin assigns you to new events.</Text>
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
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
    },
    list: {
        padding: 12,
    },
    card: {
        marginBottom: 10,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#fff',
        borderLeftWidth: 4,
        borderLeftColor: '#ef6c00', // orange indicating action needed
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
        color: '#222',
    },
    meta: {
        color: '#666',
        marginTop: 4,
    },
    statusChip: {
        backgroundColor: '#fff3e0',
        borderColor: '#ef6c00',
    },
    statusChipText: {
        color: '#e65100',
        fontWeight: 'bold',
        fontSize: 10,
    },
    emptyCard: {
        padding: 24,
        alignItems: 'center',
        elevation: 1,
        backgroundColor: '#fff',
    },
    emptyText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 15,
        textAlign: 'center',
    },
    emptySubText: {
        color: '#888',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 18,
    },
});

export default AvailableEvents;
