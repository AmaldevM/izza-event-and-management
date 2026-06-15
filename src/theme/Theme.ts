import { MD3DarkTheme } from 'react-native-paper';

export const theme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#bb86fc', // Vibrant purple accent
        primaryContainer: '#3700b3',
        secondary: '#03dac6', // Teal brand accent
        secondaryContainer: '#018786',
        tertiary: '#cf6679',
        surface: '#121216', // Sleek dark surface card background
        surfaceVariant: '#1e1e24', // Card hover / list item surface
        background: '#09090c', // Pure dark background
        error: '#cf6679',
        onPrimary: '#000000',
        onSecondary: '#000000',
        onSurface: '#f3f4f6', // Bright text
        onSurfaceVariant: '#9ca3af', // Muted text
        outline: '#272732', // Borders
        elevation: {
            level0: 'transparent',
            level1: '#121216',
            level2: '#181820',
            level3: '#1e1e26',
            level4: '#24242e',
            level5: '#2c2c36',
        },
    },
    roundness: 16, // Extra rounded, highly modern feel
};

export default theme;
