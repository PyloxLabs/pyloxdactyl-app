import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { AppText, Button, Card, Field, Row, Screen, Warning } from '@/components/ui';
import { errorMessage } from '@/lib/format';
import { useAuth } from '@/state/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { baseUrl, panelName, login, forgetPanel } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      const response = await login(identifier.trim(), password);
      if (response.require2fa && response.challenge) {
        router.push({ pathname: '/login-2fa', params: { challenge: response.challenge } });
      } else {
        router.replace('/servers');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const switchPanel = async () => {
    await forgetPanel();
    router.replace('/connect');
  };

  return (
    <Screen>
      <Card>
        <AppText variant="caption" color="textSecondary">
          Connected panel
        </AppText>
        <AppText variant="heading">{panelName || 'Pyloxdactyl'}</AppText>
        <AppText variant="small" color="textSecondary">
          {baseUrl}
        </AppText>
      </Card>

      <Field
        label="Username or email"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        returnKeyType="next"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
      />

      {error ? <Warning>{error}</Warning> : null}

      <Button title="Sign in" onPress={handleLogin} loading={busy} disabled={!identifier.trim() || !password} />

      <Row justify="center" style={{ marginTop: 4 }}>
        <Pressable onPress={switchPanel}>
          <AppText variant="small" color="primary">
            Use a different panel
          </AppText>
        </Pressable>
      </Row>
    </Screen>
  );
}
