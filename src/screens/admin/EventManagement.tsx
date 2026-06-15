import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, ScrollView } from 'react-native';
import { Card, Text, Chip, FAB, Portal, Dialog, Button, TextInput, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, getDocs, query, orderBy, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types';

const EventManagement = ({ navigation }: any) => {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'completed'>('pending');

    // Create Event Dialog State
    const [createVisible, setCreateVisible] = useState(false);
    const [eventTitle, setEventTitle] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [eventGuestCount, setEventGuestCount] = useState('');
    const [eventCatering, setEventCatering] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventNotes, setEventNotes] = useState('');
    const [eventDate, setEventDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    const fetchEvents = async () => {
        try {
            const q = query(collection(db, 'events'), orderBy('eventDate', 'desc'));
            const querySnapshot = await getDocs(q);
            const eventsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Event));
            setEvents(eventsList);
        } catch (error) {
            console.error('Error fetching events:', error);
            Alert.alert('Error', 'Failed to retrieve event records');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        // Filter events based on active tab status
        const filtered = events.filter(e => {
            if (statusFilter === 'approved') {
                return e.status === 'approved' || e.status === 'assigned' || e.status === 'in progress';
            }
            return e.status === statusFilter;
        });
        setFilteredEvents(filtered);
    }, [events, statusFilter]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const handleCreateEvent = async () => {
        if (!eventTitle || !eventLocation || !eventDescription || !eventGuestCount) {
            Alert.alert('Validation Error', 'Please fill in all required fields (*)');
            return;
        }

        if (!user) return;

        try {
            setCreateLoading(true);
            const newEvent = {
                title: eventTitle,
                description: eventDescription,
                location: eventLocation,
                eventDate: Timestamp.fromDate(eventDate),
                guestCount: parseInt(eventGuestCount) || 0,
                cateringRequirements: eventCatering,
                additionalNotes: eventNotes,
                userId: user.id,
                userName: `Admin (${user.name})`,
                status: 'approved', // Admin created events are pre-approved
                assignedWorkers: [],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            await addDoc(collection(db, 'events'), newEvent);
            Alert.alert('Success', 'Event created successfully');
            
            // Clear inputs
            setEventTitle('');
            setEventLocation('');
            setEventGuestCount('');
            setEventCatering('');
            setEventDescription('');
            setEventNotes('');
            setEventDate(new Date());
            setCreateVisible(false);

            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            Alert.alert('Error', 'Failed to create event');
        } finally {
            setCreateLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
            case 'assigned':
                return '#2e7d32'; // Green
            case 'rejected':
                return '#c62828'; // Red
            case 'completed':
                return '#1565c0'; // Blue
            default:
                return '#ef6c00'; // Orange (Pending)
        }
    };

    const renderEventItem = ({ item }: { item: Event }) => (
        <Card
            style={styles.card}
            onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
        >
            <Card.Content>
                <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.eventTitle}>
                        {item.title}
                    </Text>
                    <Chip
                        mode="flat"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                        textStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                    >
                        {item.status.toUpperCase()}
                    </Chip>
                </View>
                <Text variant="bodySmall" style={styles.eventMeta}>
                    📍 {item.location}  |  📅 {item.eventDate.toDate().toLocaleDateString()}
                </Text>
                <Text variant="bodyMedium" numberOfLines={2} style={styles.eventDescription}>
                    {item.description}
                </Text>
                <View style={styles.cardFooter}>
                    <Text variant="bodySmall" style={styles.eventUser}>
                        Requested by: {item.userName || 'Unknown'}
                    </Text>
                    <Text variant="bodySmall" style={styles.workersCount}>
                        Workers: {item.assignedWorkers?.length || 0}
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d32f2f" />
                <Text style={styles.loadingText}>Loading event records...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                <SegmentedButtons
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val as any)}
                    buttons={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'completed', label: 'Completed' },
                    ]}
                    style={styles.segmentedButtons}
                />
            </View>

            <FlatList
                data={filteredEvents}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text style={styles.emptyText}>No events found in this category.</Text>
                        </Card.Content>
                    </Card>
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                label="New Event"
                color="#fff"
                onPress={() => setCreateVisible(true)}
            />

            <Portal>
                <Dialog visible={createVisible} onDismiss={() => setCreateVisible(false)} style={styles.dialog}>
                    <Dialog.Title>Create New Event</Dialog.Title>
                    <Dialog.Content>
                        <ScrollView style={styles.dialogScroll} keyboardShouldPersistTaps="handled">
                            <TextInput
                                label="Event Title *"
                                value={eventTitle}
                                onChangeText={setEventTitle}
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="Location *"
                                value={eventLocation}
                                onChangeText={setEventLocation}
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="Guest Count *"
                                value={eventGuestCount}
                                onChangeText={setEventGuestCount}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="Catering Requirements"
                                value={eventCatering}
                                onChangeText={setEventCatering}
                                mode="outlined"
                                placeholder="Buffet, vegetarian, etc."
                                style={styles.input}
                            />
                            <TextInput
                                label="Description *"
                                value={eventDescription}
                                onChangeText={setEventDescription}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.input}
                            />
                            <TextInput
                                label="Additional Notes"
                                value={eventNotes}
                                onChangeText={setEventNotes}
                                mode="outlined"
                                multiline
                                numberOfLines={2}
                                style={styles.input}
                            />
                            <Button
                                mode="outlined"
                                icon="calendar"
                                onPress={() => setShowDatePicker(true)}
                                style={styles.dateBtn}
                            >
                                Date: {eventDate.toLocaleDateString()}
                            </Button>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={eventDate}
                                    mode="date"
                                    onChange={(_event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) setEventDate(selectedDate);
                                    }}
                                />
                            )}
                        </ScrollView>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setCreateVisible(false)} disabled={createLoading}>Cancel</Button>
                        <Button
                            onPress={handleCreateEvent}
                            loading={createLoading}
                            disabled={createLoading}
                            textColor="#d32f2f"
                        >
                            Create Event
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    filterContainer: {
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    segmentedButtons: {},
    list: {
        padding: 12,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 12,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#fff',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    eventTitle: {
        fontWeight: 'bold',
        color: '#111',
        flex: 1,
        marginRight: 8,
    },
    eventMeta: {
        color: '#666',
        marginBottom: 8,
    },
    eventDescription: {
        color: '#444',
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 0.5,
        borderTopColor: '#eee',
        paddingTop: 8,
        marginTop: 4,
    },
    eventUser: {
        color: '#888',
        fontSize: 11,
    },
    workersCount: {
        color: '#888',
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyCard: {
        padding: 24,
        alignItems: 'center',
        elevation: 1,
        backgroundColor: '#fff',
    },
    emptyText: {
        color: '#666',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#d32f2f',
    },
    dialog: {
        maxHeight: '80%',
    },
    dialogScroll: {
        maxHeight: 400,
    },
    input: {
        marginBottom: 12,
    },
    dateBtn: {
        marginVertical: 8,
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
});

export default EventManagement;
