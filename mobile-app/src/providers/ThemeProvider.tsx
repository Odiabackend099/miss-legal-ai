import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

// Nigerian-inspired color palette with purple theme
const nigerianColors = {
  // Primary purple tones inspired by MISS Legal AI branding
  primary: '#7c3aed',
  primaryVariant: '#5b21b6',
  secondary: '#10b981',
  secondaryVariant: '#059669',
  
  // Nigerian flag colors as accents
  nigerianGreen: '#008751',
  nigerianWhite: '#ffffff',
  
  // Cultural colors
  royalPurple: '#663399',
  goldAccent: '#fbbf24',
  
  // Dark theme colors
  surfaceDark: '#1a1a2e',
  backgroundDark: '#16213e',
  onSurfaceDark: '#eeeef0',
  
  // Light theme colors
  surfaceLight: '#f8fafc',
  backgroundLight: '#ffffff',
  onSurfaceLight: '#1e293b',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

const fontConfig = {
  fontFamily: 'Inter-Regular',
  fontWeight: 'normal' as const,
};

const fonts = configureFonts({
  config: {
    ...fontConfig,
    displayLarge: {
      ...fontConfig,
      fontFamily: 'Inter-Bold',
      fontSize: 57,
      fontWeight: 'bold' as const,
    },
    displayMedium: {
      ...fontConfig,
      fontFamily: 'Inter-Bold',
      fontSize: 45,
      fontWeight: 'bold' as const,
    },
    displaySmall: {
      ...fontConfig,
      fontFamily: 'Inter-Bold',
      fontSize: 36,
      fontWeight: 'bold' as const,
    },
    headlineLarge: {
      ...fontConfig,
      fontFamily: 'Inter-Bold',
      fontSize: 32,
      fontWeight: 'bold' as const,
    },
    headlineMedium: {
      ...fontConfig,
      fontFamily: 'Inter-SemiBold',
      fontSize: 28,
      fontWeight: '600' as const,
    },
    headlineSmall: {
      ...fontConfig,
      fontFamily: 'Inter-SemiBold',
      fontSize: 24,
      fontWeight: '600' as const,
    },
    titleLarge: {
      ...fontConfig,
      fontFamily: 'Inter-SemiBold',
      fontSize: 22,
      fontWeight: '600' as const,
    },
    titleMedium: {
      ...fontConfig,
      fontFamily: 'Inter-Medium',
      fontSize: 16,
      fontWeight: '500' as const,
    },
    titleSmall: {
      ...fontConfig,
      fontFamily: 'Inter-Medium',
      fontSize: 14,
      fontWeight: '500' as const,
    },
    labelLarge: {
      ...fontConfig,
      fontFamily: 'Inter-Medium',
      fontSize: 14,
      fontWeight: '500' as const,
    },
    labelMedium: {
      ...fontConfig,
      fontFamily: 'Inter-Medium',
      fontSize: 12,
      fontWeight: '500' as const,
    },
    labelSmall: {
      ...fontConfig,
      fontFamily: 'Inter-Regular',
      fontSize: 11,
    },
    bodyLarge: {
      ...fontConfig,
      fontSize: 16,
    },
    bodyMedium: {
      ...fontConfig,
      fontSize: 14,
    },
    bodySmall: {
      ...fontConfig,
      fontSize: 12,
    },
  },
});

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: nigerianColors.primary,
    onPrimary: '#ffffff',
    primaryContainer: nigerianColors.primaryVariant,
    onPrimaryContainer: '#f3f4f6',
    
    secondary: nigerianColors.secondary,
    onSecondary: '#ffffff',
    secondaryContainer: nigerianColors.secondaryVariant,
    onSecondaryContainer: '#f0fdf4',
    
    tertiary: nigerianColors.goldAccent,
    onTertiary: '#1f2937',
    tertiaryContainer: '#fbbf24',
    onTertiaryContainer: '#1f2937',
    
    error: nigerianColors.error,
    onError: '#ffffff',
    errorContainer: '#dc2626',
    onErrorContainer: '#fef2f2',
    
    background: nigerianColors.backgroundDark,
    onBackground: nigerianColors.onSurfaceDark,
    
    surface: nigerianColors.surfaceDark,
    onSurface: nigerianColors.onSurfaceDark,
    surfaceVariant: '#2a2a3e',
    onSurfaceVariant: '#d1d5db',
    
    outline: '#6b7280',
    outlineVariant: '#374151',
    
    shadow: '#000000',
    scrim: '#000000',
    
    inverseSurface: '#f8fafc',
    inverseOnSurface: '#1e293b',
    inversePrimary: nigerianColors.primaryVariant,
    
    // Custom colors for Nigerian context
    success: nigerianColors.success,
    warning: nigerianColors.warning,
    info: nigerianColors.info,
    nigerianGreen: nigerianColors.nigerianGreen,
    royalPurple: nigerianColors.royalPurple,
  },
  fonts,
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: nigerianColors.primary,
    onPrimary: '#ffffff',
    primaryContainer: '#f3f4f6',
    onPrimaryContainer: nigerianColors.primaryVariant,
    
    secondary: nigerianColors.secondary,
    onSecondary: '#ffffff',
    secondaryContainer: '#f0fdf4',
    onSecondaryContainer: nigerianColors.secondaryVariant,
    
    tertiary: nigerianColors.goldAccent,
    onTertiary: '#1f2937',
    tertiaryContainer: '#fef3c7',
    onTertiaryContainer: '#1f2937',
    
    error: nigerianColors.error,
    onError: '#ffffff',
    errorContainer: '#fef2f2',
    onErrorContainer: '#dc2626',
    
    background: nigerianColors.backgroundLight,
    onBackground: nigerianColors.onSurfaceLight,
    
    surface: nigerianColors.surfaceLight,
    onSurface: nigerianColors.onSurfaceLight,
    surfaceVariant: '#f1f5f9',
    onSurfaceVariant: '#475569',
    
    outline: '#64748b',
    outlineVariant: '#cbd5e1',
    
    shadow: '#000000',
    scrim: '#000000',
    
    inverseSurface: '#1e293b',
    inverseOnSurface: '#f8fafc',
    inversePrimary: '#a855f7',
    
    // Custom colors for Nigerian context
    success: nigerianColors.success,
    warning: nigerianColors.warning,
    info: nigerianColors.info,
    nigerianGreen: nigerianColors.nigerianGreen,
    royalPurple: nigerianColors.royalPurple,
  },
  fonts,
};

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: typeof darkTheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Don't render until theme is loaded
  if (!isLoaded) {
    return null;
  }

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility functions for theme-related operations
export const getThemedColor = (lightColor: string, darkColor: string, isDark: boolean) => {
  return isDark ? darkColor : lightColor;
};

export const getContrastColor = (backgroundColor: string) => {
  // Simple contrast calculation - in a real app, you'd use a more sophisticated algorithm
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

export default ThemeProvider;
