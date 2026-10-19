import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { AppText, Button, Card, CheckRow, Field, Hint, KeyValue, Loading, Pill, Row, Screen, SectionHeader, Warning } from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage, formatDate, statusTone } from '@/lib/format';
import type { AdminUserResponse } from '@/lib/types';
import { useAuth } from '@/state/auth';

export default function AdminUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rootAdmin, setRootAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, error, loading, reload } = useLoad(
    () => api.get<AdminUserResponse>(`/api/mobile/admin/users/${id}`),
    [id],
  );

  useEffect(() => {
    if (!data) return;
    setUsername(data.user.username);
    setEmail(data.user.email);
    setRootAdmin(Boolean(data.user.root_admin));
  }, [data]);

  const save = async () => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await api.post(`/api/mobile/admin/users/${id}`, {
        username: username.trim(),
        email: email.trim(),
        password: password || undefined,
        root_admin: rootAdmin,
      });
      setPassword('');
      setNotice('User updated.');
      await reload(true);
      if (currentUser?.id === data?.user.id) await refreshUser();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!data) return;
    Alert.alert('Delete user', `Delete ${data.user.username}? Their servers remain on the panel.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/api/mobile/admin/users/${id}/delete`, {});
            router.back();
          } catch (err) {
            Alert.alert('Delete failed', errorMessage(err));
          }
        },
      },
    ]);
  };

  if (loading && !data) return <Loading label="Loading user…" />;
  if (error && !data) {
    return (
      <Screen>
        <Warning>{error}</Warning>
        <Button title="Retry" onPress={() => reload()} />
      </Screen>
    );
  }
  if (!data) return null;

  const isSelf = currentUser?.id === data.user.id;

  return (
    <Screen>
      <Card>
        <Row justify="space-between">
          <AppText variant="heading">{data.user.username}</AppText>
          <Row gap={6}>
            {data.user.root_admin ? <Pill label="Admin" tone="primary" /> : null}
            {data.user.totp_enabled ? <Pill label="2FA" tone="success" /> : null}
          </Row>
        </Row>
        <KeyValue label="Email" value={data.user.email} />
        <KeyValue label="Joined" value={formatDate(data.user.created_at)} />
        <KeyValue label="UUID" value={data.user.uuid} mono />
      </Card>

      <SectionHeader title="Edit account" />
      <Card>
        <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry hint="Leave blank to keep the current password." />
        <CheckRow label="Root administrator" checked={rootAdmin} onPress={() => setRootAdmin((value) => !value)} />
        {actionError ? <Warning>{actionError}</Warning> : null}
        {notice ? <Hint>{notice}</Hint> : null}
        <Button title="Save changes" onPress={save} loading={busy} disabled={!username.trim() || !email.trim()} />
      </Card>

      <SectionHeader title="Servers" />
      <Card style={{ gap: 8 }}>
        {data.servers.length === 0 ? <Hint>This user owns no servers.</Hint> : null}
        {data.servers.map((server) => (
          <Row key={server.id} justify="space-between">
            <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>
              {server.name}
            </AppText>
            <Pill label={server.status} tone={statusTone(server.status)} />
          </Row>
        ))}
      </Card>

      <SectionHeader title="API keys" />
      <Card style={{ gap: 6 }}>
        {data.api_keys.length === 0 ? <Hint>No API keys issued.</Hint> : null}
        {data.api_keys.map((key) => (
          <KeyValue key={key.id} label={key.memo} value={key.last_used_at ? formatDate(key.last_used_at) : 'Never used'} />
        ))}
      </Card>

      {!isSelf ? <Button title="Delete user" variant="danger" onPress={remove} /> : <Hint>You cannot delete your own account.</Hint>}
    </Screen>
  );
}
