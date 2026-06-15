import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../context/AuthContext';
import { getWorkerAssignments } from '../../services/assignmentService';
import { EventAssignment } from '../../types';

const MyAssignments = ({ navigation }: any) => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<EventAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Calendar & Selection State
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [selectedEvents, setSelectedEvents] = useState<EventAssignment[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});

    const fetchAssignments = async () => {
        if (!user) return;
        try {
            const list = await getWorkerAssignments(user.id);
            // Filter only accepted assignments
            const accepted = list.filter(a => a.status === 'accepted');
            setAssignments(accepted);
            generateMarkedDates(accepted, selectedDate);
        } catch (error) {
            console.error('Error fetching worker assignments:', error);
            Alert.alert('Error', 'Failed to retrieve your work schedule');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const generateMarkedDates = (list: EventAssignment[], activeDate: string) => {
        const marks: any = {};
        
        list.forEach(a => {
            const dateStr = a.eventDate.toDate().toISOString().split('T')[0];
            marks[dateStr] = { marked: true, dotColor: '#388e3c' }; // Green dot for work days
        });

        // Highlight selected day
        marks[activeDate] = {
            ...marks[activeDate],
            selected: true,
            selectedColor: '#388e3c',
        };

        setMarkedDates(marks);
    };

    useEffect(() => {
        fetchAssignments();
    }, [user]);

    useEffect(() => {
        // Find events scheduled on the selected date
        const filtered = assignments.filter(a => {
            const dateStr = a.eventDate.toDate().toISOString().split('T')[0];
            return dateStr === selectedDate;
        });
        setSelectedEvents(filtered);
        
        if (assignments.length > 0) {
            generateMarkedDates(assignments, selectedDate);
        }
    }, [selectedDate, assignments]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAssignments();
    };

    const handleDayPress = (day: any) => {
        setSelectedDate(day.dateString);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#388e3c" />
                <Text style={styles.loadingText}>Loading your work schedule...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Calendar
                current={selectedDate}
                onDayPress={handleDayPress}
                markedDates={markedDates}
                theme={{
                    selectedDayBackgroundColor: '#388e3c',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#388e3c',
                    arrowColor: '#388e3c',
                    dotColor: '#388e3c',
                }}
                style={styles.calendar}
            />

            <View style={styles.listHeader}>
                <Text variant="titleMedium" style={styles.listTitle}>
                    Schedule on: {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
                <Chip style={styles.countChip} textStyle={styles.countText}>{selectedEvents.length} Gigs</Chip>
            </View>

            <Divider />

            <FlatList
                data={selectedEvents}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <Card
                        style={styles.card}
                        onPress={() => navigation.navigate('EventDetails', { eventId: item.eventId })}
                    >
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.cardInfo}>
                                <Text variant="titleMedium" style={styles.eventTitle}>{item.eventTitle}</Text>
                                <Text variant="bodySmall" style={styles.eventMeta}>💰 Payout: ₹{item.payoutAmount}</Text>
                            </View>
                            <Chip
                                mode="flat"
                                style={styles.statusChip}
                                textStyle={styles.statusText}
                            >
                                CONFIRMED
                            </Chip>
                        </Card.Content>
                    </Card>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No work assigned on this date.</Text>
                    </View>
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
    calendar: {
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 1,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    listTitle: {
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    countChip: {
        backgroundColor: '#e8f5e9',
        height: 28,
        justifyContent: 'center',
    },
    countText: {
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    list: {
        padding: 12,
    },
    card: {
        marginBottom: 8,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#fff',
        borderLeftWidth: 4,
        borderLeftColor: '#2e7d32',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
    },
    eventTitle: {
        fontWeight: 'bold',
    },
    eventMeta: {
        color: '#666',
        marginTop: 2,
    },
    statusChip: {
        backgroundColor: '#e8f5e9',
    },
    statusText: {
        color: '#2e7d32',
        fontWeight: 'bold',
        fontSize: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        color: '#999',
    },
});

export default MyAssignments;
