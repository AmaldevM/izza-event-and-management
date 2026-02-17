import { MD3LightTheme, configureFonts } from 'react-native-paper';

// Derive colors from the IZZA Logo (Primary: Purple/Indigo, Secondary: Vibrant Purple, Accent: Gold/Amber)
export const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#6200ee', // Deep Purple (Brand Primary)
        primaryContainer: '#eaddff',
        secondary: '#03dac6', // Teal (Brand Accent)
        secondaryContainer: '#3700b3',
        tertiary: '#ffb74d', // Amber/Gold (Highlight)
        surface: '#ffffff',
        background: '#f8f9fa',
        error: '#b00020',
        onPrimary: '#ffffff',
        onSecondary: '#000000',
        onSurface: '#1c1b1f',
        elevation: {
            level0: 'transparent',
            level1: '#f7f2fb',
            level2: '#f3edf7',
            level3: '#eee8f4',
            level4: '#ebe5f1',
            level5: '#e8e2ef',
        },
    },
    roundness: 12, // More rounded, premium feel
};

export default theme;
