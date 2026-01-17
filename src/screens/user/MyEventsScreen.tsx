// My Events Screen - Display user's event requests

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { getEventsByUserId } from '../../services/eventService';
import { Event } from '../../types';

const MyEventsScreen = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEvents = async () => {
        if (!user) return;
        try {
            const userEvents = await getEventsByUserId(user.id);
            setEvents(userEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return '#388e3c';
            case 'rejected':
                return '#d32f2f';
            case 'completed':
                return '#1976d2';
            default:
                return '#f57c00';
        }
    };

    const renderEvent = ({ item }: { item: Event }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.cardHeader}>
                    <Text variant="titleLarge" style={styles.eventTitle}>
                        {item.title}
                    </Text>
                    <Chip
                        mode="flat"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                        textStyle={{ color: '#fff' }}
                    >
                        {item.status}
                    </Chip>
                </View>
                <Text variant="bodyMedium" style={styles.description}>
                    {item.description}
                </Text>
                <Text variant="bodySmall" style={styles.detail}>
                    📍 {item.location}
                </Text>
                <Text variant="bodySmall" style={styles.detail}>
                    📅 {item.eventDate.toDate().toLocaleDateString()}
                </Text>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={events}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchEvents} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text variant="bodyLarge" style={styles.emptyText}>
                            No events found
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    list: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventTitle: {
        flex: 1,
        fontWeight: 'bold',
    },
    description: {
        marginBottom: 8,
        color: '#666',
    },
    detail: {
        color: '#666',
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#999',
    },
});

export default MyEventsScreen;
