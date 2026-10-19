import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';

import { AppText, Button, Card, EmptyState, Field, Hint, IconButton, KeyValue, Loading, Meter, ModalCard, Pill, Row, Warning, useColors } from '@/components/ui';
import { TrashIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { canServer } from '@/lib/access';
import { api } from '@/lib/api';
import { errorMessage, formatBytes, formatDate } from '@/lib/format';
import type { Backup } from '@/lib/types';

type PasswordAction = { kind: 'delete' | 'restore'; backup: Backup } | null;

export default function BackupsScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const colors = useColors();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [passwordAction, setPasswordAction] = useState<PasswordAction>(null);
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);

  const { data, error, loading, refreshing, reload } = useLoad(async () => {
    const [detail, backups] = await Promise.all([api.serverDetail(uuid), api.backups(uuid)]);
    return { server: detail.data, backups: backups.data, limit: backups.limit };
  }, [uuid]);

  const server = data?.server;
  const backups = data?.backups ?? [];
  const limit = data?.limit ?? 0;
  const canCreate = canServer(server, 'backups.create');
  const canDelete = canServer(server, 'backups.delete');
  const canRestore = canServer(server, 'backups.restore');
  const atLimit = limit > 0 && backups.length >= limit;

  const createBackup = async () => {
    setCreating(true);
    setActionError(null);
    try {
      await api.post(`/api/mobile/servers/${uuid}/backups`, { name: name.trim() }, 300000);
      setName('');
      await reload(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const toggleLock = async (backup: Backup) => {
    try {
      await api.post(`/api/mobile/servers/${uuid}/backups/${backup.id}/lock`, {});
      await reload(true);
    } catch (err) {
      Alert.alert('Could not change lock', errorMessage(err));
    }
  };

  const submitPassword = async () => {
    if (!passwordAction) return;
    setWorking(true);
    setActionError(null);
    try {
      const { kind, backup } = passwordAction;
      if (kind === 'delete') {
        await api.post(`/api/mobile/servers/${uuid}/backups/${backup.id}/delete`, { password });
      } else {
        await api.post(`/api/mobile/servers/${uuid}/backups/${backup.id}/restore`, { password }, 300000);
      }
      setPasswordAction(null);
      setPassword('');
      await reload(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const used = backups.reduce((sum, backup) => sum + (Number(backup.size) || 0), 0);
  const quota = 5 * 1024 * 1024 * 1024;

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
        data={backups}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <Row justify="space-between">
              <AppText variant="title">Backups</AppText>
              <Pill label={limit ? `${backups.length} / ${limit}` : `${backups.length}`} />
            </Row>
            <Card>
              <Meter label="Stored size" value={Math.min(100, (used / quota) * 100)} detail={formatBytes(used)} />
              {canCreate ? (
                <>
                  <Field label="Backup name" value={name} onChangeText={setName} placeholder="before-update" autoCapitalize="none" />
                  <Button title="Create backup" onPress={createBackup} loading={creating} disabled={atLimit} />
                  {atLimit ? <Hint>Backup limit reached. Delete an old backup first.</Hint> : null}
                </>
              ) : (
                <Hint>Your account cannot create backups on this server.</Hint>
              )}
            </Card>
            {error ? <Warning>{error}</Warning> : null}
            {actionError && !passwordAction ? <Warning>{actionError}</Warning> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No backups yet" hint="Create one before making big changes." />}
        renderItem={({ item }) => (
          <Card>
            <Row justify="space-between">
              <AppText variant="heading" numberOfLines={1} style={{ flex: 1 }}>
                {item.name}
              </AppText>
              {item.locked ? <Pill label="Locked" tone="warning" /> : null}
            </Row>
            <KeyValue label="Created" value={formatDate(item.created_at)} />
            <KeyValue label="Size" value={item.size_text || formatBytes(item.size)} />
            <Row gap={8} wrap>
              {canRestore ? (
                <Button
                  title="Restore"
                  small
                  variant="secondary"
                  onPress={() => {
                    setPassword('');
                    setActionError(null);
                    setPasswordAction({ kind: 'restore', backup: item });
                  }}
                />
              ) : null}
              <Button title={item.locked ? 'Unlock' : 'Lock'} small variant="secondary" onPress={() => toggleLock(item)} />
              {canDelete ? (
                <IconButton
                  label="Delete backup"
                  small
                  variant="danger"
                  disabled={Boolean(item.locked)}
                  icon={(color) => <TrashIcon color={color} />}
                  onPress={() => {
                    setPassword('');
                    setActionError(null);
                    setPasswordAction({ kind: 'delete', backup: item });
                  }}
                />
              ) : null}
            </Row>
          </Card>
        )}
      />

      <ModalCard
        visible={passwordAction !== null}
        title={passwordAction?.kind === 'restore' ? 'Restore backup' : 'Delete backup'}
        onClose={() => setPasswordAction(null)}>
        <Hint>
          {passwordAction?.kind === 'restore'
            ? `Restore "${passwordAction?.backup.name}"? The server files will be replaced by this backup.`
            : `Delete "${passwordAction?.backup.name}"? This cannot be undone.`}
        </Hint>
        <Field label="Your account password" value={password} onChangeText={setPassword} secureTextEntry />
        {actionError ? <Warning>{actionError}</Warning> : null}
        <Button
          title={passwordAction?.kind === 'restore' ? 'Restore backup' : 'Delete backup'}
          variant={passwordAction?.kind === 'restore' ? 'primary' : 'danger'}
          onPress={submitPassword}
          loading={working}
          disabled={!password}
        />
      </ModalCard>
    </>
  );
}
