import { Redirect } from 'expo-router';

import { Loading, Screen } from '@/components/ui';
import { useAuth } from '@/state/auth';

export default function Index() {
  const { hydrated, baseUrl, token } = useAuth();

  if (!hydrated) {
    return (
      <Screen scroll={false} contentStyle={{ justifyContent: 'center' }}>
        <Loading label="Starting Pyloxdactyl…" />
      </Screen>
    );
  }
  if (!baseUrl) return <Redirect href="/connect" />;
  if (!token) return <Redirect href="/login" />;
  return <Redirect href="/servers" />;
}
