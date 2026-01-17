// Notification Service - Handle notifications and broadcasts

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { Notification, NotificationType } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

// Create a notification
export const createNotification = async (
    recipientId: string,
    title: string,
    message: string,
    type: NotificationType
): Promise<string> => {
    try {
        const newNotification = {
            recipientId,
            title,
            message,
            type,
            read: false,
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), newNotification);
        return docRef.id;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw new Error('Failed to create notification');
    }
};

// Broadcast notification to all workers
export const broadcastToWorkers = async (
    title: string,
    message: string
): Promise<void> => {
    try {
        await createNotification('all', title, message, 'broadcast');
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        throw new Error('Failed to broadcast notification');
    }
};

// Get notifications for a user
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('recipientId', 'in', [userId, 'all']),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error) {
        console.error('Error getting notifications:', error);
        throw new Error('Failed to fetch notifications');
    }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
            read: true,
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to update notification');
    }
};

// Get unread notification count
export const getUnreadCount = async (userId: string): Promise<number> => {
    try {
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('recipientId', 'in', [userId, 'all']),
            where('read', '==', false)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
};
