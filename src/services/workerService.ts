// Worker Service - Operations for worker profiles and assignments

import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { User, WorkerFormData } from '../types';

const USERS_COLLECTION = 'users';

// Get all workers
export const getAllWorkers = async (): Promise<User[]> => {
    try {
        const q = query(
            collection(db, USERS_COLLECTION),
            where('role', '==', 'worker')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
        console.error('Error getting workers:', error);
        throw new Error('Failed to fetch workers');
    }
};

// Get worker by ID
export const getWorkerById = async (workerId: string): Promise<User | null> => {
    try {
        const workerDoc = await getDoc(doc(db, USERS_COLLECTION, workerId));
        if (workerDoc.exists() && workerDoc.data().role === 'worker') {
            return { id: workerDoc.id, ...workerDoc.data() } as User;
        }
        return null;
    } catch (error) {
        console.error('Error getting worker:', error);
        throw new Error('Failed to fetch worker');
    }
};

// Update worker payment details
export const updateWorkerDetails = async (
    workerId: string,
    workerDetails: WorkerFormData
): Promise<void> => {
    try {
        await updateDoc(doc(db, USERS_COLLECTION, workerId), {
            workerDetails,
        });
    } catch (error) {
        console.error('Error updating worker details:', error);
        throw new Error('Failed to update worker details');
    }
};
