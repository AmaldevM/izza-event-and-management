import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Card, Text, Button, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { getEventById, updateEventStatus } from '../../services/eventService';
import { Event } from '../../types';

const UserEventDetailsScreen = ({ route, navigation }: any) => {
    const { eventId } = route.params;
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const data = await getEventById(eventId);
            setEvent(data);
        } catch (error) {
            console.error('Error fetching event details:', error);
            Alert.alert('Error', 'Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventDetails();
    }, [eventId]);

    const handleCancelEvent = () => {
        Alert.alert(
            'Cancel Request',
            'Are you sure you want to cancel this event request?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            // Set status to rejected (or we can define a cancelled status, but types define status as pending | approved | rejected | completed. So rejected is best as a cancel status, or let's use rejected for cancelled as well).
                            await updateEventStatus(eventId, 'rejected');
                            Alert.alert('Success', 'Event request cancelled successfully');
                            fetchEventDetails();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel event');
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
                return '#2e7d32'; // dark green
            case 'rejected':
                return '#c62828'; // dark red
            case 'completed':
                return '#1565c0'; // dark blue
            default:
                return '#ef6c00'; // dark orange for pending
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.emptyContainer}>
                <Text variant="headlineSmall" style={styles.emptyText}>
                    Event not found
                </Text>
                <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
                    Go Back
                </Button>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Card style={styles.statusCard}>
                <Card.Content style={styles.statusContent}>
                    <View>
                        <Text variant="titleMedium" style={styles.statusLabel}>Request Status</Text>
                        <Text variant="headlineSmall" style={[styles.statusText, { color: getStatusColor(event.status) }]}>
                            {event.status.toUpperCase()}
                        </Text>
                    </View>
                    <Chip
                        mode="flat"
                        style={{ backgroundColor: getStatusColor(event.status) }}
                        textStyle={{ color: '#fff', fontWeight: 'bold' }}
                    >
                        {event.status}
                    </Chip>
                </Card.Content>
            </Card>

            <Card style={styles.detailsCard}>
                <Card.Content>
                    <Text variant="headlineSmall" style={styles.title}>{event.title}</Text>
                    <Divider style={styles.divider} />
                    
                    <View style={styles.detailRow}>
                        <Text variant="bodyLarge" style={styles.detailIcon}>📅</Text>
                        <View>
                            <Text variant="bodySmall" style={styles.detailLabel}>Date</Text>
                            <Text variant="bodyLarge">{event.eventDate.toDate().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Text variant="bodyLarge" style={styles.detailIcon}>📍</Text>
                        <View>
                            <Text variant="bodySmall" style={styles.detailLabel}>Location</Text>
                            <Text variant="bodyLarge">{event.location}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Text variant="bodyLarge" style={styles.detailIcon}>👥</Text>
                        <View>
                            <Text variant="bodySmall" style={styles.detailLabel}>Guest Count</Text>
                            <Text variant="bodyLarge">{event.guestCount || 'Not specified'}</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.infoCard}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Catering Requirements</Text>
                    <Text variant="bodyMedium" style={styles.bodyText}>
                        {event.cateringRequirements || 'No specific catering requirements requested.'}
                    </Text>
                </Card.Content>
            </Card>

            <Card style={styles.infoCard}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Event Description</Text>
                    <Text variant="bodyMedium" style={styles.bodyText}>
                        {event.description}
                    </Text>
                </Card.Content>
            </Card>

            {event.additionalNotes ? (
                <Card style={styles.infoCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Additional Notes</Text>
                        <Text variant="bodyMedium" style={styles.bodyText}>
                            {event.additionalNotes}
                        </Text>
                    </Card.Content>
                </Card>
            ) : null}

            {event.status === 'pending' && (
                <Button
                    mode="contained"
                    onPress={handleCancelEvent}
                    loading={actionLoading}
                    disabled={actionLoading}
                    buttonColor="#c62828"
                    textColor="#ffffff"
                    style={styles.cancelButton}
                    icon="cancel"
                >
                    Cancel Event Request
                </Button>
            )}

            <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButtonOutline}>
                Back to Dashboard
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
    statusCard: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
    },
    statusContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        color: '#666',
    },
    statusText: {
        fontWeight: 'bold',
        marginTop: 4,
    },
    detailsCard: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
    },
    title: {
        fontWeight: 'bold',
        color: '#6200ee',
    },
    divider: {
        marginVertical: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    detailIcon: {
        fontSize: 24,
        marginRight: 16,
        width: 32,
        textAlign: 'center',
    },
    detailLabel: {
        color: '#666',
    },
    infoCard: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#6200ee',
        marginBottom: 8,
    },
    bodyText: {
        lineHeight: 20,
        color: '#333',
    },
    cancelButton: {
        marginTop: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    backButton: {
        marginTop: 8,
    },
    backButtonOutline: {
        marginTop: 12,
        borderRadius: 8,
    },
});

export default UserEventDetailsScreen;
