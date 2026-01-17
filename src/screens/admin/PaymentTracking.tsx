// Payment Tracking

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const PaymentTracking = () => {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Payment Tracking</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
});

export default PaymentTracking;
