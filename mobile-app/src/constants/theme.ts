// Export the theme from ThemeProvider for external use
export { darkTheme, lightTheme } from '@/providers/ThemeProvider';

// Additional theme utilities and constants
export const COLORS = {
  // Nigerian-inspired colors
  nigerianGreen: '#008751',
  nigerianWhite: '#ffffff',
  
  // Brand colors
  primaryPurple: '#7c3aed',
  secondaryGreen: '#10b981',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Gradients
  primaryGradient: ['#7c3aed', '#5b21b6'],
  emergencyGradient: ['#ef4444', '#dc2626'],
  successGradient: ['#10b981', '#059669'],
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export const ANIMATIONS = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

export const LAYOUT = {
  screen: {
    padding: 20,
    margin: 16,
  },
  header: {
    height: 60,
    paddingVertical: 16,
  },
  tabBar: {
    height: 70,
    paddingBottom: 10,
  },
  button: {
    height: 48,
    borderRadius: 12,
  },
  input: {
    height: 48,
    borderRadius: 8,
  },
} as const;
