// Assignment Service - Operations for event assignments
import {
    collection,
    doc,
    getDocs,
    updateDoc,
    query,
    where,
    writeBatch,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { EventAssignment } from '../types';
import { createNotification } from './notificationService';

const ASSIGNMENTS_COLLECTION = 'event_assignments';

// Assign workers to an event
export const assignWorkersToEvent = async (
    eventId: string,
    eventTitle: string,
    eventDate: Timestamp,
    workers: { id: string; name: string }[],
    payoutAmount: number
): Promise<void> => {
    try {
        const assignmentsRef = collection(db, ASSIGNMENTS_COLLECTION);
        
        // 1. Get existing assignments for this event
        const q = query(assignmentsRef, where('eventId', '==', eventId));
        const snapshot = await getDocs(q);
        const existingAssignments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as EventAssignment));

        const newWorkerIds = workers.map(w => w.id);
        const batch = writeBatch(db);

        // 2. Delete assignments for workers who are no longer assigned
        for (const existing of existingAssignments) {
            if (!newWorkerIds.includes(existing.workerId)) {
                batch.delete(doc(db, ASSIGNMENTS_COLLECTION, existing.id));
            }
        }

        // 3. Add or update assignments for the new worker list
        for (const worker of workers) {
            const existing = existingAssignments.find(e => e.workerId === worker.id);
            if (existing) {
                // Update payout if changed
                if (existing.payoutAmount !== payoutAmount) {
                    batch.update(doc(db, ASSIGNMENTS_COLLECTION, existing.id), {
                        payoutAmount,
                        updatedAt: Timestamp.now()
                    });
                }
            } else {
                // Create new assignment
                const newAssignmentRef = doc(collection(db, ASSIGNMENTS_COLLECTION));
                batch.set(newAssignmentRef, {
                    eventId,
                    eventTitle,
                    eventDate,
                    workerId: worker.id,
                    workerName: worker.name,
                    status: 'assigned', // initial status when admin assigns them
                    payoutAmount,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });

                // Send notification to worker
                await createNotification(
                    worker.id,
                    'New Event Assignment',
                    `You have been assigned to event "${eventTitle}" on ${eventDate.toDate().toLocaleDateString()}. Please accept or decline.`,
                    'event_assigned'
                );
            }
        }

        // 4. Update the event document with assignedWorkers array
        const eventRef = doc(db, 'events', eventId);
        batch.update(eventRef, {
            assignedWorkers: newWorkerIds,
            updatedAt: Timestamp.now()
        });

        await batch.commit();
    } catch (error) {
        console.error('Error assigning workers to event:', error);
        throw new Error('Failed to assign workers');
    }
};

// Get assignments for a worker
export const getWorkerAssignments = async (workerId: string): Promise<EventAssignment[]> => {
    try {
        const q = query(
            collection(db, ASSIGNMENTS_COLLECTION),
            where('workerId', '==', workerId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventAssignment));
    } catch (error) {
        console.error('Error getting worker assignments:', error);
        throw new Error('Failed to fetch worker assignments');
    }
};

// Get assignments for an event
export const getEventAssignments = async (eventId: string): Promise<EventAssignment[]> => {
    try {
        const q = query(
            collection(db, ASSIGNMENTS_COLLECTION),
            where('eventId', '==', eventId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventAssignment));
    } catch (error) {
        console.error('Error getting event assignments:', error);
        throw new Error('Failed to fetch event assignments');
    }
};

// Update assignment status (accept/decline)
export const updateAssignmentStatus = async (
    assignmentId: string,
    status: 'accepted' | 'declined'
): Promise<void> => {
    try {
        await updateDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId), {
            status,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating assignment status:', error);
        throw new Error('Failed to update assignment status');
    }
};
