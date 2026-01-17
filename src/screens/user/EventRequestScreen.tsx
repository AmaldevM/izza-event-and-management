// Event Request Screen - User can submit new event requests

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { createEvent } from '../../services/eventService';
import { EventFormData } from '../../types';

const EventRequestScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        eventDate: new Date(),
        location: '',
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async () => {
        if (!formData.title || !formData.location || !formData.description) {
            setMessage('Please fill in all fields');
            return;
        }

        if (!user) return;

        try {
            setLoading(true);
            await createEvent(user.id, user.name, formData);
            setMessage('Event request submitted successfully!');
            setTimeout(() => {
                navigation.navigate('My Events');
            }, 1500);
        } catch (error: any) {
            setMessage(error.message || 'Failed to submit event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Request New Event
                </Text>

                <TextInput
                    label="Event Title *"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    mode="outlined"
                    style={styles.input}
                />

                <TextInput
                    label="Location *"
                    value={formData.location}
                    onChangeText={(text) => setFormData({ ...formData, location: text })}
                    mode="outlined"
                    style={styles.input}
                />

                <TextInput
                    label="Description *"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    style={styles.input}
                />

                <Button
                    mode="outlined"
                    onPress={() => setShowDatePicker(true)}
                    style={styles.input}
                    icon="calendar"
                >
                    {formData.eventDate.toLocaleDateString()}
                </Button>

                {showDatePicker && (
                    <DateTimePicker
                        value={formData.eventDate}
                        mode="date"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (selectedDate) {
                                setFormData({ ...formData, eventDate: selectedDate });
                            }
                        }}
                    />
                )}

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.submitButton}
                >
                    Submit Request
                </Button>
            </View>

            <Snackbar
                visible={!!message}
                onDismiss={() => setMessage('')}
                duration={3000}
            >
                {message}
            </Snackbar>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
    },
    title: {
        marginBottom: 24,
        fontWeight: 'bold',
    },
    input: {
        marginBottom: 16,
    },
    submitButton: {
        marginTop: 8,
        paddingVertical: 6,
    },
});

export default EventRequestScreen;
