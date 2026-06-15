// Worker Dashboard Screen - Minimalist Dark Mode with tactile micro-interactions

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Image } from 'react-native';
import { Card, Text, Button, Avatar, Surface, TextInput, ActivityIndicator, Divider, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase.config';
import { getWorkerAssignments } from '../../services/assignmentService';
import { getWorkerAttendance } from '../../services/attendanceService';
import { getWorkerPayments } from '../../services/paymentService';
import { EventAssignment, User } from '../../types';
import PressableScale from '../../components/PressableScale';

const WorkerDashboard = ({ navigation }: any) => {
    const theme = useTheme();
    const { user, logout } = useAuth();
    const [dbUser, setDbUser] = useState<User | null>(null);
    
    // Stats
    const [eventsWorked, setEventsWorked] = useState(0);
    const [totalEarned, setTotalEarned] = useState(0);
    const [pendingPayouts, setPendingPayouts] = useState(0);
    const [upcomingAssignments, setUpcomingAssignments] = useState<EventAssignment[]>([]);

    // Loading & Refreshing
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Profile Edit states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [upiId, setUpiId] = useState('');
    
    // Action loading states
    const [profileLoading, setProfileLoading] = useState(false);
    const [qrUploading, setQrUploading] = useState(false);

    const loadWorkerData = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, 'users', user.id));
            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() } as User;
                setDbUser(userData);
                
                setName(userData.name || '');
                setPhone(userData.phone || '');
                setAddress(userData.workerDetails?.address || '');
                setEmergencyContact(userData.workerDetails?.emergencyContact || '');
                setBankAccount(userData.workerDetails?.bankAccount || '');
                setAccountHolderName(userData.workerDetails?.accountHolderName || '');
                setIfscCode(userData.workerDetails?.ifscCode || '');
                setUpiId(userData.workerDetails?.upiId || '');
            }

            const allAssignments = await getWorkerAssignments(user.id);
            const now = Timestamp.now().toDate();
            
            const upcoming = allAssignments.filter(a => 
                a.status === 'accepted' && 
                a.eventDate.toDate() >= now
            );
            upcoming.sort((a, b) => a.eventDate.seconds - b.eventDate.seconds);
            setUpcomingAssignments(upcoming);

            const attendanceList = await getWorkerAttendance(user.id);
            setEventsWorked(attendanceList.filter(a => a.status === 'present').length);

            const paymentsList = await getWorkerPayments(user.id);
            let earned = 0;
            let pending = 0;
            paymentsList.forEach(p => {
                if (p.status === 'paid') earned += p.amount || 0;
                else pending += p.amount || 0;
            });
            setTotalEarned(earned);
            setPendingPayouts(pending);

        } catch (error) {
            console.error('Error loading worker details:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadWorkerData();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        loadWorkerData();
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        if (!name || !phone || !bankAccount || !ifscCode || !upiId || !accountHolderName) {
            Alert.alert('Validation Error', 'Please fill in name, phone, bank details, and UPI ID');
            return;
        }

        try {
            setProfileLoading(true);
            const updatedDetails = {
                bankAccount,
                ifscCode,
                upiId,
                address,
                emergencyContact,
                accountHolderName,
                qrCodeUrl: dbUser?.workerDetails?.qrCodeUrl || ''
            };

            await updateDoc(doc(db, 'users', user.id), {
                name,
                phone,
                workerDetails: updatedDetails,
            });

            Alert.alert('Success', 'Profile details updated successfully');
            loadWorkerData();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUploadQrCode = async () => {
        if (!user) return;
        
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need access to your photo library to select the QR code image.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            setQrUploading(true);
            const selectedUri = result.assets[0].uri;

            const response = await fetch(selectedUri);
            const blob = await response.blob();

            const storageRef = ref(storage, `qrcodes/${user.id}.jpg`);
            await uploadBytes(storageRef, blob);

            const downloadUrl = await getDownloadURL(storageRef);

            const updatedDetails = {
                bankAccount,
                ifscCode,
                upiId,
                address,
                emergencyContact,
                accountHolderName,
                qrCodeUrl: downloadUrl
            };

            await updateDoc(doc(db, 'users', user.id), {
                workerDetails: updatedDetails,
            });

            Alert.alert('Success', 'GPay QR Code uploaded successfully');
            loadWorkerData();
        } catch (error: any) {
            console.error('Error uploading QR code:', error);
            Alert.alert('Error', 'Failed to upload QR code: ' + error.message);
        } finally {
            setQrUploading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>Loading worker profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            keyboardShouldPersistTaps="handled"
        >
            {/* Header */}
            <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <View style={styles.headerContent}>
                    <Avatar.Icon size={52} icon="chef-hat" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
                    <View style={styles.userInfo}>
                        <Text variant="titleLarge" style={[styles.userName, { color: theme.colors.onSurface }]}>{dbUser?.name}</Text>
                        <Text variant="bodySmall" style={[styles.userRole, { color: theme.colors.primary }]}>CATERING STAFF MEMBER</Text>
                    </View>
                    <Button mode="outlined" onPress={logout} style={[styles.logoutBtn, { borderColor: theme.colors.outline }]} textColor={theme.colors.primary}>
                        Sign Out
                    </Button>
                </View>
            </Surface>

            <View style={styles.content}>
                {/* Stats */}
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>My Activity Summary</Text>
                
                <View style={styles.statsRow}>
                    <PressableScale style={styles.statPressable} onPress={() => navigation.navigate('AttendanceHistory')}>
                        <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                            <Card.Content style={styles.statContent}>
                                <View style={[styles.accentLine, { backgroundColor: '#10b981' }]} />
                                <Text variant="headlineMedium" style={{ color: '#10b981', fontWeight: 'bold' }}>
                                    {eventsWorked}
                                </Text>
                                <Text variant="bodySmall" style={styles.statLabel}>Events Worked</Text>
                            </Card.Content>
                        </Card>
                    </PressableScale>

                    <PressableScale style={styles.statPressable} onPress={() => navigation.navigate('Earnings')}>
                        <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                            <Card.Content style={styles.statContent}>
                                <View style={[styles.accentLine, { backgroundColor: '#3b82f6' }]} />
                                <Text variant="headlineMedium" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                    ₹{totalEarned}
                                </Text>
                                <Text variant="bodySmall" style={styles.statLabel}>Total Earned</Text>
                            </Card.Content>
                        </Card>
                    </PressableScale>

                    <PressableScale style={styles.statPressable} onPress={() => navigation.navigate('Earnings')}>
                        <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                            <Card.Content style={styles.statContent}>
                                <View style={[styles.accentLine, { backgroundColor: '#eab308' }]} />
                                <Text variant="headlineMedium" style={{ color: '#eab308', fontWeight: 'bold' }}>
                                    ₹{pendingPayouts}
                                </Text>
                                <Text variant="bodySmall" style={styles.statLabel}>Pending</Text>
                            </Card.Content>
                        </Card>
                    </PressableScale>
                </View>

                {/* Upcoming Assignments */}
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Upcoming Event Schedule</Text>
                
                {upcomingAssignments.length === 0 ? (
                    <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Card.Content>
                            <Text style={styles.emptyText}>No upcoming assigned events. Check "Available" events to accept work.</Text>
                        </Card.Content>
                    </Card>
                ) : (
                    upcomingAssignments.map(item => (
                        <PressableScale
                            key={item.id}
                            onPress={() => navigation.navigate('EventDetails', { eventId: item.eventId })}
                        >
                            <Card
                                style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}
                                elevation={1}
                            >
                                <Card.Content>
                                    <Text variant="titleMedium" style={[styles.eventTitle, { color: theme.colors.onSurface, fontWeight: 'bold' }]}>{item.eventTitle}</Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                                        📅 {item.eventDate.toDate().toLocaleDateString()}  |  Rate: ₹{item.payoutAmount}
                                    </Text>
                                </Card.Content>
                            </Card>
                        </PressableScale>
                    ))
                )}

                {/* Profile Form */}
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>My Profile & Payout Details</Text>
                
                <Card style={[styles.profileCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <Card.Content style={{ gap: 6 }}>
                        <TextInput
                            label="Full Name *"
                            value={name}
                            onChangeText={setName}
                            mode="flat"
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                            activeUnderlineColor={theme.colors.primary}
                        />
                        <TextInput
                            label="Phone Number *"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            mode="flat"
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                            activeUnderlineColor={theme.colors.primary}
                        />
                        <TextInput
                            label="Address"
                            value={address}
                            onChangeText={setAddress}
                            mode="flat"
                            multiline
                            numberOfLines={2}
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                            activeUnderlineColor={theme.colors.primary}
                        />
                        <TextInput
                            label="Emergency Contact Number"
                            value={emergencyContact}
                            onChangeText={setEmergencyContact}
                            keyboardType="phone-pad"
                            mode="flat"
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                            activeUnderlineColor={theme.colors.primary}
                        />

                        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                        <Text variant="titleMedium" style={[styles.formSubTitle, { color: theme.colors.primary }]}>Bank Payout Details</Text>

                        <TextInput
                            label="Bank Account Holder Name *"
                            value={accountHolderName}
                            onChangeText={setAccountHolderName}
                            mode="flat"
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                            activeUnderlineColor={theme.colors.primary}
                        />
                        <TextInput
                            label="Bank Account Number *"
                            value={bankAccount}
                            onChangeText={setBankAccount}
                            keyboardType="numeric"
                            mode="flat"
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                            activeUnderlineColor={theme.colors.primary}
                        />
                        <TextInput
                            label="IFSC Code *"
                            value={ifscCode}
                            onChangeText={setIfscCode}
                            autoCapitalize="characters"
                            mode="flat"
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                            activeUnderlineColor={theme.colors.primary}
                        />
                        <TextInput
                            label="GPay UPI ID *"
                            placeholder="name@okaxis"
                            value={upiId}
                            onChangeText={setUpiId}
                            autoCapitalize="none"
                            mode="flat"
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                            activeUnderlineColor={theme.colors.primary}
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                        />

                        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                        <Text variant="titleMedium" style={[styles.formSubTitle, { color: theme.colors.primary, marginBottom: 8 }]}>UPI QR Code (PNG / JPEG) *</Text>
                        
                        {dbUser?.workerDetails?.qrCodeUrl ? (
                            <View style={styles.qrContainer}>
                                <Image
                                    source={{ uri: dbUser.workerDetails.qrCodeUrl }}
                                    style={[styles.qrImage, { borderColor: theme.colors.outline }]}
                                    resizeMode="contain"
                                />
                                <PressableScale style={{ width: '100%' }}>
                                    <Button
                                        mode="outlined"
                                        onPress={handleUploadQrCode}
                                        style={[styles.uploadBtn, { borderColor: theme.colors.outline }]}
                                        icon="file-image-plus-outline"
                                        disabled={qrUploading}
                                        textColor={theme.colors.primary}
                                    >
                                        Replace QR Code Image
                                    </Button>
                                </PressableScale>
                            </View>
                        ) : (
                            <View style={styles.noQrContainer}>
                                <Text style={[styles.noQrText, { color: theme.colors.onSurfaceVariant }]}>No UPI QR code uploaded yet.</Text>
                                <PressableScale style={{ width: '100%' }}>
                                    <Button
                                        mode="contained"
                                        onPress={handleUploadQrCode}
                                        loading={qrUploading}
                                        disabled={qrUploading}
                                        style={styles.uploadBtn}
                                        icon="file-image-plus"
                                        buttonColor={theme.colors.primary}
                                        textColor={theme.colors.onPrimary}
                                    >
                                        Upload QR Code Image
                                    </Button>
                                </PressableScale>
                            </View>
                        )}

                        <PressableScale style={{ width: '100%', marginTop: 8 }}>
                            <Button
                                mode="contained"
                                onPress={handleSaveProfile}
                                loading={profileLoading}
                                disabled={profileLoading}
                                style={styles.saveBtn}
                                icon="account-check-outline"
                                buttonColor={theme.colors.primary}
                                textColor={theme.colors.onPrimary}
                            >
                                Save Profile & Payout Details
                            </Button>
                        </PressableScale>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 24,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        marginLeft: 16,
        flex: 1,
    },
    userName: {
        fontWeight: 'bold',
    },
    userRole: {
        fontWeight: 'bold',
        fontSize: 11,
        letterSpacing: 1,
    },
    logoutBtn: {
        borderRadius: 8,
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontWeight: '700',
        marginVertical: 12,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    statPressable: {
        flex: 1,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statContent: {
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
        position: 'relative',
    },
    accentLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    statLabel: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
    },
    emptyCard: {
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 18,
    },
    eventCard: {
        marginBottom: 12,
        borderRadius: 12,
    },
    eventTitle: {
        fontWeight: 'bold',
    },
    profileCard: {
        borderRadius: 12,
        marginBottom: 24,
    },
    input: {
        marginBottom: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    divider: {
        marginVertical: 14,
    },
    formSubTitle: {
        fontWeight: '700',
    },
    qrContainer: {
        alignItems: 'center',
        marginVertical: 8,
        gap: 8,
    },
    qrImage: {
        width: 160,
        height: 160,
        borderRadius: 8,
        borderWidth: 1.5,
        marginBottom: 6,
    },
    noQrContainer: {
        alignItems: 'center',
        paddingVertical: 12,
        gap: 10,
    },
    noQrText: {
        fontSize: 13,
    },
    uploadBtn: {
        width: '100%',
        borderRadius: 8,
    },
    saveBtn: {
        width: '100%',
        borderRadius: 8,
        paddingVertical: 6,
    },
});

export default WorkerDashboard;
