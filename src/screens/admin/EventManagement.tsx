// Admin Event Management Screen - Minimalist Dark Mode with swipe-to-action gestures

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, ScrollView } from 'react-native';
import { Card, Text, Chip, FAB, Portal, Dialog, Button, TextInput, SegmentedButtons, ActivityIndicator, useTheme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, getDocs, query, orderBy, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types';
import { updateEventStatus } from '../../services/eventService';
import { useToast } from '../../components/Toast';
import PressableScale from '../../components/PressableScale';
import SwipeableRow from '../../components/SwipeableRow';

const EventManagement = ({ navigation }: any) => {
    const theme = useTheme();
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();
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
            showError('Failed to retrieve event records');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
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
            showSuccess('Event created successfully 🎉');
            
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
            showError('Failed to create event');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleApproveEvent = async (eventId: string) => {
        try {
            await updateEventStatus(eventId, 'approved');
            showSuccess('Event approved! 👍');
            fetchEvents();
        } catch (error) {
            showError('Failed to approve event');
        }
    };

    const handleRejectEvent = async (eventId: string) => {
        try {
            await updateEventStatus(eventId, 'rejected');
            showSuccess('Event request rejected ❌');
            fetchEvents();
        } catch (error) {
            showError('Failed to reject event');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
            case 'assigned':
            case 'in progress':
                return '#10b981'; // Green
            case 'rejected':
            case 'cancelled':
                return '#ef4444'; // Red
            case 'completed':
                return '#3b82f6'; // Blue
            default:
                return '#eab308'; // Orange (Pending)
        }
    };

    const renderEventCard = (item: Event) => (
        <PressableScale
            onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
        >
            <Card
                style={[styles.card, { backgroundColor: theme.colors.surface }]}
                elevation={1}
            >
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <Text variant="titleMedium" style={[styles.eventTitle, { color: theme.colors.onSurface, fontWeight: 'bold' }]}>
                            {item.title}
                        </Text>
                        <Chip
                            mode="flat"
                            style={{ backgroundColor: getStatusColor(item.status) + '20' }}
                            textStyle={{ color: getStatusColor(item.status), fontSize: 10, fontWeight: 'bold' }}
                        >
                            {item.status.toUpperCase()}
                        </Chip>
                    </View>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                        📍 {item.location}  |  📅 {item.eventDate.toDate().toLocaleDateString()}
                    </Text>
                    <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                        {item.description}
                    </Text>
                    <View style={[styles.cardFooter, { borderTopColor: theme.colors.outline }]}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            Client: {item.userName || 'Unknown'}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                            Workers: {item.assignedWorkers?.length || 0}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        </PressableScale>
    );

    const renderEventItem = ({ item }: { item: Event }) => {
        // Only allow swipe gestures on pending events
        if (statusFilter === 'pending') {
            return (
                <SwipeableRow
                    leftActionText="Approve"
                    leftActionColor="#10b981"
                    onSwipeRightOpen={() => handleApproveEvent(item.id)}
                    rightActionText="Reject"
                    rightActionColor="#ef4444"
                    onSwipeLeftOpen={() => handleRejectEvent(item.id)}
                >
                    {renderEventCard(item)}
                </SwipeableRow>
            );
        }
        return renderEventCard(item);
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>Loading event records...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
                <SegmentedButtons
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val as any)}
                    buttons={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'completed', label: 'Completed' },
                    ]}
                    style={styles.segmentedButtons}
                    theme={{
                        colors: {
                            secondaryContainer: theme.colors.primaryContainer,
                            onSecondaryContainer: theme.colors.primary,
                        }
                    }}
                />
            </View>

            <FlatList
                data={filteredEvents}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
                ListEmptyComponent={
                    <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content>
                            <Text style={{ color: theme.colors.onSurfaceVariant }}>No events found in this category.</Text>
                        </Card.Content>
                    </Card>
                }
            />

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                label="New Event"
                color={theme.colors.onPrimary}
                onPress={() => setCreateVisible(true)}
            />

            <Portal>
                <Dialog visible={createVisible} onDismiss={() => setCreateVisible(false)} style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
                    <Dialog.Title style={{ color: theme.colors.onSurface }}>Create New Event</Dialog.Title>
                    <Dialog.Content>
                        <ScrollView style={styles.dialogScroll} keyboardShouldPersistTaps="handled">
                            <TextInput
                                label="Event Title *"
                                value={eventTitle}
                                onChangeText={setEventTitle}
                                mode="flat"
                                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                                activeUnderlineColor={theme.colors.primary}
                            />
                            <TextInput
                                label="Location *"
                                value={eventLocation}
                                onChangeText={setEventLocation}
                                mode="flat"
                                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                                activeUnderlineColor={theme.colors.primary}
                            />
                            <TextInput
                                label="Guest Count *"
                                value={eventGuestCount}
                                onChangeText={setEventGuestCount}
                                keyboardType="numeric"
                                mode="flat"
                                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                                activeUnderlineColor={theme.colors.primary}
                            />
                            <TextInput
                                label="Catering Requirements"
                                value={eventCatering}
                                onChangeText={setEventCatering}
                                mode="flat"
                                placeholder="Buffet, vegetarian, etc."
                                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                                activeUnderlineColor={theme.colors.primary}
                                placeholderTextColor={theme.colors.onSurfaceVariant}
                            />
                            <TextInput
                                label="Description *"
                                value={eventDescription}
                                onChangeText={setEventDescription}
                                mode="flat"
                                multiline
                                numberOfLines={3}
                                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                                activeUnderlineColor={theme.colors.primary}
                            />
                            <TextInput
                                label="Additional Notes"
                                value={eventNotes}
                                onChangeText={setEventNotes}
                                mode="flat"
                                multiline
                                numberOfLines={2}
                                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                                activeUnderlineColor={theme.colors.primary}
                            />
                            <PressableScale style={{ width: '100%', marginVertical: 8 }}>
                                <Button
                                    mode="outlined"
                                    icon="calendar"
                                    onPress={() => setShowDatePicker(true)}
                                    style={[styles.dateBtn, { borderColor: theme.colors.outline }]}
                                    textColor={theme.colors.primary}
                                >
                                    Date: {eventDate.toLocaleDateString()}
                                </Button>
                            </PressableScale>

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
                        <Button onPress={() => setCreateVisible(false)} disabled={createLoading} textColor={theme.colors.onSurfaceVariant}>Cancel</Button>
                        <Button
                            onPress={handleCreateEvent}
                            loading={createLoading}
                            disabled={createLoading}
                            textColor={theme.colors.primary}
                        >
                            Create
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
    },
    filterContainer: {
        padding: 12,
        borderBottomWidth: 1,
    },
    segmentedButtons: {},
    list: {
        padding: 12,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 12,
        borderRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    eventTitle: {
        flex: 1,
        marginRight: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 0.5,
        paddingTop: 8,
        marginTop: 4,
    },
    emptyCard: {
        padding: 24,
        alignItems: 'center',
        borderRadius: 12,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        borderRadius: 12,
    },
    dialog: {
        maxHeight: '80%',
        borderRadius: 16,
    },
    dialogScroll: {
        maxHeight: 400,
    },
    input: {
        marginBottom: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    dateBtn: {
        width: '100%',
        borderRadius: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default EventManagement;
