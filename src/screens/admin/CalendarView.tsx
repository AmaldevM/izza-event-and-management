import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { Event } from '../../types';

const CalendarView = ({ navigation }: any) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Selection state
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});

    const fetchEvents = async () => {
        try {
            const q = query(collection(db, 'events'), orderBy('eventDate', 'asc'));
            const querySnapshot = await getDocs(q);
            const eventsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Event));

            setEvents(eventsList);
            generateMarkedDates(eventsList, selectedDate);
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            Alert.alert('Error', 'Failed to retrieve calendar events');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const generateMarkedDates = (eventsList: Event[], activeDate: string) => {
        const marks: any = {};
        
        eventsList.forEach(event => {
            const dateStr = event.eventDate.toDate().toISOString().split('T')[0];
            
            // Assign dot color based on event status
            let dotColor = '#ef6c00'; // Pending: Orange
            if (event.status === 'approved' || event.status === 'assigned') dotColor = '#2e7d32'; // Approved: Green
            else if (event.status === 'completed') dotColor = '#1565c0'; // Completed: Blue
            else if (event.status === 'rejected') dotColor = '#c62828'; // Rejected: Red

            if (!marks[dateStr]) {
                marks[dateStr] = { marked: true, dotColor: dotColor, dots: [{ color: dotColor }] };
            }
        });

        // Add visual highlighting for the selected date
        marks[activeDate] = {
            ...marks[activeDate],
            selected: true,
            selectedColor: '#d32f2f',
        };

        setMarkedDates(marks);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        // Find events on selected date
        const filtered = events.filter(event => {
            const dateStr = event.eventDate.toDate().toISOString().split('T')[0];
            return dateStr === selectedDate;
        });
        setSelectedEvents(filtered);
        
        // Re-generate marked dates to highlight the new selection
        if (events.length > 0) {
            generateMarkedDates(events, selectedDate);
        }
    }, [selectedDate, events]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const handleDayPress = (day: any) => {
        setSelectedDate(day.dateString);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
            case 'assigned':
                return '#2e7d32';
            case 'rejected':
                return '#c62828';
            case 'completed':
                return '#1565c0';
            default:
                return '#ef6c00';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d32f2f" />
                <Text style={styles.loadingText}>Loading operations calendar...</Text>
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
                    selectedDayBackgroundColor: '#d32f2f',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#d32f2f',
                    arrowColor: '#d32f2f',
                    dotColor: '#d32f2f',
                }}
                style={styles.calendar}
            />

            <View style={styles.listHeader}>
                <Text variant="titleMedium" style={styles.listTitle}>
                    Events on: {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
                <Chip style={styles.countChip} textStyle={styles.countText}>{selectedEvents.length}</Chip>
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
                        onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
                    >
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.cardLeft}>
                                <Text variant="titleMedium" style={styles.eventTitle}>{item.title}</Text>
                                <Text variant="bodySmall" style={styles.eventMeta}>📍 {item.location}</Text>
                                <Text variant="bodySmall" style={styles.eventMeta}>👷 Workers: {item.assignedWorkers?.length || 0} assigned</Text>
                            </View>
                            <Chip
                                mode="flat"
                                style={{ backgroundColor: getStatusColor(item.status), alignSelf: 'center' }}
                                textStyle={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}
                            >
                                {item.status.toUpperCase()}
                            </Chip>
                        </Card.Content>
                    </Card>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No events scheduled on this date.</Text>
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
        backgroundColor: '#f5f5f5',
        height: 28,
        justifyContent: 'center',
    },
    countText: {
        fontWeight: 'bold',
        color: '#d32f2f',
    },
    list: {
        padding: 12,
    },
    card: {
        marginBottom: 8,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#fff',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardLeft: {
        flex: 1,
        marginRight: 8,
    },
    eventTitle: {
        fontWeight: 'bold',
    },
    eventMeta: {
        color: '#666',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        color: '#999',
    },
});

export default CalendarView;
