// Authentication Context - Manages user authentication state across the app

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.config';
import { User, LoginFormData, RegisterFormData, AuthState } from '../types';

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
                        setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
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

    // Login function
    const login = async ({ email, password }: LoginFormData) => {
        try {
            setError(null);
            setLoading(true);

            const userCredential: UserCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            // Fetch user data
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (userDoc.exists()) {
                setUser({ id: userCredential.user.uid, ...userDoc.data() } as User);
            }

            setLoading(false);
        } catch (err: any) {
            setLoading(false);
            const errorMessage = err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
                ? 'Invalid email or password'
                : 'Login failed. Please try again.';
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

            // Create auth user
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            // Create user document in Firestore
            const newUser: Omit<User, 'id'> = {
                email: data.email,
                name: data.name,
                phone: data.phone,
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
            const errorMessage = err.code === 'auth/email-already-in-use'
                ? 'Email already registered'
                : err.message || 'Registration failed. Please try again.';
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
