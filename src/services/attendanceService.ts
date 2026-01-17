// Attendance Service - Track worker attendance for events

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { Attendance } from '../types';

const ATTENDANCE_COLLECTION = 'attendance';

// Mark check-in
export const checkIn = async (
    eventId: string,
    workerId: string,
    workerName: string,
    eventTitle: string,
    earnings: number
): Promise<string> => {
    try {
        const newAttendance = {
            eventId,
            workerId,
            workerName,
            eventTitle,
            checkInTime: Timestamp.now(),
            status: 'present',
            earnings,
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), newAttendance);
        return docRef.id;
    } catch (error) {
        console.error('Error checking in:', error);
        throw new Error('Failed to check in');
    }
};

// Mark check-out
export const checkOut = async (attendanceId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, ATTENDANCE_COLLECTION, attendanceId), {
            checkOutTime: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error checking out:', error);
        throw new Error('Failed to check out');
    }
};

// Get attendance by worker
export const getWorkerAttendance = async (workerId: string): Promise<Attendance[]> => {
    try {
        const q = query(
            collection(db, ATTENDANCE_COLLECTION),
            where('workerId', '==', workerId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
    } catch (error) {
        console.error('Error getting attendance:', error);
        throw new Error('Failed to fetch attendance');
    }
};

// Get attendance for an event
export const getEventAttendance = async (eventId: string): Promise<Attendance[]> => {
    try {
        const q = query(
            collection(db, ATTENDANCE_COLLECTION),
            where('eventId', '==', eventId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
    } catch (error) {
        console.error('Error getting event attendance:', error);
        throw new Error('Failed to fetch event attendance');
    }
};
