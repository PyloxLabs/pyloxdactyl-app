import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, Platform, useColorScheme as useSystemColorScheme } from 'react-native';

import { readValue, writeValue } from '@/lib/storage';

export type ThemePreference = 'auto' | 'light' | 'dark';
export type AppColorScheme = 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';

type ThemeContextValue = {
  preference: ThemePreference;
  scheme: AppColorScheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isPreference(value: string | null): value is ThemePreference {
  return value === 'auto' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('auto');

  useEffect(() => {
    let active = true;
    readValue(STORAGE_KEY)
      .then((stored) => {
        if (active && isPreference(stored)) setPreferenceState(stored);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Appearance.setColorScheme(preference === 'auto' ? 'unspecified' : preference);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writeValue(STORAGE_KEY, next).catch(() => {});
  }, []);

  const scheme: AppColorScheme = preference === 'auto' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(() => ({ preference, scheme, setPreference }), [preference, scheme, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useThemePreference must be used within ThemeProvider');
  return value;
}
