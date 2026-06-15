// Toast Notification Component - Reusable toast/snackbar for success, error, warning, and info messages

import React, {
    createContext,
    useState,
    useContext,
    useCallback,
    useRef,
    useEffect,
    ReactNode,
} from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
}

// ─── Toast Appearance Config ─────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; accent: string }> = {
    success: {
        icon: 'check-circle',
        bg: 'rgba(16, 185, 129, 0.95)',   // Emerald green
        accent: '#ecfdf5',
    },
    error: {
        icon: 'alert-circle',
        bg: 'rgba(239, 68, 68, 0.95)',     // Red
        accent: '#fef2f2',
    },
    warning: {
        icon: 'alert',
        bg: 'rgba(245, 158, 11, 0.95)',    // Amber/orange
        accent: '#fffbeb',
    },
    info: {
        icon: 'information',
        bg: 'rgba(59, 130, 246, 0.95)',    // Blue
        accent: '#eff6ff',
    },
};

const DEFAULT_DURATION = 3000;

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// ─── Toast Banner (internal) ─────────────────────────────────────────────────

interface ToastBannerProps {
    config: ToastConfig;
    onDismiss: () => void;
}

const ToastBanner: React.FC<ToastBannerProps> = ({ config, onDismiss }) => {
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { icon, bg, accent } = TOAST_CONFIG[config.type];
    const duration = config.duration ?? DEFAULT_DURATION;

    const dismiss = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -120,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => onDismiss());
    }, [translateY, opacity, onDismiss]);

    useEffect(() => {
        // Slide in
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto-dismiss
        timerRef.current = setTimeout(dismiss, duration);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <Animated.View
            style={[
                styles.banner,
                {
                    backgroundColor: bg,
                    top: insets.top + 12,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <TouchableOpacity
                style={styles.bannerContent}
                activeOpacity={0.85}
                onPress={dismiss}
            >
                {/* Icon container */}
                <View style={[styles.iconWrapper, { backgroundColor: accent + '30' }]}>
                    <Icon source={icon} size={22} color={accent} />
                </View>

                {/* Message */}
                <Text style={[styles.message, { color: accent }]} numberOfLines={3}>
                    {config.message}
                </Text>

                {/* Close icon */}
                <View style={styles.closeWrapper}>
                    <Icon source="close" size={18} color={accent + 'AA'} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Provider ────────────────────────────────────────────────────────────────

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toast, setToast] = useState<ToastConfig | null>(null);
    const queueRef = useRef<ToastConfig[]>([]);
    const activeRef = useRef(false);

    const showNext = useCallback(() => {
        if (queueRef.current.length > 0) {
            activeRef.current = true;
            setToast(queueRef.current.shift()!);
        } else {
            activeRef.current = false;
        }
    }, []);

    const enqueue = useCallback(
        (config: ToastConfig) => {
            if (activeRef.current) {
                // Replace current toast immediately with the new one
                queueRef.current = [];
                activeRef.current = false;
                setToast(null);
                // Small delay so React unmounts the old banner before mounting new
                setTimeout(() => {
                    activeRef.current = true;
                    setToast(config);
                }, 50);
            } else {
                activeRef.current = true;
                setToast(config);
            }
        },
        [],
    );

    const handleDismiss = useCallback(() => {
        setToast(null);
        activeRef.current = false;
        // Show next queued toast if any
        setTimeout(showNext, 100);
    }, [showNext]);

    const showSuccess = useCallback(
        (message: string, duration?: number) =>
            enqueue({ message, type: 'success', duration }),
        [enqueue],
    );

    const showError = useCallback(
        (message: string, duration?: number) =>
            enqueue({ message, type: 'error', duration }),
        [enqueue],
    );

    const showWarning = useCallback(
        (message: string, duration?: number) =>
            enqueue({ message, type: 'warning', duration }),
        [enqueue],
    );

    const showInfo = useCallback(
        (message: string, duration?: number) =>
            enqueue({ message, type: 'info', duration }),
        [enqueue],
    );

    const value: ToastContextType = {
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && <ToastBanner config={toast} onDismiss={handleDismiss} />}
        </ToastContext.Provider>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 99999,
        borderRadius: 14,
        // Shadow – iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        // Shadow – Android
        elevation: 12,
    },
    bannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        letterSpacing: 0.1,
    },
    closeWrapper: {
        marginLeft: 8,
        padding: 4,
    },
});
