import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';

import { AppText, Button, Card, CheckRow, EmptyState, Field, Hint, IconButton, Loading, ModalCard, Row, Warning, useColors } from '@/components/ui';
import { PencilIcon, UserPlusIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage, formatDate } from '@/lib/format';
import type { PermissionGroup, Subuser } from '@/lib/types';

const GROUP_LABELS: Record<string, string> = {
  console: 'Console',
  files: 'Files',
  databases: 'Databases',
  backups: 'Backups',
  schedules: 'Schedules',
  startup: 'Startup',
  settings: 'Settings',
};

function permissionLabel(key: string): string {
  const [, action] = key.split('.');
  const words = action.replace(/([a-z])([A-Z])/g, '$1 $2');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function SubusersScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const colors = useColors();
  const [editing, setEditing] = useState<Subuser | 'new' | null>(null);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const { data, error, loading, refreshing, reload } = useLoad(
    () => api.get<{ data: Subuser[]; permission_groups: PermissionGroup[] }>(`/api/mobile/servers/${uuid}/users`),
    [uuid],
  );

  const subusers = data?.data ?? [];
  const groups = data?.permission_groups ?? [];

  const openEditor = (target: Subuser | 'new') => {
    setEditing(target);
    setModalError(null);
    setEmail('');
    setPermissions(target === 'new' ? [] : target.permissions);
  };

  const toggle = (key: string) => {
    setPermissions((previous) => (previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]));
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setModalError(null);
    try {
      if (editing === 'new') {
        await api.post(`/api/mobile/servers/${uuid}/users`, { email: email.trim(), permissions });
      } else {
        await api.post(`/api/mobile/servers/${uuid}/users/${editing.id}/update`, { permissions });
      }
      setEditing(null);
      await reload(true);
    } catch (err) {
      setModalError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = (subuser: Subuser) => {
    Alert.alert('Remove subuser', `Remove ${subuser.username}'s access to this server?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/api/mobile/servers/${uuid}/users/${subuser.id}/delete`, {});
            await reload(true);
          } catch (err) {
            Alert.alert('Remove failed', errorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
        data={subusers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <Row justify="space-between">
              <AppText variant="title">Subusers</AppText>
              <IconButton label="Invite subuser" small icon={(color) => <UserPlusIcon color={color} />} onPress={() => openEditor('new')} />
            </Row>
            <Hint>Invite an existing panel account by email and pick which actions they may perform.</Hint>
            {error ? <Warning>{error}</Warning> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No subusers" hint="Share access by inviting an account above." />}
        renderItem={({ item }) => (
          <Card>
            <Row justify="space-between">
              <View style={{ gap: 2, flex: 1 }}>
                <AppText variant="heading">{item.username}</AppText>
                <AppText variant="small" color="textSecondary">
                  {item.email}
                </AppText>
              </View>
              <IconButton label="Edit permissions" small variant="secondary" icon={(color) => <PencilIcon color={color} />} onPress={() => openEditor(item)} />
            </Row>
            <AppText variant="small" color="textSecondary">
              {item.permissions.length} permission{item.permissions.length === 1 ? '' : 's'} · added {formatDate(item.created_at)}
            </AppText>
            <Button title="Remove access" small variant="danger" onPress={() => remove(item)} />
          </Card>
        )}
      />

      <ModalCard
        visible={editing !== null}
        title={editing === 'new' ? 'Invite subuser' : `Permissions for ${editing ? editing.username : ''}`}
        onClose={() => setEditing(null)}>
        {editing === 'new' ? (
          <Field label="Account email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        ) : null}
        {groups.map((group) => (
          <View key={group.id} style={{ gap: 2 }}>
            <AppText variant="caption" color="textSecondary">
              {GROUP_LABELS[group.id] ?? group.id}
            </AppText>
            {group.perms.map((permission) => (
              <CheckRow
                key={permission.key}
                label={permissionLabel(permission.key)}
                checked={permissions.includes(permission.key)}
                onPress={() => toggle(permission.key)}
              />
            ))}
          </View>
        ))}
        {modalError ? <Warning>{modalError}</Warning> : null}
        <Button
          title={editing === 'new' ? 'Send invite' : 'Save permissions'}
          onPress={save}
          loading={busy}
          disabled={permissions.length === 0 || (editing === 'new' && !email.trim())}
        />
      </ModalCard>
    </>
  );
}
