import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Card, Text, Button, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { useAuth } from '../../context/AuthContext';
import { getEventById } from '../../services/eventService';
import { getEventAssignments, updateAssignmentStatus } from '../../services/assignmentService';
import { checkIn, checkOut, getEventAttendance } from '../../services/attendanceService';
import { Event, EventAssignment, Attendance } from '../../types';

const WorkerEventDetailsScreen = ({ route, navigation }: any) => {
    const { eventId } = route.params;
    const { user } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [assignment, setAssignment] = useState<EventAssignment | null>(null);
    const [attendanceRecord, setAttendanceRecord] = useState<Attendance | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const loadData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            
            // 1. Fetch Event Details
            const data = await getEventById(eventId);
            setEvent(data);

            // 2. Fetch Assignments to find the specific assignment for this worker
            const assignmentsList = await getEventAssignments(eventId);
            const workerAssign = assignmentsList.find(a => a.workerId === user.id);
            setAssignment(workerAssign || null);

            // 3. Fetch Attendance to see if the worker has already checked in/out
            const attendanceList = await getEventAttendance(eventId);
            const workerAttendance = attendanceList.find(a => a.workerId === user.id);
            setAttendanceRecord(workerAttendance || null);

        } catch (error) {
            console.error('Error loading worker event details:', error);
            Alert.alert('Error', 'Failed to retrieve event details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [eventId, user]);

    const handleAccept = async () => {
        if (!assignment || !event) return;
        try {
            setActionLoading(true);
            await updateAssignmentStatus(assignment.id, 'accepted');
            Alert.alert('Success', 'You have accepted this event assignment');
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to accept assignment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDecline = async () => {
        if (!assignment || !event) return;
        Alert.alert(
            'Decline Assignment',
            'Are you sure you want to decline this event assignment?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Decline',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            // 1. Update assignment status to 'declined'
                            await updateAssignmentStatus(assignment.id, 'declined');

                            // 2. Remove worker ID from event.assignedWorkers
                            const updatedWorkers = event.assignedWorkers.filter(id => id !== user?.id);
                            await updateDoc(doc(db, 'events', event.id), {
                                assignedWorkers: updatedWorkers
                            });

                            Alert.alert('Success', 'Assignment declined');
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to decline assignment');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCheckIn = async () => {
        if (!event || !assignment || !user) return;
        try {
            setActionLoading(true);
            await checkIn(
                eventId,
                user.id,
                user.name,
                event.title,
                assignment.payoutAmount
            );
            Alert.alert('Check-In Successful', 'You have marked attendance present!');
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to check in');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!attendanceRecord) return;
        try {
            setActionLoading(true);
            await checkOut(attendanceRecord.id);
            Alert.alert('Check-Out Successful', 'You have checked out of work!');
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to check out');
        } finally {
            setActionLoading(false);
        }
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted':
                return '#2e7d32';
            case 'declined':
                return '#c62828';
            default:
                return '#ef6c00';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#388e3c" />
            </View>
        );
    }

    if (!event || !assignment) {
        return (
            <View style={styles.emptyContainer}>
                <Text variant="headlineSmall" style={styles.emptyText}>Event or assignment details not found</Text>
                <Button mode="contained" onPress={() => navigation.goBack()} buttonColor="#388e3c">Go Back</Button>
            </View>
        );
    }

    const eventDateObj = event.eventDate.toDate();
    const eventIsToday = isToday(eventDateObj);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Assignment Status */}
            <Card style={styles.card}>
                <Card.Content style={styles.statusRow}>
                    <View>
                        <Text variant="bodySmall" style={styles.label}>My Assignment</Text>
                        <Text variant="titleMedium" style={[styles.statusText, { color: getStatusColor(assignment.status) }]}>
                            {assignment.status.toUpperCase()}
                        </Text>
                    </View>
                    <Chip style={{ backgroundColor: getStatusColor(assignment.status) }} textStyle={{ color: '#fff', fontWeight: 'bold' }}>
                        ₹{assignment.payoutAmount} Payout
                    </Chip>
                </Card.Content>
            </Card>

            {/* Core Info */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="headlineSmall" style={styles.title}>{event.title}</Text>
                    <Divider style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📅</Text>
                        <View>
                            <Text variant="bodySmall" style={styles.label}>Date</Text>
                            <Text variant="bodyMedium">{eventDateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📍</Text>
                        <View>
                            <Text variant="bodySmall" style={styles.label}>Reporting Location</Text>
                            <Text variant="bodyMedium">{event.location}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>👥</Text>
                        <View>
                            <Text variant="bodySmall" style={styles.label}>Catering for</Text>
                            <Text variant="bodyMedium">{event.guestCount || 'Not specified'} Guests</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* Requirements & Description */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Catering Requirements</Text>
                    <Text variant="bodyMedium" style={styles.bodyText}>
                        {event.cateringRequirements || 'No specific catering instructions.'}
                    </Text>

                    <Divider style={styles.divider} />

                    <Text variant="titleMedium" style={styles.sectionTitle}>Instructions</Text>
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

            {/* Accept / Decline Panel */}
            {assignment.status === 'assigned' && (
                <View style={styles.btnRow}>
                    <Button
                        mode="contained"
                        onPress={handleAccept}
                        loading={actionLoading}
                        disabled={actionLoading}
                        buttonColor="#2e7d32"
                        textColor="#fff"
                        style={styles.actionBtn}
                        icon="check"
                    >
                        Accept Gig
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleDecline}
                        loading={actionLoading}
                        disabled={actionLoading}
                        buttonColor="#c62828"
                        textColor="#fff"
                        style={styles.actionBtn}
                        icon="close"
                    >
                        Decline
                    </Button>
                </View>
            )}

            {/* Reporting instructions & Attendance Mark Panel */}
            {assignment.status === 'accepted' && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Workday Operations</Text>
                        <Text variant="bodySmall" style={styles.label}>Please check in once you arrive at the reporting venue.</Text>
                        
                        <Divider style={styles.divider} />

                        {attendanceRecord ? (
                            <View style={styles.attendanceReport}>
                                <Text style={styles.presentText}>Status: PRESENT AT VENUE</Text>
                                <Text variant="bodyMedium">
                                    Check In: {attendanceRecord.checkInTime.toDate().toLocaleTimeString()}
                                </Text>
                                {attendanceRecord.checkOutTime ? (
                                    <Text variant="bodyMedium">
                                        Check Out: {attendanceRecord.checkOutTime.toDate().toLocaleTimeString()}
                                    </Text>
                                ) : (
                                    <Button
                                        mode="contained"
                                        onPress={handleCheckOut}
                                        loading={actionLoading}
                                        disabled={actionLoading}
                                        buttonColor="#c62828"
                                        textColor="#fff"
                                        style={styles.attendanceBtn}
                                        icon="exit-run"
                                    >
                                        Check Out of Venue
                                    </Button>
                                )}
                            </View>
                        ) : (
                            <View>
                                {eventIsToday ? (
                                    <Button
                                        mode="contained"
                                        onPress={handleCheckIn}
                                        loading={actionLoading}
                                        disabled={actionLoading}
                                        buttonColor="#2e7d32"
                                        textColor="#fff"
                                        style={styles.attendanceBtn}
                                        icon="clock-check-outline"
                                    >
                                        Mark Check-In
                                    </Button>
                                ) : (
                                    <Text style={styles.notDayText}>
                                        Attendance check-in will open on the event date ({eventDateObj.toLocaleDateString()}).
                                    </Text>
                                )}
                            </View>
                        )}
                    </Card.Content>
                </Card>
            )}

            <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backBtn} textColor="#388e3c">
                Back to Schedule
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
        paddingBottom: 32,
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
        marginBottom: 16,
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
        color: '#388e3c',
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
        color: '#388e3c',
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
    attendanceReport: {
        marginVertical: 6,
    },
    presentText: {
        color: '#2e7d32',
        fontWeight: 'bold',
        fontSize: 15,
        marginBottom: 6,
    },
    attendanceBtn: {
        marginTop: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    notDayText: {
        color: '#d84315',
        textAlign: 'center',
        padding: 8,
        fontWeight: 'bold',
    },
    backBtn: {
        marginTop: 8,
        borderRadius: 8,
    },
});

export default WorkerEventDetailsScreen;
