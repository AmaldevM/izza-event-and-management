import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Alert, Image, RefreshControl } from 'react-native';
import { Card, Text, Button, Searchbar, Portal, Dialog, Divider, SegmentedButtons, ActivityIndicator, Chip } from 'react-native-paper';
import { collection, getDocs, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { User, UserRole } from '../../types';

const WorkerManagement = () => {
    const [workers, setWorkers] = useState<User[]>([]);
    const [filteredWorkers, setFilteredWorkers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Dialog state
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<User | null>(null);

    const fetchWorkers = async () => {
        try {
            // We fetch all users so the admin can promote general users to workers/admins during testing!
            const q = query(collection(db, 'users'));
            const querySnapshot = await getDocs(q);
            const usersList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as User));

            // Separate workers and others, but let's list everyone so admin can manage roles. We will prioritize workers.
            usersList.sort((a, b) => {
                if (a.role === 'worker' && b.role !== 'worker') return -1;
                if (a.role !== 'worker' && b.role === 'worker') return 1;
                return a.name.localeCompare(b.name);
            });

            setWorkers(usersList);
            setFilteredWorkers(usersList);
        } catch (error) {
            console.error('Error fetching workers:', error);
            Alert.alert('Error', 'Failed to retrieve user directories');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchWorkers();
    };

    const handleSearch = (queryStr: string) => {
        setSearchQuery(queryStr);
        if (queryStr === '') {
            setFilteredWorkers(workers);
        } else {
            const filtered = workers.filter(w =>
                w.name.toLowerCase().includes(queryStr.toLowerCase()) ||
                w.role.toLowerCase().includes(queryStr.toLowerCase())
            );
            setFilteredWorkers(filtered);
        }
    };

    const handleViewWorker = (worker: User) => {
        setSelectedWorker(worker);
        setDetailVisible(true);
    };

    const handleChangeRole = async (newRole: UserRole) => {
        if (!selectedWorker) return;
        
        try {
            await updateDoc(doc(db, 'users', selectedWorker.id), {
                role: newRole,
            });

            Alert.alert('Success', `User role updated to ${newRole}`);
            
            // Update local state
            const updatedWorker = { ...selectedWorker, role: newRole };
            setSelectedWorker(updatedWorker);
            
            // Refresh main lists
            fetchWorkers();
        } catch (error) {
            console.error('Error updating user role:', error);
            Alert.alert('Error', 'Failed to modify user role');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d32f2f" />
                <Text style={styles.loadingText}>Fetching staff directory...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Search staff by name or role..."
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchbar}
            />

            <FlatList
                data={filteredWorkers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <Card
                        style={[
                            styles.workerCard,
                            item.role === 'worker' ? styles.workerBorder : item.role === 'admin' ? styles.adminBorder : styles.userBorder
                        ]}
                        onPress={() => handleViewWorker(item)}
                    >
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.infoCol}>
                                <Text variant="titleMedium" style={styles.workerName}>{item.name}</Text>
                                <Text variant="bodySmall" style={styles.workerPhone}>📞 {item.phone}</Text>
                                <Text variant="bodySmall" style={styles.workerEmail}>📧 {item.email}</Text>
                            </View>
                            <Chip
                                mode="flat"
                                style={[
                                    styles.roleChip,
                                    {
                                        backgroundColor:
                                            item.role === 'admin' ? '#ffebee' : item.role === 'worker' ? '#e8f5e9' : '#e3f2fd'
                                    }
                                ]}
                                textStyle={{
                                    color:
                                        item.role === 'admin' ? '#c62828' : item.role === 'worker' ? '#2e7d32' : '#1565c0',
                                    fontSize: 10,
                                    fontWeight: 'bold'
                                }}
                            >
                                {item.role.toUpperCase()}
                            </Chip>
                        </Card.Content>
                    </Card>
                )}
                ListEmptyComponent={
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text style={styles.emptyText}>No users found in directory.</Text>
                        </Card.Content>
                    </Card>
                }
            />

            {/* Worker Detail Dialog */}
            <Portal>
                <Dialog visible={detailVisible} onDismiss={() => setDetailVisible(false)} style={styles.dialog}>
                    <Dialog.Title>Staff Member details</Dialog.Title>
                    <Dialog.Content>
                        <ScrollView style={styles.dialogScroll} keyboardShouldPersistTaps="handled">
                            <Text variant="titleLarge" style={styles.detailName}>{selectedWorker?.name}</Text>
                            <Text variant="bodySmall" style={styles.detailMeta}>Email: {selectedWorker?.email}</Text>
                            <Text variant="bodySmall" style={styles.detailMeta}>Phone: {selectedWorker?.phone}</Text>
                            
                            <Divider style={styles.divider} />

                            <Text variant="titleMedium" style={styles.sectionTitle}>System Testing Role</Text>
                            <Text variant="bodySmall" style={styles.roleLabel}>Promote or demote user roles instantly for testing:</Text>
                            <SegmentedButtons
                                value={selectedWorker?.role || 'user'}
                                onValueChange={(val) => handleChangeRole(val as UserRole)}
                                buttons={[
                                    { value: 'user', label: 'User' },
                                    { value: 'worker', label: 'Worker' },
                                    { value: 'admin', label: 'Admin' },
                                ]}
                                style={styles.roleSegmentButtons}
                            />

                            {selectedWorker?.role === 'worker' && (
                                <>
                                    <Divider style={styles.divider} />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>Worker details</Text>
                                    
                                    <View style={styles.detailItem}>
                                        <Text variant="bodySmall" style={styles.detailLabel}>Address</Text>
                                        <Text variant="bodyMedium">{selectedWorker.workerDetails?.address || 'Not provided'}</Text>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Text variant="bodySmall" style={styles.detailLabel}>Emergency Contact</Text>
                                        <Text variant="bodyMedium">{selectedWorker.workerDetails?.emergencyContact || 'Not provided'}</Text>
                                    </View>

                                    <Divider style={styles.divider} />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>Payment details</Text>

                                    <View style={styles.detailItem}>
                                        <Text variant="bodySmall" style={styles.detailLabel}>Bank Account Number</Text>
                                        <Text variant="bodyMedium">{selectedWorker.workerDetails?.bankAccount || 'Not provided'}</Text>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Text variant="bodySmall" style={styles.detailLabel}>Account Holder Name</Text>
                                        <Text variant="bodyMedium">{selectedWorker.workerDetails?.accountHolderName || 'Not provided'}</Text>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Text variant="bodySmall" style={styles.detailLabel}>IFSC Code</Text>
                                        <Text variant="bodyMedium">{selectedWorker.workerDetails?.ifscCode || 'Not provided'}</Text>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Text variant="bodySmall" style={styles.detailLabel}>UPI ID</Text>
                                        <Text variant="bodyMedium">{selectedWorker.workerDetails?.upiId || 'Not provided'}</Text>
                                    </View>

                                    <Divider style={styles.divider} />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>UPI QR Code (Highlight)</Text>
                                    {selectedWorker.workerDetails?.qrCodeUrl ? (
                                        <Card style={styles.qrCard}>
                                            <Image
                                                source={{ uri: selectedWorker.workerDetails.qrCodeUrl }}
                                                style={styles.qrImage}
                                                resizeMode="contain"
                                            />
                                        </Card>
                                    ) : (
                                        <Text style={styles.noQrText}>No QR code uploaded by worker yet.</Text>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDetailVisible(false)}>Close</Button>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
    },
    searchbar: {
        margin: 12,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#fff',
    },
    list: {
        paddingHorizontal: 12,
        paddingBottom: 24,
    },
    workerCard: {
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: '#fff',
        elevation: 1,
    },
    workerBorder: {
        borderLeftWidth: 4,
        borderLeftColor: '#388e3c',
    },
    adminBorder: {
        borderLeftWidth: 4,
        borderLeftColor: '#d32f2f',
    },
    userBorder: {
        borderLeftWidth: 4,
        borderLeftColor: '#1976d2',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoCol: {
        flex: 1,
    },
    workerName: {
        fontWeight: 'bold',
        color: '#111',
    },
    workerPhone: {
        color: '#666',
        marginTop: 4,
    },
    workerEmail: {
        color: '#666',
        marginTop: 2,
    },
    roleChip: {
        alignSelf: 'center',
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
    dialog: {
        maxHeight: '85%',
    },
    dialogScroll: {
        maxHeight: 450,
    },
    detailName: {
        fontWeight: 'bold',
        color: '#333',
    },
    detailMeta: {
        color: '#666',
        marginTop: 2,
    },
    divider: {
        marginVertical: 12,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 6,
    },
    roleLabel: {
        color: '#666',
        marginBottom: 8,
    },
    roleSegmentButtons: {
        marginBottom: 8,
    },
    detailItem: {
        marginVertical: 6,
    },
    detailLabel: {
        color: '#888',
        fontSize: 11,
    },
    noQrText: {
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 12,
    },
    qrCard: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    qrImage: {
        width: 200,
        height: 200,
    },
});

export default WorkerManagement;
