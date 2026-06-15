// Authentication Context - Manages user authentication state across the app

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase.config';
import { User, LoginFormData, RegisterFormData, AuthState } from '../types';
import { getFirebaseErrorMessage } from '../utils/errorMessages';

interface AuthContextType extends AuthState {
    login: (data: LoginFormData) => Promise<void>;
    register: (data: RegisterFormData) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

// Helper: detect if input is a phone number
const isPhoneNumber = (input: string): boolean => {
    const cleaned = input.trim().replace(/[\s\-\(\)]/g, '');
    return /^\+?\d{10,15}$/.test(cleaned);
};

// Helper: look up email by phone number in Firestore
const getEmailByPhone = async (phone: string): Promise<string | null> => {
    try {
        const usersRef = collection(db, 'users');
        // Try with and without +91 prefix
        const phoneVariants = [phone];
        if (!phone.startsWith('+')) {
            phoneVariants.push('+91' + phone);
        }
        if (phone.startsWith('+91')) {
            phoneVariants.push(phone.substring(3));
        }

        for (const variant of phoneVariants) {
            const q = query(usersRef, where('phone', '==', variant));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                return userData.email || null;
            }
        }
        return null;
    } catch (error) {
        console.error('Error looking up email by phone:', error);
        return null;
    }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listen for authentication state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.role === 'user') {
                            await signOut(auth);
                            setUser(null);
                        } else {
                            setUser({ id: firebaseUser.uid, ...userData } as User);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching user data:', err);
                    setError('Failed to load user data');
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Login function - supports email or phone number
    const login = async ({ emailOrPhone, password }: LoginFormData) => {
        try {
            setError(null);
            setLoading(true);

            let email = emailOrPhone;

            // If input looks like a phone number, look up the associated email
            if (isPhoneNumber(emailOrPhone)) {
                const foundEmail = await getEmailByPhone(emailOrPhone);
                if (!foundEmail) {
                    throw { code: 'auth/user-not-found', message: 'No account found with this phone number.' };
                }
                email = foundEmail;
            }

            const userCredential: UserCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            // Fetch user data
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === 'user') {
                    await signOut(auth);
                    throw new Error('Access denied. This version of the app is only for Administrators and Catering Staff.');
                }
                setUser({ id: userCredential.user.uid, ...userData } as User);
            }

            setLoading(false);
        } catch (err: any) {
            setLoading(false);
            const errorMessage = err.code
                ? getFirebaseErrorMessage(err.code)
                : err.message || 'Login failed. Please try again.';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Register function
    const register = async (data: RegisterFormData) => {
        try {
            setError(null);
            setLoading(true);

            // Validate passwords match
            if (data.password !== data.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            let email = data.emailOrPhone;
            let phone = '';

            if (isPhoneNumber(data.emailOrPhone)) {
                phone = data.emailOrPhone;
                // Generate a dummy email format for Firebase Auth (remove any '+' symbols to be safe)
                const cleanedPhone = phone.trim().replace(/[\s\-\(\)\+]/g, '');
                email = `${cleanedPhone}@izza.com`;

                // Check if this phone number is already registered in Firestore
                const existingEmail = await getEmailByPhone(phone);
                if (existingEmail) {
                    throw { code: 'auth/email-already-in-use', message: 'This phone number is already registered. Try logging in instead.' };
                }
            } else {
                if (!email.includes('@')) {
                    throw new Error('Please enter a valid email address.');
                }
            }

            // Create auth user
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                data.password
            );

            // Create user document in Firestore
            const newUser: Omit<User, 'id'> = {
                email: email,
                name: data.name,
                phone: phone,
                emailVerified: true, // Pre-verified
                role: data.role,
                createdAt: new Date() as any,
                ...(data.role === 'worker' && data.workerDetails
                    ? { workerDetails: data.workerDetails }
                    : {}
                )
            };

            await setDoc(doc(db, 'users', userCredential.user.uid), newUser);

            setUser({ id: userCredential.user.uid, ...newUser } as User);
            setLoading(false);
        } catch (err: any) {
            setLoading(false);
            const errorMessage = err.code
                ? getFirebaseErrorMessage(err.code)
                : err.message || 'Something went wrong. Please try again later.';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (err) {
            console.error('Logout error:', err);
            throw new Error('Logout failed');
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        error,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
