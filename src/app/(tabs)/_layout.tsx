import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/state/auth';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { hydrated, baseUrl, token, user } = useAuth();

  if (!hydrated) return null;
  if (!baseUrl) return <Redirect href="/connect" />;
  if (!token) return <Redirect href="/login" />;

  return (
    <NativeTabs
      tintColor={colors.primary}
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundSelected}
      labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="servers">
        <NativeTabs.Trigger.Label>Servers</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="server.rack" md="dns" />
      </NativeTabs.Trigger>

      {user?.root_admin ? (
        <NativeTabs.Trigger name="admin">
          <NativeTabs.Trigger.Label>Admin</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="wrench.and.screwdriver" md="admin_panel_settings" />
        </NativeTabs.Trigger>
      ) : null}

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
