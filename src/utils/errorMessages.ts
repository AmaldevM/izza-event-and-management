// Firebase Auth Error Messages - Maps error codes to user-friendly messages

const firebaseErrorMessages: Record<string, string> = {
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters with letters and numbers.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/invalid-phone-number': 'Please enter a valid phone number.',
    'auth/missing-phone-number': 'Phone number is required.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    'auth/captcha-check-failed': 'Security check failed. Please try again.',
    'auth/invalid-verification-code': 'Invalid verification code. Please check and try again.',
    'auth/code-expired': 'Verification code has expired. Please request a new one.',
};

/**
 * Returns a user-friendly error message for a given Firebase auth error code.
 * Falls back to a generic message for unrecognized error codes.
 */
export const getFirebaseErrorMessage = (errorCode: string): string => {
    return firebaseErrorMessages[errorCode] || 'Something went wrong. Please try again later.';
};
