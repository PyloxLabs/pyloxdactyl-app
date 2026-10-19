import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1220',
    background: '#F7F7FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECE9F7',
    textSecondary: '#5C6270',
    border: '#E2E3EA',
    primary: '#6C46A7',
    primaryText: '#FFFFFF',
    danger: '#C62828',
    success: '#2E7D32',
    warning: '#B26A00',
    console: '#0B1220',
    consoleText: '#D7DBE4',
  },
  dark: {
    text: '#F2F3F7',
    background: '#0A0E1A',
    backgroundElement: '#151A28',
    backgroundSelected: '#232B40',
    textSecondary: '#9AA1B2',
    border: '#262D3D',
    primary: '#A78BFA',
    primaryText: '#160B2E',
    danger: '#FF6B6B',
    success: '#5CD68A',
    warning: '#F2B84B',
    console: '#070A12',
    consoleText: '#D7DBE4',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 18,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
