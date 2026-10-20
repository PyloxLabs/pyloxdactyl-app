import { Redirect, Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/state/auth';

export default function AdminLayout() {
  const { hydrated, token, user } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  if (!hydrated) return null;
  if (!token) return <Redirect href="/login" />;
  if (!user?.root_admin) return <Redirect href="/servers" />;

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.primary,
        headerTitle: '',
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="users" />
      <Stack.Screen name="user/[id]" />
      <Stack.Screen name="servers" />
      <Stack.Screen name="server-create" />
      <Stack.Screen name="server/[id]" />
      <Stack.Screen name="nodes" />
      <Stack.Screen name="node/[id]" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="eggs" />
      <Stack.Screen name="egg/[id]" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
