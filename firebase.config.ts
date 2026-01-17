// Firebase Configuration
// Firebase project: izza-event-management

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyA6tHvuekk9WHO_I0ebRj312_S1nuD_z2o",
    authDomain: "izza-event-management.firebaseapp.com",
    projectId: "izza-event-management",
    storageBucket: "izza-event-management.firebasestorage.app",
    messagingSenderId: "401032493373",
    appId: "1:401032493373:web:d6278f0130b68594ae2d54",
    measurementId: "G-YJK7M4VTQG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
