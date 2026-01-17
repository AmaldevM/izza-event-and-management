// Earnings Screen

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const EarningsScreen = () => {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">My Earnings</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
});

export default EarningsScreen;
