import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Card, Text, Button, Chip, Divider, ActivityIndicator, List } from 'react-native-paper';
import { doc, getDoc, collection, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { updateEventStatus, deleteEvent } from '../../services/eventService';
import { getEventAssignments } from '../../services/assignmentService';
import { getEventAttendance } from '../../services/attendanceService';
import { createNotification } from '../../services/notificationService';
import { Event, EventAssignment, Attendance } from '../../types';

const AdminEventDetailsScreen = ({ route, navigation }: any) => {
    const { eventId } = route.params;
    const [event, setEvent] = useState<Event | null>(null);
    const [assignments, setAssignments] = useState<EventAssignment[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            // 1. Fetch Event
            const eventDoc = await getDoc(doc(db, 'events', eventId));
            if (eventDoc.exists()) {
                setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
            }

            // 2. Fetch Assignments
            const assignmentsList = await getEventAssignments(eventId);
            setAssignments(assignmentsList);

            // 3. Fetch Attendance
            const attendanceList = await getEventAttendance(eventId);
            setAttendance(attendanceList);
        } catch (error) {
            console.error('Error fetching event details:', error);
            Alert.alert('Error', 'Failed to retrieve event information');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchDetails();
        });
        return unsubscribe;
    }, [navigation, eventId]);

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            await updateEventStatus(eventId, 'approved');
            
            // Notify customer
            if (event?.userId) {
                await createNotification(
                    event.userId,
                    'Event Approved 🎉',
                    `Your event request "${event.title}" has been approved!`,
                    'event_approved'
                );
            }

            Alert.alert('Success', 'Event request approved');
            fetchDetails();
        } catch (error) {
            Alert.alert('Error', 'Failed to approve event');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        Alert.alert(
            'Reject Request',
            'Are you sure you want to reject this request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            await updateEventStatus(eventId, 'rejected');
                            
                            if (event?.userId) {
                                await createNotification(
                                    event.userId,
                                    'Event Rejected',
                                    `Your event request "${event.title}" was not approved.`,
                                    'event_rejected'
                                );
                            }

                            Alert.alert('Success', 'Event request rejected');
                            fetchDetails();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reject event');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCompleteEvent = async () => {
        if (!event) return;
        Alert.alert(
            'Complete Event',
            'Change status to COMPLETED and generate worker payout records?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Complete Event',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            // 1. Update event status
                            await updateEventStatus(eventId, 'completed');

                            // 2. Filter present workers
                            const presentWorkers = attendance.filter(a => a.status === 'present');

                            // 3. Generate payments
                            const batch = writeBatch(db);
                            for (const att of presentWorkers) {
                                const workerAssign = assignments.find(a => a.workerId === att.workerId);
                                const payout = workerAssign ? workerAssign.payoutAmount : 1000;

                                const payRef = doc(collection(db, 'payments'));
                                batch.set(payRef, {
                                    workerId: att.workerId,
                                    workerName: att.workerName || 'Worker',
                                    eventId: eventId,
                                    eventTitle: event.title,
                                    amount: payout,
                                    status: 'pending',
                                    createdAt: Timestamp.now()
                                });

                                // Notify worker
                                await createNotification(
                                    att.workerId,
                                    'Payment Pending',
                                    `Your payout of ₹${payout} for event "${event.title}" is pending.`,
                                    'payment_received'
                                );
                            }

                            await batch.commit();
                            Alert.alert('Success', 'Event marked as completed. Payouts generated.');
                            fetchDetails();
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to complete event: ' + error.message);
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteEvent = () => {
        Alert.alert(
            'Delete Event',
            'Are you sure you want to delete this event? This action is permanent.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            await deleteEvent(eventId);
                            Alert.alert('Success', 'Event deleted successfully');
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete event');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
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
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.emptyContainer}>
                <Text variant="headlineSmall" style={styles.emptyText}>Event not found</Text>
                <Button mode="contained" onPress={() => navigation.goBack()}>Go Back</Button>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Status Header */}
            <Card style={styles.card}>
                <Card.Content style={styles.statusRow}>
                    <View>
                        <Text variant="bodySmall" style={styles.label}>Current Status</Text>
                        <Text variant="titleLarge" style={[styles.statusText, { color: getStatusColor(event.status) }]}>
                            {event.status.toUpperCase()}
                        </Text>
                    </View>
                    <Chip style={{ backgroundColor: getStatusColor(event.status) }} textStyle={{ color: '#fff', fontWeight: 'bold' }}>
                        {event.status}
                    </Chip>
                </Card.Content>
            </Card>

            {/* Event Core Info */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="headlineSmall" style={styles.title}>{event.title}</Text>
                    <Text variant="bodySmall" style={styles.customerName}>Requested by: {event.userName}</Text>
                    <Divider style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📅</Text>
                        <View>
                            <Text variant="bodySmall" style={styles.label}>Event Date</Text>
                            <Text variant="bodyMedium">{event.eventDate.toDate().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📍</Text>
                        <View>
                            <Text variant="bodySmall" style={styles.label}>Location</Text>
                            <Text variant="bodyMedium">{event.location}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>👥</Text>
                        <View>
                            <Text variant="bodySmall" style={styles.label}>Guests</Text>
                            <Text variant="bodyMedium">{event.guestCount || 'Not specified'}</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* Catering & Notes */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Catering details</Text>
                    <Text variant="bodyMedium" style={styles.bodyText}>
                        {event.cateringRequirements || 'No catering requirements specified.'}
                    </Text>
                    
                    <Divider style={styles.divider} />
                    
                    <Text variant="titleMedium" style={styles.sectionTitle}>Description</Text>
                    <Text variant="bodyMedium" style={styles.bodyText}>{event.description}</Text>

                    {event.additionalNotes ? (
                        <>
                            <Divider style={styles.divider} />
                            <Text variant="titleMedium" style={styles.sectionTitle}>Additional Notes</Text>
                            <Text variant="bodyMedium" style={styles.bodyText}>{event.additionalNotes}</Text>
                        </>
                    ) : null}
                </Card.Content>
            </Card>

            {/* Event Approval Buttons */}
            {event.status === 'pending' && (
                <View style={styles.btnRow}>
                    <Button
                        mode="contained"
                        onPress={handleApprove}
                        loading={actionLoading}
                        disabled={actionLoading}
                        buttonColor="#2e7d32"
                        textColor="#fff"
                        style={styles.actionBtn}
                        icon="check"
                    >
                        Approve Request
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleReject}
                        loading={actionLoading}
                        disabled={actionLoading}
                        buttonColor="#c62828"
                        textColor="#fff"
                        style={styles.actionBtn}
                        icon="close"
                    >
                        Reject
                    </Button>
                </View>
            )}

            {/* Worker Assignments Section */}
            {event.status !== 'pending' && event.status !== 'rejected' && (
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Assigned Workers</Text>
                            {event.status !== 'completed' && (
                                <Button
                                    mode="outlined"
                                    compact
                                    onPress={() => navigation.navigate('AssignWorkers', { eventId: event.id })}
                                >
                                    Manage Workers
                                </Button>
                            )}
                        </View>
                        <Divider style={styles.divider} />
                        
                        {assignments.length === 0 ? (
                            <Text style={styles.emptyText}>No workers assigned to this event.</Text>
                        ) : (
                            assignments.map(item => (
                                <List.Item
                                    key={item.id}
                                    title={item.workerName}
                                    description={`Rate: ₹${item.payoutAmount}`}
                                    left={_props => <List.Icon icon="account" />}
                                    right={_props => (
                                        <Chip
                                            mode="outlined"
                                            textStyle={{ fontSize: 10, fontWeight: 'bold' }}
                                            style={{
                                                alignSelf: 'center',
                                                borderColor: item.status === 'accepted' ? '#2e7d32' : item.status === 'declined' ? '#c62828' : '#ef6c00'
                                            }}
                                        >
                                            {item.status.toUpperCase()}
                                        </Chip>
                                    )}
                                />
                            ))
                        )}
                    </Card.Content>
                </Card>
            )}

            {/* Attendance tracking */}
            {event.status !== 'pending' && event.status !== 'rejected' && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Attendance Logs</Text>
                        <Divider style={styles.divider} />
                        {attendance.length === 0 ? (
                            <Text style={styles.emptyText}>No attendance records checked in yet.</Text>
                        ) : (
                            attendance.map(item => (
                                <List.Item
                                    key={item.id}
                                    title={item.workerName}
                                    description={`In: ${item.checkInTime.toDate().toLocaleTimeString()} ${item.checkOutTime ? '| Out: ' + item.checkOutTime.toDate().toLocaleTimeString() : ''}`}
                                    left={_props => <List.Icon icon="calendar-check" />}
                                />
                            ))
                        )}
                    </Card.Content>
                </Card>
            )}

            {/* Action controls for active events */}
            {event.status === 'approved' || event.status === 'assigned' ? (
                <Button
                    mode="contained"
                    onPress={handleCompleteEvent}
                    loading={actionLoading}
                    disabled={actionLoading}
                    buttonColor="#1565c0"
                    textColor="#fff"
                    style={styles.completeBtn}
                    icon="checkbox-marked-circle-outline"
                >
                    Mark Event Completed & Payout
                </Button>
            ) : null}

            {/* Delete button */}
            <Button
                mode="text"
                onPress={handleDeleteEvent}
                textColor="#c62828"
                style={styles.deleteBtn}
                icon="delete"
                disabled={actionLoading}
            >
                Delete Event
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 36,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        color: '#666',
        marginVertical: 12,
    },
    card: {
        marginBottom: 16,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#fff',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        color: '#666',
    },
    statusText: {
        fontWeight: 'bold',
        marginTop: 4,
    },
    title: {
        fontWeight: 'bold',
        color: '#d32f2f',
    },
    customerName: {
        color: '#555',
        marginTop: 4,
    },
    divider: {
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    infoIcon: {
        fontSize: 22,
        marginRight: 12,
        width: 28,
        textAlign: 'center',
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 4,
    },
    bodyText: {
        lineHeight: 20,
        color: '#333',
    },
    btnRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    actionBtn: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    completeBtn: {
        marginTop: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    deleteBtn: {
        marginTop: 12,
    },
});

export default AdminEventDetailsScreen;
