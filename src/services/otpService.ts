import { doc, setDoc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase.config';
import emailjs from '@emailjs/browser';

const OTP_COLLECTION = 'otp_codes';
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

// EmailJS configuration - user will need to set these up
// For now, use placeholder IDs that the user can replace
const EMAILJS_SERVICE_ID = 'service_izza';
const EMAILJS_TEMPLATE_ID = 'template_otp';
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';

export const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtpEmail = async (email: string): Promise<void> => {
    const code = generateOtp();
    
    // Store OTP in Firestore
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
    
    await setDoc(doc(db, OTP_COLLECTION, email), {
        code,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
        attempts: 0,
    });
    
    // Send email via EmailJS
    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: email,
            otp_code: code,
            app_name: 'IZZA Catering',
            expiry_minutes: OTP_EXPIRY_MINUTES.toString(),
        }, EMAILJS_PUBLIC_KEY);
    } catch (error) {
        // If EmailJS fails, log the OTP to console for development
        console.log('📧 OTP Code for', email, ':', code);
        console.warn('EmailJS not configured. Check console for OTP code during development.');
    }
};

export const verifyOtp = async (email: string, inputCode: string): Promise<boolean> => {
    const otpDoc = await getDoc(doc(db, OTP_COLLECTION, email));
    
    if (!otpDoc.exists()) {
        throw new Error('No verification code found. Please request a new one.');
    }
    
    const data = otpDoc.data();
    
    // Check attempts
    if (data.attempts >= MAX_ATTEMPTS) {
        await deleteDoc(doc(db, OTP_COLLECTION, email));
        throw new Error('Too many incorrect attempts. Please request a new code.');
    }
    
    // Check expiry
    const now = new Date();
    const expiresAt = data.expiresAt.toDate();
    if (now > expiresAt) {
        await deleteDoc(doc(db, OTP_COLLECTION, email));
        throw new Error('Verification code has expired. Please request a new one.');
    }
    
    // Check code
    if (data.code !== inputCode) {
        // Increment attempts
        await setDoc(doc(db, OTP_COLLECTION, email), {
            ...data,
            attempts: data.attempts + 1,
        });
        const remaining = MAX_ATTEMPTS - data.attempts - 1;
        throw new Error(`Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    }
    
    // Success - delete the OTP document
    await deleteDoc(doc(db, OTP_COLLECTION, email));
    return true;
};
