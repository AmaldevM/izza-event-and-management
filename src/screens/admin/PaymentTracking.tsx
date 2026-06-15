import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Chip, SegmentedButtons, Portal, Dialog, Divider, ActivityIndicator } from 'react-native-paper';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { markPaymentAsPaid } from '../../services/paymentService';
import { createNotification } from '../../services/notificationService';
import { Payment } from '../../types';

const PaymentTracking = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');

    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Finance stats
    const [financeStats, setFinanceStats] = useState({
        total: 0,
        paid: 0,
        pending: 0,
    });

    const fetchPayments = async () => {
        try {
            const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const paymentsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Payment));

            setPayments(paymentsList);
            calculateStats(paymentsList);
        } catch (error) {
            console.error('Error fetching payments:', error);
            Alert.alert('Error', 'Failed to retrieve payment records');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (list: Payment[]) => {
        let total = 0;
        let paid = 0;
        let pending = 0;

        list.forEach(p => {
            total += p.amount || 0;
            if (p.status === 'paid') paid += p.amount || 0;
            else pending += p.amount || 0;
        });

        setFinanceStats({ total, paid, pending });
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    useEffect(() => {
        if (statusFilter === 'all') {
            setFilteredPayments(payments);
        } else {
            setFilteredPayments(payments.filter(p => p.status === statusFilter));
        }
    }, [payments, statusFilter]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPayments();
    };

    const handleOpenPaymentConfirm = (payment: Payment) => {
        if (payment.status === 'paid') return;
        setSelectedPayment(payment);
        setDialogVisible(true);
    };

    const handleMarkAsPaid = async () => {
        if (!selectedPayment) return;
        try {
            setActionLoading(true);
            
            // 1. Mark as paid in DB
            await markPaymentAsPaid(selectedPayment.id);

            // 2. Notify worker
            await createNotification(
                selectedPayment.workerId,
                'Payment Disbursed 💸',
                `Your payout of ₹${selectedPayment.amount} for "${selectedPayment.eventTitle}" has been marked as PAID!`,
                'payment_received'
            );

            Alert.alert('Success', 'Payment marked as paid');
            setDialogVisible(false);
            setSelectedPayment(null);
            fetchPayments();
        } catch (error) {
            console.error('Error updating payment:', error);
            Alert.alert('Error', 'Failed to update payment status');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d32f2f" />
                <Text style={styles.loadingText}>Fetching payment history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Stats Header */}
            <Card style={styles.statsCard}>
                <Card.Content style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Payouts</Text>
                        <Text variant="titleLarge" style={styles.statValue}>₹{financeStats.total}</Text>
                    </View>
                    <View style={styles.statsDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#2e7d32' }]}>Paid Amount</Text>
                        <Text variant="titleLarge" style={[styles.statValue, { color: '#2e7d32' }]}>₹{financeStats.paid}</Text>
                    </View>
                    <View style={styles.statsDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#c62828' }]}>Pending Amount</Text>
                        <Text variant="titleLarge" style={[styles.statValue, { color: '#c62828' }]}>₹{financeStats.pending}</Text>
                    </View>
                </Card.Content>
            </Card>

            <View style={styles.filterContainer}>
                <SegmentedButtons
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val as any)}
                    buttons={[
                        { value: 'all', label: 'All' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'paid', label: 'Paid' },
                    ]}
                />
            </View>

            <FlatList
                data={filteredPayments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <Card
                        style={styles.paymentCard}
                        onPress={() => handleOpenPaymentConfirm(item)}
                    >
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.paymentInfo}>
                                <Text variant="titleMedium" style={styles.workerName}>{item.workerName}</Text>
                                <Text variant="bodySmall" style={styles.eventTitle}>Event: {item.eventTitle}</Text>
                                <Text variant="bodySmall" style={styles.dateLabel}>
                                    Generated: {item.createdAt.toDate().toLocaleDateString()}
                                    {item.paidAt ? ` | Paid: ${item.paidAt.toDate().toLocaleDateString()}` : ''}
                                </Text>
                            </View>
                            <View style={styles.paymentRight}>
                                <Text variant="titleLarge" style={styles.payoutAmount}>₹{item.amount}</Text>
                                <Chip
                                    mode="flat"
                                    style={{
                                        backgroundColor: item.status === 'paid' ? '#e8f5e9' : '#ffe0b2',
                                        alignSelf: 'flex-end',
                                        marginTop: 6
                                    }}
                                    textStyle={{
                                        color: item.status === 'paid' ? '#2e7d32' : '#e65100',
                                        fontSize: 10,
                                        fontWeight: 'bold'
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
                            <Text style={styles.emptyText}>No payments recorded in this category.</Text>
                        </Card.Content>
                    </Card>
                }
            />

            {/* Payment Confirmation Portal */}
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
                    <Dialog.Title>Disburse Payment</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.confirmText}>
                            Confirm that you have transferred <Text style={styles.boldText}>₹{selectedPayment?.amount}</Text> to <Text style={styles.boldText}>{selectedPayment?.workerName}</Text>?
                        </Text>
                        <Divider style={styles.confirmDivider} />
                        <Text variant="bodySmall" style={styles.paymentDetailsNote}>
                            This payment is for the event "{selectedPayment?.eventTitle}". The worker will receive an in-app notification confirming the disbursement.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)} disabled={actionLoading}>Cancel</Button>
                        <Button
                            onPress={handleMarkAsPaid}
                            loading={actionLoading}
                            disabled={actionLoading}
                            textColor="#2e7d32"
                        >
                            Confirm Payment
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
        color: '#666',
        fontSize: 11,
        marginBottom: 4,
    },
    statValue: {
        fontWeight: 'bold',
        color: '#333',
    },
    statsDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#e0e0e0',
    },
    filterContainer: {
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    list: {
        padding: 12,
        paddingBottom: 40,
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
    paymentInfo: {
        flex: 1,
    },
    workerName: {
        fontWeight: 'bold',
    },
    eventTitle: {
        color: '#666',
        marginTop: 2,
    },
    dateLabel: {
        color: '#888',
        marginTop: 2,
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
    },
    confirmText: {
        fontSize: 16,
        lineHeight: 22,
    },
    boldText: {
        fontWeight: 'bold',
        color: '#d32f2f',
    },
    confirmDivider: {
        marginVertical: 12,
    },
    paymentDetailsNote: {
        color: '#666',
        lineHeight: 16,
    },
});

export default PaymentTracking;
