import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { getWorkerAttendance } from '../../services/attendanceService';
import { Attendance } from '../../types';

const AttendanceScreen = () => {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAttendanceData = async () => {
        if (!user) return;
        try {
            const list = await getWorkerAttendance(user.id);
            // Sort by check-in time descending
            list.sort((a, b) => b.checkInTime.seconds - a.checkInTime.seconds);
            setAttendance(list);
        } catch (error) {
            console.error('Error fetching worker attendance:', error);
            Alert.alert('Error', 'Failed to retrieve attendance logs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendanceData();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#388e3c" />
                <Text style={styles.loadingText}>Fetching attendance logs...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="titleMedium" style={styles.title}>My Attendance History</Text>
                <Chip style={styles.countChip}>{attendance.length} Shifts</Chip>
            </View>

            <Divider />

            <FlatList
                data={attendance}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <Card style={styles.attendanceCard}>
                        <Card.Content>
                            <View style={styles.cardHeader}>
                                <Text variant="titleMedium" style={styles.eventTitle}>{item.eventTitle}</Text>
                                <Chip
                                    mode="flat"
                                    style={styles.statusChip}
                                    textStyle={styles.statusText}
                                >
                                    {item.status.toUpperCase()}
                                </Chip>
                            </View>
                            <Divider style={styles.cardDivider} />
                            <View style={styles.logRow}>
                                <Text style={styles.emoji}>📥</Text>
                                <View style={styles.logTextCol}>
                                    <Text variant="bodySmall" style={styles.logLabel}>Checked In</Text>
                                    <Text variant="bodyMedium">
                                        {item.checkInTime.toDate().toLocaleDateString()}  at  {item.checkInTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                            {item.checkOutTime ? (
                                <View style={[styles.logRow, { marginTop: 8 }]}>
                                    <Text style={styles.emoji}>📤</Text>
                                    <View style={styles.logTextCol}>
                                        <Text variant="bodySmall" style={styles.logLabel}>Checked Out</Text>
                                        <Text variant="bodyMedium">
                                            {item.checkOutTime.toDate().toLocaleDateString()}  at  {item.checkOutTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={[styles.logRow, { marginTop: 8 }]}>
                                    <Text style={styles.emoji}>🕒</Text>
                                    <View style={styles.logTextCol}>
                                        <Text variant="bodySmall" style={styles.logLabel}>Checked Out</Text>
                                        <Text variant="bodyMedium" style={styles.activeShift}>Active Shift (Still checked in)</Text>
                                    </View>
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                )}
                ListEmptyComponent={
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text style={styles.emptyText}>No attendance records found.</Text>
                            <Text style={styles.emptySubText}>When you check in at event venues, your shifts will be cataloged here.</Text>
                        </Card.Content>
                    </Card>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    title: {
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    countChip: {
        backgroundColor: '#f5f5f5',
    },
    list: {
        padding: 12,
        paddingBottom: 24,
    },
    attendanceCard: {
        marginBottom: 10,
        borderRadius: 8,
        elevation: 1,
        backgroundColor: '#fff',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    eventTitle: {
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    statusChip: {
        backgroundColor: '#e8f5e9',
    },
    statusText: {
        color: '#2e7d32',
        fontWeight: 'bold',
        fontSize: 9,
    },
    cardDivider: {
        marginVertical: 10,
    },
    logRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 18,
        marginRight: 12,
    },
    logTextCol: {
        flex: 1,
    },
    logLabel: {
        color: '#888',
    },
    activeShift: {
        color: '#ef6c00',
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
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptySubText: {
        color: '#888',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 16,
    },
});

export default AttendanceScreen;
