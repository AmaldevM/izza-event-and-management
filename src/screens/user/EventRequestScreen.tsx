// Event Request Screen - User can submit new event requests

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { createEvent } from '../../services/eventService';
import { EventFormData } from '../../types';

const EventRequestScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        eventDate: new Date(),
        location: '',
        guestCount: 0,
        cateringRequirements: '',
        additionalNotes: '',
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!formData.title || !formData.location || !formData.description || !formData.guestCount) {
            showWarning('Please fill in all required fields (*)');
            return;
        }

        if (formData.guestCount < 1) {
            showWarning('Guest count must be at least 1');
            return;
        }

        if (formData.eventDate <= new Date()) {
            showWarning('Event date must be in the future');
            return;
        }

        if (!user) return;

        try {
            setLoading(true);
            await createEvent(user.id, user.name, formData);
            showSuccess('Event request submitted successfully! 🎉');
            setTimeout(() => {
                navigation.navigate('My Events');
            }, 1500);
        } catch (error: any) {
            showError(error.message || 'Failed to submit event. Please try again.');
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
                    label="Guest Count *"
                    value={formData.guestCount ? formData.guestCount.toString() : ''}
                    onChangeText={(text) => setFormData({ ...formData, guestCount: parseInt(text) || 0 })}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                />

                <TextInput
                    label="Catering Requirements"
                    placeholder="e.g. Vegetarian only, Buffet, Live counters"
                    value={formData.cateringRequirements}
                    onChangeText={(text) => setFormData({ ...formData, cateringRequirements: text })}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
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

                <TextInput
                    label="Additional Notes"
                    value={formData.additionalNotes}
                    onChangeText={(text) => setFormData({ ...formData, additionalNotes: text })}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
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
                        onChange={(_event, selectedDate) => {
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
