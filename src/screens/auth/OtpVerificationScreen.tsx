// OTP Verification Screen - 6-digit animated OTP input with auto-advance and countdown timer

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TextInput as RNTextInput,
    KeyboardAvoidingView,
    Platform,
    Animated,
    NativeSyntheticEvent,
    TextInputKeyPressEventData,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Icon } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { verifyOtp, sendOtpEmail } from '../../services/otpService';
import { RegisterFormData } from '../../types';

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 30;

interface OtpVerificationParams {
    email: string;
    formData: RegisterFormData;
}

const OtpVerificationScreen = ({ route, navigation }: any) => {
    const { email, formData } = route.params as OtpVerificationParams;
    const { register } = useAuth();
    const { showError, showSuccess, showInfo } = useToast();

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);

    const inputRefs = useRef<(RNTextInput | null)[]>([]);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Animated values for entrance animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const boxAnimations = useRef(
        Array.from({ length: OTP_LENGTH }, () => new Animated.Value(0))
    ).current;

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Mask the email for display (e.g., "a***@gmail.com")
    const getMaskedEmail = (emailStr: string): string => {
        const [local, domain] = emailStr.split('@');
        if (!local || !domain) return emailStr;
        const masked = local.charAt(0) + '***';
        return `${masked}@${domain}`;
    };

    // Start countdown timer
    const startCountdown = useCallback(() => {
        setCountdown(RESEND_COUNTDOWN);
        if (countdownRef.current) clearInterval(countdownRef.current);

        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // Entrance animation on mount
    useEffect(() => {
        // Header fade + slide
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // Staggered box entrance
        const boxAnims = boxAnimations.map((anim, index) =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                delay: 100 + index * 80,
                useNativeDriver: true,
            })
        );
        Animated.stagger(80, boxAnims).start();

        // Start resend countdown
        startCountdown();

        // Focus first input
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 600);

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    // Format countdown as "0:SS"
    const formatCountdown = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle OTP verification
    const handleVerify = useCallback(
        async (code: string) => {
            if (loading) return;

            try {
                setLoading(true);
                await verifyOtp(email, code);
                await register(formData);
                showSuccess('Account created successfully! 🎉');
            } catch (err: any) {
                showError(err.message || 'Verification failed. Please try again.');
                // Clear OTP on error and refocus first input
                setOtp(Array(OTP_LENGTH).fill(''));
                setTimeout(() => {
                    inputRefs.current[0]?.focus();
                }, 100);
            } finally {
                setLoading(false);
            }
        },
        [email, formData, loading, register, showError, showSuccess]
    );

    // Handle digit input
    const handleChange = (text: string, index: number) => {
        // Only accept single digit
        const digit = text.replace(/[^0-9]/g, '').slice(-1);

        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit) {
            // Move to next input
            if (index < OTP_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
            }

            // Auto-submit when all digits filled
            const fullCode = newOtp.join('');
            if (fullCode.length === OTP_LENGTH && newOtp.every((d) => d !== '')) {
                handleVerify(fullCode);
            }
        }
    };

    // Handle backspace
    const handleKeyPress = (
        e: NativeSyntheticEvent<TextInputKeyPressEventData>,
        index: number
    ) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                // Current box empty — clear previous and move back
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current box
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    // Handle resend
    const handleResend = async () => {
        if (countdown > 0 || resendLoading) return;

        try {
            setResendLoading(true);
            await sendOtpEmail(email);
            showInfo('A new verification code has been sent to your email.');
            startCountdown();
            // Clear current OTP and refocus
            setOtp(Array(OTP_LENGTH).fill(''));
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        } catch (err: any) {
            showError(err.message || 'Failed to resend code. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    // Manual verify button press
    const handleVerifyPress = () => {
        const code = otp.join('');
        if (code.length !== OTP_LENGTH) {
            showError('Please enter the complete 6-digit code.');
            return;
        }
        handleVerify(code);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Header Section */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.iconContainer}>
                        <Icon source="email-outline" size={48} color="#6200ee" />
                    </View>

                    <Text variant="headlineMedium" style={styles.title}>
                        Verify Your Email
                    </Text>

                    <Text variant="bodyMedium" style={styles.subtitle}>
                        We sent a code to{' '}
                        <Text style={styles.emailText}>{getMaskedEmail(email)}</Text>
                    </Text>
                </Animated.View>

                {/* OTP Input Boxes */}
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <Animated.View
                            key={index}
                            style={{
                                opacity: boxAnimations[index],
                                transform: [
                                    {
                                        scale: boxAnimations[index].interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.5, 1],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <RNTextInput
                                ref={(ref) => {
                                    inputRefs.current[index] = ref;
                                }}
                                style={[
                                    styles.otpBox,
                                    focusedIndex === index && styles.otpBoxFocused,
                                    digit !== '' && styles.otpBoxFilled,
                                ]}
                                value={digit}
                                onChangeText={(text) => handleChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                onFocus={() => setFocusedIndex(index)}
                                onBlur={() => setFocusedIndex(null)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                editable={!loading}
                            />
                        </Animated.View>
                    ))}
                </View>

                {/* Countdown / Resend */}
                <Animated.View
                    style={[styles.resendContainer, { opacity: fadeAnim }]}
                >
                    {countdown > 0 ? (
                        <Text variant="bodyMedium" style={styles.timerText}>
                            Resend code in{' '}
                            <Text style={styles.timerCountdown}>
                                {formatCountdown(countdown)}
                            </Text>
                        </Text>
                    ) : (
                        <Button
                            mode="text"
                            onPress={handleResend}
                            loading={resendLoading}
                            disabled={resendLoading}
                            textColor="#6200ee"
                        >
                            Resend Code
                        </Button>
                    )}
                </Animated.View>

                {/* Verify Button */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Button
                        mode="contained"
                        onPress={handleVerifyPress}
                        loading={loading}
                        disabled={loading || otp.some((d) => d === '')}
                        style={styles.verifyButton}
                        buttonColor="#6200ee"
                        textColor="#fff"
                    >
                        Verify
                    </Button>
                </Animated.View>

                {/* Back to Register */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Button
                        mode="text"
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        disabled={loading}
                    >
                        ← Back to Register
                    </Button>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 36,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ede7f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontWeight: 'bold',
        color: '#6200ee',
        marginBottom: 8,
    },
    subtitle: {
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    emailText: {
        fontWeight: '600',
        color: '#333',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 28,
    },
    otpBox: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#fff',
        color: '#333',
    },
    otpBoxFocused: {
        borderColor: '#6200ee',
    },
    otpBoxFilled: {
        borderColor: '#b39ddb',
        backgroundColor: '#faf8ff',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    timerText: {
        color: '#666',
    },
    timerCountdown: {
        fontWeight: '600',
        color: '#6200ee',
    },
    verifyButton: {
        paddingVertical: 6,
        borderRadius: 8,
    },
    backButton: {
        marginTop: 16,
    },
});

export default OtpVerificationScreen;
