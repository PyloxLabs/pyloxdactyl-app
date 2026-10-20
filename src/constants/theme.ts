import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#18181B',
    background: '#FAFAFA',
    backgroundElement: 'rgba(0, 0, 0, 0.04)',
    backgroundSelected: 'rgba(0, 0, 0, 0.06)',
    textSecondary: '#52525B',
    border: 'rgba(0, 0, 0, 0.1)',
    primary: '#7C3AED',
    primaryText: '#FFFFFF',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#EAB308',
    info: '#0891B2',
    console: '#0A0A0C',
    consoleText: '#A1A1AA',
  },
  dark: {
    text: '#FAFAFA',
    background: '#09090B',
    backgroundElement: 'rgba(255, 255, 255, 0.04)',
    backgroundSelected: 'rgba(255, 255, 255, 0.08)',
    textSecondary: '#A1A1AA',
    border: 'rgba(255, 255, 255, 0.08)',
    primary: '#A855F7',
    primaryText: '#FFFFFF',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#EAB308',
    info: '#22D3EE',
    console: '#0A0A0C',
    consoleText: '#A1A1AA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Accent = {
  light: { rgb: '124, 58, 237', glow: 'rgba(124, 58, 237, 0.28)', deep: '#5B21B6' },
  dark: { rgb: '168, 85, 247', glow: 'rgba(168, 85, 247, 0.32)', deep: '#7C3AED' },
} as const;

export const AccentSecondary = '#F97316';

export function alpha(rgb: string, opacity: number) {
  return `rgba(${rgb}, ${opacity})`;
}

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
  large: 16,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
