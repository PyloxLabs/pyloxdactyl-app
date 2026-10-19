import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { AppText, Button, Card, Field, Hint, Screen, Warning } from '@/components/ui';
import { errorMessage } from '@/lib/format';
import { useAuth } from '@/state/auth';

export default function TwoFactorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challenge?: string }>();
  const { verifyTwoFactor } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const challenge = params.challenge;

  if (!challenge) return <Redirect href="/login" />;

  const handleVerify = async () => {
    setError(null);
    setBusy(true);
    try {
      await verifyTwoFactor(challenge, code.trim());
      router.replace('/servers');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card>
        <AppText variant="heading">Enter your authenticator code</AppText>
        <AppText variant="small" color="textSecondary">
          Open your authenticator app and type the current 6-digit code for this panel.
        </AppText>
      </Card>

      <Field
        label="Authentication code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={8}
        placeholder="123456"
        returnKeyType="go"
        onSubmitEditing={handleVerify}
      />

      {error ? <Warning>{error}</Warning> : null}

      <Button
        title="Verify and sign in"
        onPress={handleVerify}
        loading={busy}
        disabled={code.trim().length < 6}
      />

      <Hint>Lost access to your authenticator? Ask a panel administrator to reset two-factor for your account.</Hint>
    </Screen>
  );
}
