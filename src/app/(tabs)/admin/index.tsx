import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, View } from 'react-native';

import { AppText, Card, IconButton, Loading, Pill, Row, Screen, SectionHeader, useColors } from '@/components/ui';
import { RefreshIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { formatBytes, statusTone } from '@/lib/format';
import type { AdminOverview } from '@/lib/types';

const LINKS = [
  { title: 'Users', hint: 'Accounts, passwords and admin rights', href: '/admin/users' },
  { title: 'Servers', hint: 'Create, edit and transfer servers', href: '/admin/servers' },
  { title: 'Nodes', hint: 'Daemons, allocations and capacity', href: '/admin/nodes' },
  { title: 'Locations', hint: 'Group nodes by region', href: '/admin/locations' },
  { title: 'Nests & eggs', hint: 'Templates and startup variables', href: '/admin/eggs' },
  { title: 'Panel settings', hint: 'Branding, mail and security', href: '/admin/settings' },
] as const;

export default function AdminOverviewScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data, error, loading, reload, refreshing } = useLoad(() => api.get<AdminOverview>('/api/mobile/admin/overview'), []);

  if (loading && !data) return <Loading label="Loading panel overview…" />;

  const counts = data?.counts;

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}>
      <Row justify="space-between">
        <AppText variant="title">Overview</AppText>
        <IconButton label="Refresh" small variant="secondary" icon={(color) => <RefreshIcon color={color} />} onPress={() => reload(true)} />
      </Row>
      {error ? <AppText color="danger">{error}</AppText> : null}

      <Row wrap gap={10}>
        {[
          { label: 'Users', value: counts?.users ?? 0 },
          { label: 'Servers', value: counts?.servers ?? 0 },
          { label: 'Nodes', value: counts?.nodes ?? 0 },
          { label: 'Allocations', value: `${counts?.used_allocations ?? 0}/${counts?.allocations ?? 0}` },
          { label: 'Eggs', value: counts?.eggs ?? 0 },
          { label: 'Nests', value: counts?.nests ?? 0 },
        ].map((item) => (
          <Card key={item.label} style={{ width: '47%', flexGrow: 1 }}>
            <AppText variant="caption" color="textSecondary">
              {item.label}
            </AppText>
            <AppText variant="title">{String(item.value)}</AppText>
          </Card>
        ))}
      </Row>

      <Card>
        <AppText variant="caption" color="textSecondary">
          Allocated limits
        </AppText>
        <AppText variant="body">RAM {formatBytes((counts?.memory ?? 0) * 1024 * 1024)}</AppText>
        <AppText variant="body">Disk {formatBytes((counts?.disk ?? 0) * 1024 * 1024)}</AppText>
      </Card>

      <SectionHeader title="Manage" />
      <Card style={{ padding: 0, gap: 0 }}>
        {LINKS.map((link, index) => (
          <Pressable
            key={link.href}
            onPress={() => router.push(link.href)}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 13,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            })}>
            <View style={{ gap: 2 }}>
              <AppText variant="body">{link.title}</AppText>
              <AppText variant="small" color="textSecondary">
                {link.hint}
              </AppText>
            </View>
            <AppText variant="heading" color="textSecondary">
              ›
            </AppText>
          </Pressable>
        ))}
      </Card>

      <SectionHeader title="Recent servers" />
      <Card style={{ gap: 8 }}>
        {(data?.recent_servers ?? []).length === 0 ? (
          <AppText variant="small" color="textSecondary">
            No servers yet.
          </AppText>
        ) : (
          data?.recent_servers.map((server) => (
            <Pressable
              key={server.id}
              onPress={() => router.push({ pathname: '/admin/server/[id]', params: { id: String(server.id) } })}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Row justify="space-between">
                <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>
                  {server.name}
                </AppText>
                <Pill label={server.status} tone={statusTone(server.status)} />
              </Row>
              <AppText variant="small" color="textSecondary">
                {server.username || 'Unknown owner'} · {server.node_name || 'No node'}
              </AppText>
            </Pressable>
          ))
        )}
      </Card>

      <SectionHeader title="New accounts" />
      <Card style={{ gap: 6 }}>
        {(data?.recent_users ?? []).length === 0 ? (
          <AppText variant="small" color="textSecondary">
            No users yet.
          </AppText>
        ) : (
          data?.recent_users.map((user) => (
            <Pressable
              key={user.id}
              onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: String(user.id) } })}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Row justify="space-between">
                <AppText variant="body">{user.username}</AppText>
                {user.root_admin ? <Pill label="Admin" tone="primary" /> : null}
              </Row>
              <AppText variant="small" color="textSecondary">
                {user.email}
              </AppText>
            </Pressable>
          ))
        )}
      </Card>
    </Screen>
  );
}
