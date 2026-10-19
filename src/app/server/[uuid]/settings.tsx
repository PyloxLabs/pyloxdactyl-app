import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { AppText, Button, Card, Field, Hint, IconButton, KeyValue, Loading, Pill, Row, Screen, SectionHeader, Warning } from '@/components/ui';
import { CopyIcon, EyeIcon, EyeOffIcon, RefreshIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';
import type { Server, ServerSettings } from '@/lib/types';

export default function ServerSettingsScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [revealPassword, setRevealPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, error, loading, reload } = useLoad(async () => {
    const [detail, settings, eula] = await Promise.all([
      api.serverDetail(uuid),
      api.get<ServerSettings>(`/api/mobile/servers/${uuid}/settings`),
      api.get<{ accepted: boolean }>(`/api/mobile/servers/${uuid}/eula`).catch(() => ({ accepted: true })),
    ]);
    return { server: detail.data, settings, eulaAccepted: eula.accepted };
  }, [uuid]);

  useEffect(() => {
    if (!data) return;
    setName(data.settings.name);
    setDescription(data.settings.description);
  }, [data]);

  const server: Server | undefined = data?.server;
  const settings = data?.settings;
  const canAcceptEula = server?.permissions === null || server?.permissions === undefined || server?.permissions.includes('console.command');

  const save = async () => {
    setSaving(true);
    setActionError(null);
    setNotice(null);
    try {
      await api.post(`/api/mobile/servers/${uuid}/settings`, { name: name.trim(), description });
      setNotice('Server details updated.');
      await reload(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const acceptEula = async () => {
    setActionError(null);
    setNotice(null);
    try {
      await api.post(`/api/mobile/servers/${uuid}/eula`, { action: 'accept' });
      setNotice('EULA accepted. The server is starting.');
      await reload(true);
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const regenerate = () => {
    Alert.alert('Regenerate SFTP password', 'The current password will stop working immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Regenerate',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/api/mobile/servers/${uuid}/sftp/regenerate`, {});
            setRevealPassword(true);
            await reload(true);
          } catch (err) {
            Alert.alert('Failed', errorMessage(err));
          }
        },
      },
    ]);
  };

  const reinstall = () => {
    Alert.alert('Reinstall server', 'This deletes the current server files and reinstalls from the egg. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reinstall',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/api/mobile/servers/${uuid}/reinstall`, {});
            setNotice('Reinstall started. Watch the console for progress.');
            await reload(true);
          } catch (err) {
            Alert.alert('Failed', errorMessage(err));
          }
        },
      },
    ]);
  };

  if (loading && !data) return <Loading label="Loading settings…" />;
  if (error) {
    return (
      <Screen>
        <Warning>{error}</Warning>
        <Button title="Retry" onPress={() => reload()} />
      </Screen>
    );
  }
  if (!settings) return null;

  return (
    <Screen>
      <AppText variant="title">Settings</AppText>

      <SectionHeader title="Details" />
      <Card>
        {settings.is_owner ? (
          <>
            <Field label="Server name" value={name} onChangeText={setName} />
            <Field label="Description" value={description} onChangeText={setDescription} multiline />
            <Button title="Save details" onPress={save} loading={saving} disabled={!name.trim()} />
          </>
        ) : (
          <>
            <KeyValue label="Name" value={settings.name} />
            <KeyValue label="Description" value={settings.description || '—'} />
            <Hint>Only the server owner can change these details.</Hint>
          </>
        )}
      </Card>

      <SectionHeader title="SFTP" />
      <Card>
        <KeyValue label="Address" value={settings.sftp.address} mono />
        <KeyValue label="Username" value={settings.sftp.username} mono />
        <KeyValue label="Password" value={revealPassword ? settings.sftp.password : '••••••••••••'} mono />
        <Row gap={8} wrap>
          <IconButton
            label={revealPassword ? 'Hide password' : 'Show password'}
            small
            variant="secondary"
            icon={(color) => (revealPassword ? <EyeOffIcon color={color} /> : <EyeIcon color={color} />)}
            onPress={() => setRevealPassword((value) => !value)}
          />
          <IconButton
            label="Copy password"
            small
            variant="secondary"
            icon={(color) => <CopyIcon color={color} />}
            onPress={() => Clipboard.setStringAsync(settings.sftp.password)}
          />
          {settings.is_owner ? (
            <IconButton label="Regenerate password" small variant="danger" icon={(color) => <RefreshIcon color={color} />} onPress={regenerate} />
          ) : null}
        </Row>
      </Card>

      <SectionHeader title="Installation" />
      <Card>
        <Row justify="space-between">
          <AppText variant="small" color="textSecondary">
            Status
          </AppText>
          <Pill
            label={settings.install_status || 'unknown'}
            tone={settings.install_status === 'installed' ? 'success' : settings.install_status === 'install_failed' ? 'danger' : 'warning'}
          />
        </Row>
        <KeyValue label="Container" value={settings.container_id || 'Not created'} mono />
        {settings.install_error ? <Warning>{settings.install_error}</Warning> : null}
        {settings.is_owner ? <Button title="Reinstall server" variant="danger" onPress={reinstall} /> : null}
      </Card>

      {data && !data.eulaAccepted ? (
        <Card>
          <AppText variant="label">Minecraft EULA</AppText>
          <Hint>This server has not accepted the Minecraft EULA. Accepting starts the server.</Hint>
          <Button title="Accept EULA and start" onPress={acceptEula} disabled={!canAcceptEula} />
        </Card>
      ) : null}

      {actionError ? <Warning>{actionError}</Warning> : null}
      {notice ? <Hint>{notice}</Hint> : null}
    </Screen>
  );
}
