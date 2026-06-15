// OTP Verification Screen - Minimalist Dark Mode with tactile micro-interactions

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
import { Text, Button, useTheme, Icon } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { verifyOtp, sendOtpEmail } from '../../services/otpService';
import { RegisterFormData } from '../../types';
import PressableScale from '../../components/PressableScale';

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 30;

interface OtpVerificationParams {
    email: string;
    formData: RegisterFormData;
}

const OtpVerificationScreen = ({ route, navigation }: any) => {
    const theme = useTheme();
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

        const boxAnims = boxAnimations.map((anim, index) =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                delay: 100 + index * 80,
                useNativeDriver: true,
            })
        );
        Animated.stagger(80, boxAnims).start();

        startCountdown();

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
        const digit = text.replace(/[^0-9]/g, '').slice(-1);

        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit) {
            if (index < OTP_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
            }

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
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else {
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
            style={[styles.container, { backgroundColor: theme.colors.background }]}
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
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Icon source="email-outline" size={42} color={theme.colors.primary} />
                    </View>

                    <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
                        Verify Your Email
                    </Text>

                    <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        We sent a code to{' '}
                        <Text style={[styles.emailText, { color: theme.colors.onSurface }]}>{getMaskedEmail(email)}</Text>
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
                                    {
                                        backgroundColor: theme.colors.surface,
                                        color: theme.colors.onSurface,
                                        borderColor: theme.colors.outline,
                                    },
                                    focusedIndex === index && { borderColor: theme.colors.primary },
                                    digit !== '' && { borderColor: theme.colors.primaryContainer },
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
                                placeholderTextColor={theme.colors.onSurfaceVariant}
                            />
                        </Animated.View>
                    ))}
                </View>

                {/* Countdown / Resend */}
                <Animated.View
                    style={[styles.resendContainer, { opacity: fadeAnim }]}
                >
                    {countdown > 0 ? (
                        <Text variant="bodyMedium" style={[styles.timerText, { color: theme.colors.onSurfaceVariant }]}>
                            Resend code in{' '}
                            <Text style={[styles.timerCountdown, { color: theme.colors.primary }]}>
                                {formatCountdown(countdown)}
                            </Text>
                        </Text>
                    ) : (
                        <PressableScale>
                            <Button
                                mode="text"
                                onPress={handleResend}
                                loading={resendLoading}
                                disabled={resendLoading}
                                textColor={theme.colors.primary}
                            >
                                Resend Code
                            </Button>
                        </PressableScale>
                    )}
                </Animated.View>

                {/* Verify Button */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <PressableScale style={styles.buttonWrapper}>
                        <Button
                            mode="contained"
                            onPress={handleVerifyPress}
                            loading={loading}
                            disabled={loading || otp.some((d) => d === '')}
                            style={styles.verifyButton}
                            buttonColor={theme.colors.primary}
                            textColor={theme.colors.onPrimary}
                        >
                            Verify OTP
                        </Button>
                    </PressableScale>
                </Animated.View>

                {/* Back to Register */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <PressableScale>
                        <Button
                            mode="text"
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                            disabled={loading}
                            textColor={theme.colors.onSurfaceVariant}
                        >
                            ← Back to Register
                        </Button>
                    </PressableScale>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        lineHeight: 22,
    },
    emailText: {
        fontWeight: 'bold',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
    },
    otpBox: {
        width: 46,
        height: 54,
        borderWidth: 1.5,
        borderRadius: 12,
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    timerText: {
        fontSize: 14,
    },
    timerCountdown: {
        fontWeight: 'bold',
    },
    buttonWrapper: {
        width: '100%',
    },
    verifyButton: {
        borderRadius: 8,
        paddingVertical: 6,
    },
    backButton: {
        marginTop: 16,
    },
});

export default OtpVerificationScreen;
