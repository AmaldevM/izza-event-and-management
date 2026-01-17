// Payment Service - Track and manage worker payments

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
import { Payment } from '../types';

const PAYMENTS_COLLECTION = 'payments';

// Create a payment record
export const createPayment = async (
    workerId: string,
    workerName: string,
    eventId: string,
    eventTitle: string,
    amount: number
): Promise<string> => {
    try {
        const newPayment = {
            workerId,
            workerName,
            eventId,
            eventTitle,
            amount,
            status: 'pending',
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), newPayment);
        return docRef.id;
    } catch (error) {
        console.error('Error creating payment:', error);
        throw new Error('Failed to create payment');
    }
};

// Mark payment as paid
export const markPaymentAsPaid = async (paymentId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, PAYMENTS_COLLECTION, paymentId), {
            status: 'paid',
            paidAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error marking payment as paid:', error);
        throw new Error('Failed to update payment');
    }
};

// Get worker payments
export const getWorkerPayments = async (workerId: string): Promise<Payment[]> => {
    try {
        const q = query(
            collection(db, PAYMENTS_COLLECTION),
            where('workerId', '==', workerId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    } catch (error) {
        console.error('Error getting payments:', error);
        throw new Error('Failed to fetch payments');
    }
};

// Get all pending payments
export const getPendingPayments = async (): Promise<Payment[]> => {
    try {
        const q = query(
            collection(db, PAYMENTS_COLLECTION),
            where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    } catch (error) {
        console.error('Error getting pending payments:', error);
        throw new Error('Failed to fetch pending payments');
    }
};
