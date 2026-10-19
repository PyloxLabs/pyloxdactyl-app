import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AppText, Button, Card, Field, Hint, Screen, Warning } from '@/components/ui';
import { errorMessage } from '@/lib/format';
import { useAuth } from '@/state/auth';

export default function ConnectScreen() {
  const router = useRouter();
  const { connect, connecting, baseUrl } = useAuth();
  const [url, setUrl] = useState(baseUrl ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      await connect(url);
      router.replace('/login');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Screen>
      <AppText variant="title">Your panel, in your pocket.</AppText>
      <AppText variant="small" color="textSecondary">
        Pyloxdactyl connects straight to your panel. Enter its address to get started.
      </AppText>

      <Card>
        <Field
          label="Panel URL"
          value={url}
          onChangeText={setUrl}
          placeholder="https://panel.example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleConnect}
        />
        <Hint>Include the port when needed, for example http://192.168.1.10:5000.</Hint>
      </Card>

      {error ? <Warning>{error}</Warning> : null}

      <Button title="Connect" onPress={handleConnect} loading={connecting} disabled={!url.trim()} />

      <Card>
        <AppText variant="label">How it works</AppText>
        <AppText variant="small" color="textSecondary">
          The app checks the address is a Pyloxdactyl panel before saving it. You then sign in with the same account
          you use on the web panel.
        </AppText>
        <AppText variant="small" color="textSecondary">
          Plain http:// addresses work, but https:// is recommended when your panel has a certificate.
        </AppText>
      </Card>
    </Screen>
  );
}
