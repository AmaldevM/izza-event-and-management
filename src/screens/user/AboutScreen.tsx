import React from 'react';
import { ScrollView, StyleSheet, View, Image } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';

const AboutScreen = () => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('../../../original-777583a22f5a93d354b63c9413579bff.webp')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text variant="headlineMedium" style={styles.title}>IZZA Catering</Text>
                <Text variant="bodyLarge">Event Management System</Text>
            </View>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Project Summary</Text>
                    <Text variant="bodyMedium" style={styles.text}>
                        IZZA Catering & Event Management is a role-based digital platform developed to streamline and modernize the entire event planning and catering workflow. The system replaces traditional WhatsApp-based communication with a centralized application that connects users, administrators, and workers in a structured, secure, and transparent environment.
                    </Text>

                    <Divider style={styles.divider} />

                    <Text variant="titleMedium" style={styles.sectionTitle}>Main Goal</Text>
                    <Text variant="bodyMedium" style={styles.text}>
                        To simplify event registration, approval, workforce coordination, attendance tracking, and financial management through automation and real-time updates.
                    </Text>

                    <Divider style={styles.divider} />

                    <Text variant="titleMedium" style={styles.sectionTitle}>Key Features</Text>
                    <View style={styles.featureList}>
                        <Text>• Role-based access control</Text>
                        <Text>• Event approval workflow</Text>
                        <Text>• Calendar-based management</Text>
                        <Text>• Attendance tracking</Text>
                        <Text>• Fund and payout tracking</Text>
                        <Text>• Admin broadcast notifications</Text>
                    </View>
                </Card.Content>
            </Card>

            <View style={styles.footer}>
                <Text variant="labelSmall">Version 1.0.0 Production Ready</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 10,
    },
    title: {
        fontWeight: 'bold',
        color: '#6200ee',
    },
    card: {
        margin: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#6200ee',
    },
    text: {
        lineHeight: 20,
        marginBottom: 12,
    },
    divider: {
        marginVertical: 12,
    },
    featureList: {
        gap: 4,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        opacity: 0.6,
    }
});

export default AboutScreen;
