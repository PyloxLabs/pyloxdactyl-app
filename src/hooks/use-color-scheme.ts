import { useThemePreference } from '@/state/theme';

export function useColorScheme() {
  return useThemePreference().scheme;
}
