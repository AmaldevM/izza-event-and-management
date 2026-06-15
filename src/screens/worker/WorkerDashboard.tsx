import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Image } from 'react-native';
import { Card, Text, Button, Avatar, Surface, TextInput, ActivityIndicator, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase.config';
import { getWorkerAssignments } from '../../services/assignmentService';
import { getWorkerAttendance } from '../../services/attendanceService';
import { getWorkerPayments } from '../../services/paymentService';
import { EventAssignment, User } from '../../types';

const WorkerDashboard = ({ navigation }: any) => {
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
            // 1. Fetch latest user doc
            const userDoc = await getDoc(doc(db, 'users', user.id));
            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() } as User;
                setDbUser(userData);
                
                // Initialize form states
                setName(userData.name || '');
                setPhone(userData.phone || '');
                setAddress(userData.workerDetails?.address || '');
                setEmergencyContact(userData.workerDetails?.emergencyContact || '');
                setBankAccount(userData.workerDetails?.bankAccount || '');
                setAccountHolderName(userData.workerDetails?.accountHolderName || '');
                setIfscCode(userData.workerDetails?.ifscCode || '');
                setUpiId(userData.workerDetails?.upiId || '');
            }

            // 2. Fetch Assignments
            const allAssignments = await getWorkerAssignments(user.id);
            const now = Timestamp.now().toDate();
            
            // Filter upcoming accepted ones
            const upcoming = allAssignments.filter(a => 
                a.status === 'accepted' && 
                a.eventDate.toDate() >= now
            );
            upcoming.sort((a, b) => a.eventDate.seconds - b.eventDate.seconds);
            setUpcomingAssignments(upcoming);

            // 3. Fetch Attendance
            const attendanceList = await getWorkerAttendance(user.id);
            setEventsWorked(attendanceList.filter(a => a.status === 'present').length);

            // 4. Fetch Payments
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
            // Request gallery permissions
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

            // Fetch local URI and convert to Blob
            const response = await fetch(selectedUri);
            const blob = await response.blob();

            // Upload to Firebase Storage
            const storageRef = ref(storage, `qrcodes/${user.id}.jpg`);
            await uploadBytes(storageRef, blob);

            // Get download URL
            const downloadUrl = await getDownloadURL(storageRef);

            // Update Firestore
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#388e3c" />
                <Text style={styles.loadingText}>Loading worker profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyboardShouldPersistTaps="handled"
        >
            {/* Header */}
            <Surface style={styles.header}>
                <View style={styles.headerContent}>
                    <Avatar.Icon size={50} icon="chef-hat" style={styles.avatar} />
                    <View style={styles.userInfo}>
                        <Text variant="titleLarge" style={styles.userName}>{dbUser?.name}</Text>
                        <Text variant="bodySmall" style={styles.userRole}>CATERING STAFF MEMBER</Text>
                    </View>
                    <Button mode="outlined" textColor="#fff" onPress={logout} style={styles.logoutBtn}>
                        Logout
                    </Button>
                </View>
            </Surface>

            <View style={styles.content}>
                {/* Stats */}
                <Text variant="titleMedium" style={styles.sectionTitle}>My Activity Summary</Text>
                <View style={styles.statsRow}>
                    <Card style={[styles.statCard, { backgroundColor: '#e8f5e9' }]} onPress={() => navigation.navigate('AttendanceHistory')}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="headlineMedium" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                {eventsWorked}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Events Worked</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: '#e3f2fd' }]} onPress={() => navigation.navigate('Earnings')}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="headlineMedium" style={{ color: '#1565c0', fontWeight: 'bold' }}>
                                ₹{totalEarned}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Earnings Received</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: '#ffe0b2' }]} onPress={() => navigation.navigate('Earnings')}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="headlineMedium" style={{ color: '#e65100', fontWeight: 'bold' }}>
                                ₹{pendingPayouts}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Pending Payouts</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Upcoming Assignments */}
                <Text variant="titleMedium" style={styles.sectionTitle}>Upcoming Event Schedule</Text>
                {upcomingAssignments.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text style={styles.emptyText}>No upcoming assigned events. Check "Available" events to accept work.</Text>
                        </Card.Content>
                    </Card>
                ) : (
                    upcomingAssignments.map(item => (
                        <Card
                            key={item.id}
                            style={styles.eventCard}
                            onPress={() => navigation.navigate('EventDetails', { eventId: item.eventId })}
                        >
                            <Card.Content>
                                <Text variant="titleMedium" style={styles.eventTitle}>{item.eventTitle}</Text>
                                <Text variant="bodySmall" style={styles.eventMeta}>
                                    📅 {item.eventDate.toDate().toLocaleDateString()}  |  Rate: ₹{item.payoutAmount}
                                </Text>
                            </Card.Content>
                        </Card>
                    ))
                )}

                {/* Profile Form */}
                <Text variant="titleMedium" style={styles.sectionTitle}>My Profile & Payout Details</Text>
                <Card style={styles.profileCard}>
                    <Card.Content>
                        <TextInput
                            label="Full Name *"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="Phone Number *"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="Address"
                            value={address}
                            onChangeText={setAddress}
                            mode="outlined"
                            multiline
                            numberOfLines={2}
                            style={styles.input}
                        />
                        <TextInput
                            label="Emergency Contact Number"
                            value={emergencyContact}
                            onChangeText={setEmergencyContact}
                            keyboardType="phone-pad"
                            mode="outlined"
                            style={styles.input}
                        />

                        <Divider style={styles.divider} />
                        <Text variant="titleSmall" style={styles.formSubTitle}>Bank Payout details</Text>

                        <TextInput
                            label="Bank Account Holder Name *"
                            value={accountHolderName}
                            onChangeText={setAccountHolderName}
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="Bank Account Number *"
                            value={bankAccount}
                            onChangeText={setBankAccount}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="IFSC Code *"
                            value={ifscCode}
                            onChangeText={setIfscCode}
                            autoCapitalize="characters"
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="GPay UPI ID *"
                            placeholder="name@okaxis"
                            value={upiId}
                            onChangeText={setUpiId}
                            autoCapitalize="none"
                            mode="outlined"
                            style={styles.input}
                        />

                        <Divider style={styles.divider} />
                        <Text variant="titleSmall" style={styles.formSubTitle}>GPay QR Code (PNG / JPEG) *</Text>
                        
                        {dbUser?.workerDetails?.qrCodeUrl ? (
                            <View style={styles.qrContainer}>
                                <Image
                                    source={{ uri: dbUser.workerDetails.qrCodeUrl }}
                                    style={styles.qrImage}
                                    resizeMode="contain"
                                />
                                <Button
                                    mode="outlined"
                                    onPress={handleUploadQrCode}
                                    style={styles.uploadBtn}
                                    icon="file-image-plus-outline"
                                    disabled={qrUploading}
                                >
                                    Replace QR Code Image
                                </Button>
                            </View>
                        ) : (
                            <View style={styles.noQrContainer}>
                                <Text style={styles.noQrText}>No UPI QR code uploaded yet.</Text>
                                <Button
                                    mode="contained"
                                    buttonColor="#388e3c"
                                    textColor="#fff"
                                    onPress={handleUploadQrCode}
                                    loading={qrUploading}
                                    disabled={qrUploading}
                                    style={styles.uploadBtn}
                                    icon="file-image-plus"
                                >
                                    Upload QR Code Image
                                </Button>
                            </View>
                        )}

                        <Button
                            mode="contained"
                            buttonColor="#388e3c"
                            textColor="#fff"
                            onPress={handleSaveProfile}
                            loading={profileLoading}
                            disabled={profileLoading}
                            style={styles.saveBtn}
                            icon="account-check-outline"
                        >
                            Save Profile & Payment Info
                        </Button>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
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
        padding: 16,
        backgroundColor: '#388e3c',
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    userInfo: {
        marginLeft: 16,
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontWeight: 'bold',
    },
    userRole: {
        color: '#c8e6c9',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    logoutBtn: {
        borderColor: '#fff',
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginVertical: 12,
        color: '#333',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 3,
        borderRadius: 8,
        elevation: 2,
    },
    statContent: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    statLabel: {
        color: '#666',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
    },
    emptyCard: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 1,
        borderRadius: 8,
    },
    emptyText: {
        color: '#777',
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 18,
    },
    eventCard: {
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: '#fff',
        elevation: 2,
    },
    eventTitle: {
        fontWeight: 'bold',
    },
    eventMeta: {
        color: '#666',
        marginTop: 2,
    },
    profileCard: {
        borderRadius: 8,
        backgroundColor: '#fff',
        elevation: 2,
        marginBottom: 24,
    },
    input: {
        marginBottom: 12,
    },
    divider: {
        marginVertical: 16,
    },
    formSubTitle: {
        fontWeight: 'bold',
        color: '#388e3c',
        marginBottom: 12,
    },
    qrContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    qrImage: {
        width: 180,
        height: 180,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 10,
    },
    noQrContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    noQrText: {
        color: '#888',
        marginBottom: 10,
    },
    uploadBtn: {
        width: '100%',
        marginBottom: 16,
        borderRadius: 8,
    },
    saveBtn: {
        marginTop: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
});

export default WorkerDashboard;
