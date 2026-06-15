import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { getWorkerPayments } from '../../services/paymentService';
import { Payment } from '../../types';

const EarningsScreen = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Stats
    const [stats, setStats] = useState({
        totalReceived: 0,
        pendingPayouts: 0,
    });

    const fetchEarningsData = async () => {
        if (!user) return;
        try {
            const list = await getWorkerPayments(user.id);
            // Sort by creation date descending
            list.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            setPayments(list);

            // Calculate metrics
            let paidSum = 0;
            let pendingSum = 0;
            list.forEach(p => {
                if (p.status === 'paid') paidSum += p.amount || 0;
                else pendingSum += p.amount || 0;
            });
            setStats({
                totalReceived: paidSum,
                pendingPayouts: pendingSum,
            });
        } catch (error) {
            console.error('Error fetching worker earnings:', error);
            Alert.alert('Error', 'Failed to retrieve earnings summary');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEarningsData();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEarningsData();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#388e3c" />
                <Text style={styles.loadingText}>Fetching earnings log...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Stats Summary */}
            <Card style={styles.statsCard}>
                <Card.Content style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Earned (Paid)</Text>
                        <Text variant="headlineSmall" style={[styles.statValue, { color: '#2e7d32' }]}>
                            ₹{stats.totalReceived}
                        </Text>
                    </View>
                    <View style={styles.statsDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#e65100' }]}>Pending Payout</Text>
                        <Text variant="headlineSmall" style={[styles.statValue, { color: '#e65100' }]}>
                            ₹{stats.pendingPayouts}
                        </Text>
                    </View>
                </Card.Content>
            </Card>

            <View style={styles.historyHeader}>
                <Text variant="titleMedium" style={styles.historyTitle}>Payout History</Text>
                <Chip style={styles.historyCount}>{payments.length} Records</Chip>
            </View>

            <Divider />

            <FlatList
                data={payments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <Card style={styles.paymentCard}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.paymentLeft}>
                                <Text variant="titleMedium" style={styles.eventTitle}>{item.eventTitle}</Text>
                                <Text variant="bodySmall" style={styles.meta}>
                                    📅 Completed: {item.createdAt.toDate().toLocaleDateString()}
                                </Text>
                                {item.paidAt && (
                                    <Text variant="bodySmall" style={styles.paidDate}>
                                        💸 Paid: {item.paidAt.toDate().toLocaleDateString()}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.paymentRight}>
                                <Text variant="titleMedium" style={styles.payoutAmount}>₹{item.amount}</Text>
                                <Chip
                                    mode="flat"
                                    style={{
                                        backgroundColor: item.status === 'paid' ? '#e8f5e9' : '#ffe0b2',
                                        marginTop: 4,
                                        alignSelf: 'flex-end',
                                    }}
                                    textStyle={{
                                        color: item.status === 'paid' ? '#2e7d32' : '#e65100',
                                        fontSize: 9,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {item.status.toUpperCase()}
                                </Chip>
                            </View>
                        </Card.Content>
                    </Card>
                )}
                ListEmptyComponent={
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text style={styles.emptyText}>No payout records found.</Text>
                            <Text style={styles.emptySubText}>When you finish an assigned event gig and Admin completes the event, your payout records will show up here.</Text>
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
    statsCard: {
        margin: 12,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#fff',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontWeight: 'bold',
    },
    statsDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#e0e0e0',
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    historyTitle: {
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    historyCount: {
        backgroundColor: '#f5f5f5',
    },
    list: {
        padding: 12,
        paddingBottom: 24,
    },
    paymentCard: {
        marginBottom: 8,
        borderRadius: 8,
        elevation: 1,
        backgroundColor: '#fff',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentLeft: {
        flex: 1,
    },
    eventTitle: {
        fontWeight: 'bold',
    },
    meta: {
        color: '#666',
        marginTop: 2,
    },
    paidDate: {
        color: '#2e7d32',
        marginTop: 2,
        fontWeight: 'bold',
    },
    paymentRight: {
        alignItems: 'flex-end',
    },
    payoutAmount: {
        fontWeight: 'bold',
        color: '#333',
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

export default EarningsScreen;
