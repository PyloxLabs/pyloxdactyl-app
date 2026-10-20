import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';

import { AppText, Card, EmptyState, Loading, Meter, Pill, Row, useColors } from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { formatBytes, percent, statusTone } from '@/lib/format';
import type { Server } from '@/lib/types';
import { useAuth } from '@/state/auth';

export default function ServersScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, panelName } = useAuth();
  const [showAll, setShowAll] = useState(false);

  const { data, error, loading, refreshing, reload } = useLoad(
    () => api.get<{ data: Server[] }>(`/api/mobile/servers?live=1${showAll ? '&all=1' : ''}`),
    [showAll],
  );

  useFocusEffect(
    useCallback(() => {
      void reload(true);
    }, [reload]),
  );

  const servers = data?.data ?? [];

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
      data={servers}
      keyExtractor={(item) => item.uuid}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
      ListHeaderComponent={
        <Row justify="space-between" style={{ paddingBottom: 6 }}>
          <Row gap={8}>
            <AppText variant="title">Servers</AppText>
            {data ? <Pill label={String(servers.length)} /> : null}
          </Row>
          <AppText variant="small" color="textSecondary" numberOfLines={1} style={{ maxWidth: 140 }}>
            {panelName}
          </AppText>
        </Row>
      }
      ListEmptyComponent={
        loading ? (
          <Loading />
        ) : error ? (
          <EmptyState title="Could not load servers" hint={error} />
        ) : (
          <EmptyState title="No servers yet" hint="Create a server from the panel or ask an administrator to assign one to you." />
        )
      }
      ListFooterComponent={
        user?.root_admin ? (
          <Pressable onPress={() => setShowAll((value) => !value)} style={styles.toggle}>
            <AppText variant="small" color="primary">
              {showAll ? 'Showing all panel servers - show only mine' : 'Show all panel servers'}
            </AppText>
          </Pressable>
        ) : undefined
      }
      renderItem={({ item }) => {
        const live = item.live;
        const mem = percent(live?.memory, live?.memory_limit ?? item.memory * 1024 * 1024);
        const disk = percent(live?.disk, live?.disk_limit ?? item.disk * 1024 * 1024);
        const address = item.allocation_ip ? `${item.allocation_ip}:${item.allocation_port ?? ''}` : null;
        return (
          <Card>
            <Pressable
              onPress={() => router.push({ pathname: '/server/[uuid]', params: { uuid: item.uuid } })}
              style={({ pressed }) => ({ gap: 8, opacity: pressed ? 0.75 : 1 })}>
              <Row justify="space-between">
                <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>
                  {item.name}
                </AppText>
                <Pill label={live?.status || item.status} tone={statusTone(live?.status || item.status)} />
              </Row>
              <AppText variant="small" color="textSecondary" numberOfLines={2}>
                {[item.node_name, address, item.egg_name].filter(Boolean).join(' · ') || 'No node information'}
              </AppText>
              <Row gap={16}>
                <AppText variant="small" color="textSecondary">
                  {live?.connected
                    ? `RAM ${formatBytes(live.memory)} / ${formatBytes(live.memory_limit)}`
                    : `Limits: ${item.memory} MB RAM · ${item.disk} MB disk`}
                </AppText>
              </Row>
              {live?.connected ? (
                <Row gap={12}>
                  <Meter label="CPU" value={live.cpu ?? 0} detail={`${Math.round(live.cpu ?? 0)}%`} tone={colors.info} />
                  <Meter label="RAM" value={mem} detail={formatBytes(live.memory)} tone={colors.primary} />
                  <Meter label="Disk" value={disk} detail={formatBytes(live.disk)} tone={colors.warning} />
                </Row>
              ) : null}
            </Pressable>
          </Card>
        );
      }}
      ListFooterComponentStyle={{ paddingTop: 8 }}
    />
  );
}

const styles = StyleSheet.create({
  toggle: { paddingVertical: 12, alignItems: 'center' },
});
