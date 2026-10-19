import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { AppText, Card, EmptyState, Field, Hint, IconButton, Loading, Pill, Row, Warning, useColors } from '@/components/ui';
import { GearIcon, ServerIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { statusTone } from '@/lib/format';
import type { AdminServerOptions, Server } from '@/lib/types';

type AdminServerRow = Server & { username?: string };

export default function AdminServersScreen() {
  const router = useRouter();
  const colors = useColors();
  const [search, setSearch] = useState('');

  const { data, error, loading, refreshing, reload } = useLoad(
    () => api.get<{ data: AdminServerRow[]; options: AdminServerOptions }>('/api/mobile/admin/servers'),
    [],
  );

  const servers = (data?.data ?? []).filter((server) => {
    if (!search.trim()) return true;
    const query = search.trim().toLowerCase();
    return (
      server.name.toLowerCase().includes(query) ||
      String(server.username || server.owner_username || '').toLowerCase().includes(query) ||
      server.uuid.toLowerCase().includes(query)
    );
  });

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
      data={servers}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ gap: 10, paddingBottom: 4 }}>
          <Row justify="space-between">
            <AppText variant="title">Servers</AppText>
            <IconButton
              label="New server"
              small
              icon={(color) => <ServerIcon color={color} />}
              onPress={() => router.push('/admin/server-create')}
            />
          </Row>
          <Field placeholder="Search servers or owners" value={search} onChangeText={setSearch} autoCapitalize="none" />
          {data ? <Hint>{servers.length} of {data.data.length} servers</Hint> : null}
          {error ? <Warning>{error}</Warning> : null}
        </View>
      }
      ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No servers" hint="Create one with the button above." />}
      renderItem={({ item }) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>
              {item.name}
            </AppText>
            <Pill label={item.status} tone={statusTone(item.status)} />
          </Row>
          <AppText variant="small" color="textSecondary">
            {item.username || item.owner_username || 'Unknown owner'} · {item.node_name || 'No node'}
          </AppText>
          <AppText variant="small" color="textSecondary">
            {item.allocation_ip ? `${item.allocation_ip}:${item.allocation_port}` : 'No allocation'} · {item.memory} MB / {item.disk} MB
          </AppText>
          <Row justify="flex-end">
            <IconButton
              label="Manage server"
              small
              variant="secondary"
              icon={(color) => <GearIcon color={color} />}
              onPress={() => router.push({ pathname: '/admin/server/[id]', params: { id: String(item.id) } })}
            />
          </Row>
        </Card>
      )}
    />
  );
}
