import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';

import { AppText, Button, Card, EmptyState, Field, Hint, IconButton, KeyValue, Loading, Pill, Row, Warning, useColors } from '@/components/ui';
import { CopyIcon, EyeIcon, EyeOffIcon, TrashIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { canServer } from '@/lib/access';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';

export default function DatabasesScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const colors = useColors();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<number | null>(null);

  const { data, error, loading, refreshing, reload } = useLoad(async () => {
    const [detail, databases] = await Promise.all([api.serverDetail(uuid), api.databases(uuid)]);
    return { server: detail.data, databases: databases.data, limit: databases.limit };
  }, [uuid]);

  const server = data?.server;
  const databases = data?.databases ?? [];
  const canCreate = canServer(server, 'databases.create');
  const canDelete = canServer(server, 'databases.delete');
  const limit = data?.limit ?? 0;

  const create = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/api/mobile/servers/${uuid}/databases`, { name: name.trim() });
      setName('');
      await reload(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: number, dbName: string) => {
    Alert.alert('Delete database', `Delete ${dbName}? Applications using it will lose access.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/api/mobile/servers/${uuid}/databases/delete`, { databaseId: id });
            await reload(true);
          } catch (err) {
            Alert.alert('Delete failed', errorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
      data={databases}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ gap: 10, paddingBottom: 4 }}>
          <Row justify="space-between">
            <AppText variant="title">Databases</AppText>
            <Pill label={limit ? `${databases.length} / ${limit}` : `${databases.length}`} />
          </Row>
          {canCreate ? (
            <Card>
              <Field label="New database name" value={name} onChangeText={setName} placeholder="world" autoCapitalize="none" />
              <Button title="Create database" onPress={create} loading={busy} disabled={!name.trim() || (limit > 0 && databases.length >= limit)} />
              {limit > 0 && databases.length >= limit ? <Hint>Database limit reached for this server.</Hint> : null}
            </Card>
          ) : (
            <Hint>Your account cannot create databases on this server.</Hint>
          )}
          {error ? <Warning>{error}</Warning> : null}
          {actionError ? <Warning>{actionError}</Warning> : null}
        </View>
      }
      ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No databases" hint="Create one above if your plan allows it." />}
      renderItem={({ item }) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="heading" style={{ flexShrink: 1 }}>
              {item.name}
            </AppText>
            {canDelete ? (
              <IconButton label="Delete" small variant="danger" icon={(color) => <TrashIcon color={color} />} onPress={() => remove(item.id, item.name)} />
            ) : null}
          </Row>
          <KeyValue label="Username" value={item.username} mono />
          <KeyValue label="Password" value={revealed === item.id ? item.password : '••••••••••'} mono />
          <Row gap={8}>
            <IconButton
              label={revealed === item.id ? 'Hide password' : 'Show password'}
              small
              variant="secondary"
              icon={(color) => (revealed === item.id ? <EyeOffIcon color={color} /> : <EyeIcon color={color} />)}
              onPress={() => setRevealed(revealed === item.id ? null : item.id)}
            />
            <IconButton
              label="Copy password"
              small
              variant="secondary"
              icon={(color) => <CopyIcon color={color} />}
              onPress={() => Clipboard.setStringAsync(item.password)}
            />
          </Row>
        </Card>
      )}
    />
  );
}
