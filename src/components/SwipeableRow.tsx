import React from 'react';
import { StyleSheet, Animated } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

interface SwipeableRowProps {
    children: React.ReactNode;
    leftActionText?: string;
    leftActionColor?: string;
    onSwipeRightOpen?: () => void; // Drag LTR, triggers left action
    rightActionText?: string;
    rightActionColor?: string;
    onSwipeLeftOpen?: () => void; // Drag RTL, triggers right action
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
    children,
    leftActionText,
    leftActionColor = '#10b981', // Emerald green
    onSwipeRightOpen,
    rightActionText,
    rightActionColor = '#ef4444', // Crimson red
    onSwipeLeftOpen,
}) => {
    const renderLeftActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const trans = dragX.interpolate({
            inputRange: [0, 50, 100, 101],
            outputRange: [-20, 0, 0, 1],
        });
        return (
            <RectButton
                style={[styles.leftAction, { backgroundColor: leftActionColor }]}
                onPress={onSwipeRightOpen}
            >
                <Animated.Text
                    style={[
                        styles.actionText,
                        {
                            transform: [{ translateX: trans }],
                        },
                    ]}
                >
                    {leftActionText || 'Accept'}
                </Animated.Text>
            </RectButton>
        );
    };

    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const trans = dragX.interpolate({
            inputRange: [-101, -100, -50, 0],
            outputRange: [-1, 0, 0, 20],
        });
        return (
            <RectButton
                style={[styles.rightAction, { backgroundColor: rightActionColor }]}
                onPress={onSwipeLeftOpen}
            >
                <Animated.Text
                    style={[
                        styles.actionText,
                        {
                            transform: [{ translateX: trans }],
                        },
                    ]}
                >
                    {rightActionText || 'Decline'}
                </Animated.Text>
            </RectButton>
        );
    };

    return (
        <Swipeable
            renderLeftActions={onSwipeRightOpen ? renderLeftActions : undefined}
            renderRightActions={onSwipeLeftOpen ? renderRightActions : undefined}
            onSwipeableWillOpen={(direction) => {
                if (direction === 'left' && onSwipeRightOpen) {
                    onSwipeRightOpen();
                } else if (direction === 'right' && onSwipeLeftOpen) {
                    onSwipeLeftOpen();
                }
            }}
        >
            {children}
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    leftAction: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 24,
        borderRadius: 12,
        marginVertical: 6,
    },
    rightAction: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 24,
        borderRadius: 12,
        marginVertical: 6,
    },
    actionText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default SwipeableRow;
