import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ServerLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerTintColor: colors.primary }}>
      <Stack.Screen name="index" options={{ title: 'Server' }} />
      <Stack.Screen name="files" options={{ title: 'Files' }} />
      <Stack.Screen name="file" options={{ title: 'Edit file' }} />
      <Stack.Screen name="databases" options={{ title: 'Databases' }} />
      <Stack.Screen name="backups" options={{ title: 'Backups' }} />
      <Stack.Screen name="schedules" options={{ title: 'Schedules' }} />
      <Stack.Screen name="startup" options={{ title: 'Startup' }} />
      <Stack.Screen name="users" options={{ title: 'Subusers' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
