import React, { useRef } from 'react';
import { Pressable, Animated, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface PressableScaleProps extends PressableProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    activeScale?: number;
    tension?: number;
    friction?: number;
}

export const PressableScale: React.FC<PressableScaleProps> = ({
    children,
    style,
    activeScale = 0.96,
    tension = 150,
    friction = 6,
    ...props
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: activeScale,
            useNativeDriver: true,
            tension,
            friction,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension,
            friction,
        }).start();
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            {...props}
        >
            <Animated.View style={[{ transform: [{ scale }] }, style]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

export default PressableScale;
