import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Divider, Field, GradientCard, Hint, KeyValue, ModalCard, Pill, Row, Screen, SectionHeader, SegmentedSlider, Warning } from '@/components/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';
import { useUpdates } from '@/hooks/use-updates';
import { useAuth } from '@/state/auth';
import { useThemePreference, type ThemePreference } from '@/state/theme';

type ModalKind = 'email' | 'password' | 'twoFactor' | null;

export default function AccountScreen() {
  const router = useRouter();
  const { user, baseUrl, panelName, panelVersion, refreshUser, logout, forgetPanel } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const updates = useUpdates();
  const [modal, setModal] = useState<ModalKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [twoFactorQr, setTwoFactorQr] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  const closeModal = () => {
    setModal(null);
    setError(null);
    setEmailPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTwoFactorQr(null);
    setTwoFactorSecret('');
    setTwoFactorCode('');
    setDisablePassword('');
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openTwoFactor = () => {
    setModal('twoFactor');
    setError(null);
    if (user?.totp_enabled) return;
    void run(async () => {
      const result = await api.post<{ qr: string; secret: string }>('/api/mobile/me/2fa/setup');
      setTwoFactorQr(result.qr);
      setTwoFactorSecret(result.secret);
    });
  };

  const saveEmail = () =>
    run(async () => {
      await api.post('/api/mobile/me/email', { email, password: emailPassword });
      await refreshUser();
      closeModal();
    });

  const savePassword = () =>
    run(async () => {
      await api.post('/api/mobile/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      closeModal();
    });

  const enableTwoFactor = () =>
    run(async () => {
      await api.post('/api/mobile/me/2fa/enable', { code: twoFactorCode.trim() });
      await refreshUser();
      closeModal();
    });

  const disableTwoFactor = () =>
    run(async () => {
      await api.post('/api/mobile/me/2fa/disable', { password: disablePassword });
      await refreshUser();
      closeModal();
    });

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  const switchPanel = async () => {
    await forgetPanel();
    router.replace('/connect');
  };

  return (
    <Screen>
      <GradientCard>
        <Row justify="space-between">
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="heading">{user?.username ?? 'Signed in'}</AppText>
            <AppText variant="small" color="textSecondary">
              {user?.email}
            </AppText>
          </View>
          {user?.root_admin ? <Pill label="Administrator" tone="primary" /> : null}
        </Row>
        <Divider />
        <KeyValue label="Panel" value={panelName || 'Pyloxdactyl'} />
        <KeyValue label="Version" value={panelVersion || '—'} />
        <KeyValue label="Address" value={baseUrl ?? '—'} mono />
      </GradientCard>

      <SectionHeader title="Security" />
      <Card>
        <Row justify="space-between">
          <AppText variant="label">Email address</AppText>
          <Button title="Change" small variant="ghost" onPress={() => setModal('email')} />
        </Row>
        <Divider />
        <Row justify="space-between">
          <AppText variant="label">Password</AppText>
          <Button title="Change" small variant="ghost" onPress={() => setModal('password')} />
        </Row>
        <Divider />
        <Row justify="space-between">
          <Row gap={8}>
            <AppText variant="label">Two-factor auth</AppText>
            <Pill label={user?.totp_enabled ? 'Enabled' : 'Off'} tone={user?.totp_enabled ? 'success' : 'muted'} />
          </Row>
          <Button
            title={user?.totp_enabled ? 'Manage' : 'Set up'}
            small
            variant="ghost"
            onPress={openTwoFactor}
          />
        </Row>
      </Card>

      <SectionHeader title="Appearance" />
      <Card>
        <AppText variant="label">Theme</AppText>
        <SegmentedSlider<ThemePreference>
          options={[
            { label: 'Auto', value: 'auto' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
          value={preference}
          onChange={setPreference}
        />
        <Hint>Auto follows the light or dark setting on your device.</Hint>
      </Card>

      <SectionHeader title="Updates" />
      <Card>
        <KeyValue label="Runtime" value={updates.runtimeVersion || '—'} mono />
        <KeyValue label="Channel" value={updates.channel || '—'} mono />
        <Divider />
        {updates.phase === 'ready' ? (
          <Button title="Restart to update" onPress={updates.apply} />
        ) : (
          <Button
            title="Check for updates"
            variant="secondary"
            onPress={() => void updates.check()}
            loading={updates.phase === 'checking' || updates.phase === 'downloading'}
          />
        )}
        {updates.message ? <Hint>{updates.message}</Hint> : null}
        {!updates.supported ? <Hint>Updates are available in the installed app, not in development.</Hint> : null}
      </Card>

      <SectionHeader title="Session" />
      <Button title="Sign out" variant="secondary" onPress={signOut} />
      <Button title="Switch panel" variant="ghost" onPress={switchPanel} />

      <ModalCard visible={modal === 'email'} title="Change email" onClose={closeModal}>
        <Field label="New email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Current password" value={emailPassword} onChangeText={setEmailPassword} secureTextEntry />
        {error ? <Warning>{error}</Warning> : null}
        <Button title="Save email" onPress={saveEmail} loading={busy} disabled={!email.trim() || !emailPassword} />
      </ModalCard>

      <ModalCard visible={modal === 'password'} title="Change password" onClose={closeModal}>
        <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry hint="At least 8 characters." />
        <Field label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        {error ? <Warning>{error}</Warning> : null}
        <Button
          title="Save password"
          onPress={savePassword}
          loading={busy}
          disabled={!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
        />
      </ModalCard>

      <ModalCard visible={modal === 'twoFactor'} title={user?.totp_enabled ? 'Two-factor authentication' : 'Set up two-factor'} onClose={closeModal}>
        {user?.totp_enabled ? (
          <>
            <Hint>Enter your password to turn off two-factor authentication.</Hint>
            <Field label="Password" value={disablePassword} onChangeText={setDisablePassword} secureTextEntry />
            {error ? <Warning>{error}</Warning> : null}
            <Button title="Disable two-factor" variant="danger" onPress={disableTwoFactor} loading={busy} disabled={!disablePassword} />
          </>
        ) : twoFactorQr ? (
          <>
            <Hint>Scan this code with your authenticator app, then enter the generated code below.</Hint>
            <Image source={{ uri: twoFactorQr }} style={{ width: 220, height: 220, alignSelf: 'center' }} contentFit="contain" />
            <Row gap={8} justify="space-between">
              <AppText variant="mono" style={{ flexShrink: 1 }} selectable>
                {twoFactorSecret}
              </AppText>
              <Button title="Copy" small variant="secondary" onPress={() => Clipboard.setStringAsync(twoFactorSecret)} />
            </Row>
            <Field
              label="Authentication code"
              value={twoFactorCode}
              onChangeText={setTwoFactorCode}
              keyboardType="number-pad"
              maxLength={8}
            />
            {error ? <Warning>{error}</Warning> : null}
            <Button title="Enable two-factor" onPress={enableTwoFactor} loading={busy} disabled={twoFactorCode.trim().length < 6} />
          </>
        ) : (
          <Hint>Preparing a new two-factor secret…</Hint>
        )}
      </ModalCard>
    </Screen>
  );
}
