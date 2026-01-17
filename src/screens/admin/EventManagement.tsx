// Event Management - Admin can view, approve, and manage all events

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const EventManagement = () => {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Event Management</Text>
            <Text>View and manage all events here</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
});

export default EventManagement;
