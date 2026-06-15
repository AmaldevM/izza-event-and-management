import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Checkbox, Button, Searchbar, TextInput, Card, ActivityIndicator } from 'react-native-paper';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { getAllWorkers } from '../../services/workerService';
import { assignWorkersToEvent, getEventAssignments } from '../../services/assignmentService';
import { User, Event } from '../../types';

const AssignWorkersScreen = ({ route, navigation }: any) => {
    const { eventId } = route.params;
    const [event, setEvent] = useState<Event | null>(null);
    const [workers, setWorkers] = useState<User[]>([]);
    const [filteredWorkers, setFilteredWorkers] = useState<User[]>([]);
    
    // UI states
    const [searchQuery, setSearchQuery] = useState('');
    const [payoutAmount, setPayoutAmount] = useState('1000');
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch Event
            const eventDoc = await getDoc(doc(db, 'events', eventId));
            if (!eventDoc.exists()) {
                Alert.alert('Error', 'Event not found');
                navigation.goBack();
                return;
            }
            const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;
            setEvent(eventData);

            // 2. Fetch Assignments to find current payout rate if it exists
            const existingAssignments = await getEventAssignments(eventId);
            if (existingAssignments.length > 0) {
                setPayoutAmount(existingAssignments[0].payoutAmount.toString());
            }

            // 3. Fetch All Workers
            const allWorkers = await getAllWorkers();
            setWorkers(allWorkers);
            setFilteredWorkers(allWorkers);

            // 4. Initialize Selected Workers from Event
            setSelectedWorkerIds(eventData.assignedWorkers || []);
        } catch (error) {
            console.error('Error loading workers/event:', error);
            Alert.alert('Error', 'Failed to retrieve worker records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [eventId]);

    const handleSearch = (queryStr: string) => {
        setSearchQuery(queryStr);
        if (queryStr === '') {
            setFilteredWorkers(workers);
        } else {
            const filtered = workers.filter(w =>
                w.name.toLowerCase().includes(queryStr.toLowerCase())
            );
            setFilteredWorkers(filtered);
        }
    };

    const handleToggleWorker = (workerId: string) => {
        if (selectedWorkerIds.includes(workerId)) {
            setSelectedWorkerIds(selectedWorkerIds.filter(id => id !== workerId));
        } else {
            setSelectedWorkerIds([...selectedWorkerIds, workerId]);
        }
    };

    const handleSave = async () => {
        if (!event) return;
        const rate = parseFloat(payoutAmount);
        if (isNaN(rate) || rate <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid payout rate');
            return;
        }

        try {
            setSaveLoading(true);

            // Create list of selected workers: { id, name }
            const selectedWorkersList = workers
                .filter(w => selectedWorkerIds.includes(w.id))
                .map(w => ({ id: w.id, name: w.name }));

            await assignWorkersToEvent(
                eventId,
                event.title,
                event.eventDate,
                selectedWorkersList,
                rate
            );

            Alert.alert('Success', 'Workers assigned and notified successfully');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving assignments:', error);
            Alert.alert('Error', 'Failed to update assignments');
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d32f2f" />
                <Text style={styles.loadingText}>Fetching available workforce...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Card style={styles.headerCard}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.eventTitle}>{event?.title}</Text>
                    <Text variant="bodySmall">📅 {event?.eventDate.toDate().toLocaleDateString()}  |  📍 {event?.location}</Text>
                    
                    <TextInput
                        label="Worker Payout Rate (₹) per Event"
                        value={payoutAmount}
                        onChangeText={setPayoutAmount}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.payoutInput}
                        left={<TextInput.Icon icon="cash" />}
                    />
                </Card.Content>
            </Card>

            <Searchbar
                placeholder="Search worker by name..."
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchbar}
            />

            <FlatList
                data={filteredWorkers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const isSelected = selectedWorkerIds.includes(item.id);
                    return (
                        <Card style={styles.workerCard} onPress={() => handleToggleWorker(item.id)}>
                            <Card.Content style={styles.workerRow}>
                                <View style={styles.workerInfo}>
                                    <Text variant="titleMedium">{item.name}</Text>
                                    <Text variant="bodySmall">📞 {item.phone}</Text>
                                    {item.workerDetails?.upiId ? (
                                        <Text variant="bodySmall" style={styles.upiLabel}>UPI: {item.workerDetails.upiId}</Text>
                                    ) : null}
                                </View>
                                <Checkbox
                                    status={isSelected ? 'checked' : 'unchecked'}
                                    onPress={() => handleToggleWorker(item.id)}
                                    color="#d32f2f"
                                />
                            </Card.Content>
                        </Card>
                    );
                }}
                ListEmptyComponent={
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text style={styles.emptyText}>No workers match your search.</Text>
                        </Card.Content>
                    </Card>
                }
            />

            <View style={styles.footer}>
                <Button
                    mode="contained"
                    buttonColor="#d32f2f"
                    textColor="#fff"
                    onPress={handleSave}
                    loading={saveLoading}
                    disabled={saveLoading}
                    style={styles.saveBtn}
                    icon="content-save"
                >
                    Save & Notify ({selectedWorkerIds.length} Workers)
                </Button>
            </View>
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
    headerCard: {
        margin: 12,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#fff',
    },
    eventTitle: {
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 4,
    },
    payoutInput: {
        marginTop: 12,
    },
    searchbar: {
        marginHorizontal: 12,
        marginBottom: 8,
        elevation: 1,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    list: {
        padding: 12,
        paddingBottom: 80,
    },
    workerCard: {
        marginBottom: 8,
        borderRadius: 8,
        elevation: 1,
        backgroundColor: '#fff',
    },
    workerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    workerInfo: {
        flex: 1,
    },
    upiLabel: {
        color: '#888',
        marginTop: 2,
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
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        elevation: 6,
    },
    saveBtn: {
        paddingVertical: 4,
        borderRadius: 8,
    },
});

export default AssignWorkersScreen;
