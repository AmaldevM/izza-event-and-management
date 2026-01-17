// Event Service - All Firestore operations related to events

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { Event, EventFormData, EventStatus } from '../types';

const EVENTS_COLLECTION = 'events';

// Create a new event
export const createEvent = async (
    userId: string,
    userName: string,
    eventData: EventFormData
): Promise<string> => {
    try {
        const newEvent = {
            ...eventData,
            eventDate: Timestamp.fromDate(eventData.eventDate),
            userId,
            userName,
            status: 'pending' as EventStatus,
            assignedWorkers: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, EVENTS_COLLECTION), newEvent);
        return docRef.id;
    } catch (error) {
        console.error('Error creating event:', error);
        throw new Error('Failed to create event');
    }
};

// Get event by ID
export const getEventById = async (eventId: string): Promise<Event | null> => {
    try {
        const eventDoc = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
        if (eventDoc.exists()) {
            return { id: eventDoc.id, ...eventDoc.data() } as Event;
        }
        return null;
    } catch (error) {
        console.error('Error getting event:', error);
        throw new Error('Failed to fetch event');
    }
};

// Get all events
export const getAllEvents = async (): Promise<Event[]> => {
    try {
        const q = query(collection(db, EVENTS_COLLECTION), orderBy('eventDate', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
        console.error('Error getting events:', error);
        throw new Error('Failed to fetch events');
    }
};

// Get events by user ID
export const getEventsByUserId = async (userId: string): Promise<Event[]> => {
    try {
        const q = query(
            collection(db, EVENTS_COLLECTION),
            where('userId', '==', userId),
            orderBy('eventDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
        console.error('Error getting user events:', error);
        throw new Error('Failed to fetch user events');
    }
};

// Get events by status
export const getEventsByStatus = async (status: EventStatus): Promise<Event[]> => {
    try {
        const q = query(
            collection(db, EVENTS_COLLECTION),
            where('status', '==', status),
            orderBy('eventDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
        console.error('Error getting events by status:', error);
        throw new Error('Failed to fetch events');
    }
};

// Get events assigned to a worker
export const getWorkerEvents = async (workerId: string): Promise<Event[]> => {
    try {
        const q = query(
            collection(db, EVENTS_COLLECTION),
            where('assignedWorkers', 'array-contains', workerId),
            orderBy('eventDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
        console.error('Error getting worker events:', error);
        throw new Error('Failed to fetch worker events');
    }
};

// Update event
export const updateEvent = async (
    eventId: string,
    eventData: Partial<EventFormData>
): Promise<void> => {
    try {
        const updateData: any = {
            ...eventData,
            updatedAt: Timestamp.now(),
        };

        if (eventData.eventDate) {
            updateData.eventDate = Timestamp.fromDate(eventData.eventDate);
        }

        await updateDoc(doc(db, EVENTS_COLLECTION, eventId), updateData);
    } catch (error) {
        console.error('Error updating event:', error);
        throw new Error('Failed to update event');
    }
};

// Update event status
export const updateEventStatus = async (
    eventId: string,
    status: EventStatus
): Promise<void> => {
    try {
        await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
            status,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error updating event status:', error);
        throw new Error('Failed to update event status');
    }
};

// Assign workers to event
export const assignWorkersToEvent = async (
    eventId: string,
    workerIds: string[]
): Promise<void> => {
    try {
        await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
            assignedWorkers: workerIds,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error assigning workers:', error);
        throw new Error('Failed to assign workers');
    }
};

// Delete event
export const deleteEvent = async (eventId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
    } catch (error) {
        console.error('Error deleting event:', error);
        throw new Error('Failed to delete event');
    }
};
