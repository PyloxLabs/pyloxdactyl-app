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
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerTintColor: colors.primary }}>
      <Stack.Screen name="index" options={{ title: 'Admin' }} />
      <Stack.Screen name="users" options={{ title: 'Users' }} />
      <Stack.Screen name="user/[id]" options={{ title: 'User' }} />
      <Stack.Screen name="servers" options={{ title: 'Servers' }} />
      <Stack.Screen name="server-create" options={{ title: 'New server' }} />
      <Stack.Screen name="server/[id]" options={{ title: 'Server' }} />
      <Stack.Screen name="nodes" options={{ title: 'Nodes' }} />
      <Stack.Screen name="node/[id]" options={{ title: 'Node' }} />
      <Stack.Screen name="locations" options={{ title: 'Locations' }} />
      <Stack.Screen name="eggs" options={{ title: 'Nests & eggs' }} />
      <Stack.Screen name="egg/[id]" options={{ title: 'Egg' }} />
      <Stack.Screen name="settings" options={{ title: 'Panel settings' }} />
    </Stack>
  );
}
