// TypeScript Type Definitions for IZZA Catering App

import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin' | 'worker';

export type EventStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export type PaymentStatus = 'pending' | 'paid';

export type NotificationType =
    | 'event_approved'
    | 'event_rejected'
    | 'event_assigned'
    | 'payment_received'
    | 'broadcast'
    | 'attendance_reminder';

// User Interface
export interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: UserRole;
    workerDetails?: WorkerDetails;
    createdAt: Timestamp;
}

// Worker Details Interface
export interface WorkerDetails {
    bankAccount: string;
    ifscCode: string;
    upiId: string;
}

// Event Interface
export interface Event {
    id: string;
    title: string;
    description: string;
    eventDate: Timestamp;
    location: string;
    status: EventStatus;
    userId: string; // Reference to user who created the event
    userName?: string; // Denormalized for display
    assignedWorkers: string[]; // Array of worker IDs
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Attendance Interface
export interface Attendance {
    id: string;
    eventId: string;
    workerId: string;
    workerName?: string;
    eventTitle?: string;
    checkInTime: Timestamp;
    checkOutTime?: Timestamp;
    status: 'present' | 'absent';
    earnings: number;
    createdAt: Timestamp;
}

// Payment Interface
export interface Payment {
    id: string;
    workerId: string;
    workerName?: string;
    eventId: string;
    eventTitle?: string;
    amount: number;
    status: PaymentStatus;
    paidAt?: Timestamp;
    createdAt: Timestamp;
}

// Notification Interface
export interface Notification {
    id: string;
    recipientId: string; // User ID or 'all' for broadcast
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    createdAt: Timestamp;
}

// Auth Context State
export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

// Form Data Interfaces
export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    role: UserRole;
    workerDetails?: WorkerDetails;
}

export interface EventFormData {
    title: string;
    description: string;
    eventDate: Date;
    location: string;
}

export interface WorkerFormData {
    bankAccount: string;
    ifscCode: string;
    upiId: string;
}

// Navigation Types
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    UserDashboard: undefined;
    AdminDashboard: undefined;
    WorkerDashboard: undefined;
};

export type UserStackParamList = {
    Dashboard: undefined;
    EventRequest: undefined;
    MyEvents: undefined;
    EventDetails: { eventId: string };
};

export type AdminStackParamList = {
    Dashboard: undefined;
    EventManagement: undefined;
    WorkerManagement: undefined;
    CalendarView: undefined;
    PaymentTracking: undefined;
    EventDetails: { eventId: string };
    AssignWorkers: { eventId: string };
};

export type WorkerStackParamList = {
    Dashboard: undefined;
    AvailableEvents: undefined;
    MyAssignments: undefined;
    Attendance: undefined;
    Earnings: undefined;
    EventDetails: { eventId: string };
    CheckIn: { eventId: string };
};
