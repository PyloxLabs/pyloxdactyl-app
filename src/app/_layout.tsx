import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/state/auth';
import { ThemeProvider } from '@/state/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <NavigationThemeProvider
      value={
        scheme === 'dark'
          ? {
              ...DarkTheme,
              colors: { ...DarkTheme.colors, background: colors.background, card: colors.backgroundElement, border: colors.border, primary: colors.primary, text: colors.text },
            }
          : {
              ...DefaultTheme,
              colors: { ...DefaultTheme.colors, background: colors.background, card: colors.backgroundElement, border: colors.border, primary: colors.primary, text: colors.text },
            }
      }>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text, fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="connect" options={{ title: 'Connect to panel' }} />
          <Stack.Screen name="login" options={{ title: 'Sign in' }} />
          <Stack.Screen name="login-2fa" options={{ title: 'Two-factor authentication' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="server/[uuid]" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
