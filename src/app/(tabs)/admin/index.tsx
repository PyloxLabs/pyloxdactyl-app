import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  AppText,
  Avatar,
  Card,
  IconButton,
  Loading,
  Pill,
  Row,
  Screen,
  SectionHeader,
  useAccent,
  useColors,
} from '@/components/ui';
import {
  EggIcon,
  GearIcon,
  HardDriveIcon,
  LayersIcon,
  MapPinIcon,
  RefreshIcon,
  ServerIcon,
  UsersIcon,
} from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { alpha } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatDate, statusTone } from '@/lib/format';
import type { AdminOverview } from '@/lib/types';
import { useAuth } from '@/state/auth';

const LINKS = [
  { title: 'Users', hint: 'Accounts, passwords and admin rights', href: '/admin/users', rgb: '168, 85, 247', Icon: UsersIcon },
  { title: 'Servers', hint: 'Create, edit and transfer servers', href: '/admin/servers', rgb: '34, 197, 94', Icon: ServerIcon },
  { title: 'Nodes', hint: 'Daemons, allocations and capacity', href: '/admin/nodes', rgb: '59, 130, 246', Icon: HardDriveIcon },
  { title: 'Locations', hint: 'Group nodes by region', href: '/admin/locations', rgb: '249, 115, 22', Icon: MapPinIcon },
  { title: 'Nests & eggs', hint: 'Templates and startup variables', href: '/admin/eggs', rgb: '14, 165, 233', Icon: LayersIcon },
  { title: 'Panel settings', hint: 'Branding, mail and security', href: '/admin/settings', rgb: '107, 114, 128', Icon: GearIcon },
] as const;

function StatTile({ label, value, rgb, icon }: { label: string; value: number | string; rgb: string; icon: (color: string) => React.ReactNode }) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: alpha(rgb, 0.12) }]}>{icon(`rgb(${rgb})`)}</View>
      <View style={{ flex: 1 }}>
        <AppText variant="title">{String(value)}</AppText>
        <AppText variant="small" color="textSecondary">
          {label}
        </AppText>
      </View>
    </Card>
  );
}

export default function AdminOverviewScreen() {
  const router = useRouter();
  const colors = useColors();
  const accent = useAccent();
  const { panelVersion } = useAuth();
  const { data, error, loading, reload, refreshing } = useLoad(() => api.get<AdminOverview>('/api/mobile/admin/overview'), []);

  if (loading && !data) return <Loading label="Loading panel overview…" />;

  const counts = data?.counts;
  const usedAlloc = counts?.used_allocations ?? 0;
  const totalAlloc = counts?.allocations ?? 0;
  const allocPercent = totalAlloc > 0 ? Math.round((usedAlloc / totalAlloc) * 100) : 0;

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}>
      <Row justify="space-between">
        <AppText variant="title">Overview</AppText>
        <IconButton label="Refresh" small variant="secondary" icon={(color) => <RefreshIcon color={color} />} onPress={() => reload(true)} />
      </Row>
      {error ? <AppText color="danger">{error}</AppText> : null}

      <Card glow>
        <AppText variant="label">System information</AppText>
        <AppText variant="small" color="textSecondary">
          Running Pyloxdactyl version {panelVersion || '—'}
        </AppText>
      </Card>

      <View style={styles.statGrid}>
        <StatTile label="Users" value={counts?.users ?? 0} rgb={accent.rgb} icon={(color) => <UsersIcon size={20} color={color} />} />
        <StatTile label="Servers" value={counts?.servers ?? 0} rgb="34, 197, 94" icon={(color) => <ServerIcon size={20} color={color} />} />
        <StatTile label="Nodes" value={counts?.nodes ?? 0} rgb="59, 130, 246" icon={(color) => <HardDriveIcon size={20} color={color} />} />
        <StatTile label="Locations" value={counts?.locations ?? 0} rgb="249, 115, 22" icon={(color) => <MapPinIcon size={20} color={color} />} />
        <StatTile label="Eggs" value={counts?.eggs ?? 0} rgb="168, 85, 247" icon={(color) => <EggIcon size={20} color={color} />} />
        <StatTile label="Nests" value={counts?.nests ?? 0} rgb="14, 165, 233" icon={(color) => <LayersIcon size={20} color={color} />} />
      </View>

      <Card>
        <AppText variant="label">Allocations</AppText>
        <AppText variant="small" color="textSecondary">
          {usedAlloc} of {totalAlloc} allocations used
        </AppText>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${allocPercent}%`, backgroundColor: colors.primary }]} />
        </View>
      </Card>

      <View style={styles.chartGrid}>
        <Card>
          <AppText variant="label">Recent users</AppText>
          {(data?.recent_users ?? []).length === 0 ? (
            <AppText variant="small" color="textSecondary">
              No users yet.
            </AppText>
          ) : (
            data?.recent_users.map((user) => (
              <Pressable
                key={user.id}
                onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: String(user.id) } })}
                style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}>
                <Avatar email={user.email} name={user.username} size={28} />
                <View style={{ flex: 1 }}>
                  <AppText variant="small">{user.username}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {user.created_at ? formatDate(user.created_at) : ''}
                  </AppText>
                </View>
              </Pressable>
            ))
          )}
        </Card>
        <Card>
          <AppText variant="label">Recent servers</AppText>
          {(data?.recent_servers ?? []).length === 0 ? (
            <AppText variant="small" color="textSecondary">
              No servers yet.
            </AppText>
          ) : (
            data?.recent_servers.map((server) => (
              <Pressable
                key={server.id}
                onPress={() => router.push({ pathname: '/admin/server/[id]', params: { id: String(server.id) } })}
                style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}>
                <View style={{ flex: 1 }}>
                  <AppText variant="small">{server.name}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {server.username || 'Unknown owner'} · {server.node_name || 'No node'}
                  </AppText>
                </View>
                <Pill label={server.status} tone={statusTone(server.status)} />
              </Pressable>
            ))
          )}
        </Card>
      </View>

      <SectionHeader title="Manage" />
      <Card style={{ padding: 0, gap: 0 }}>
        {LINKS.map((link, index) => (
          <Pressable
            key={link.href}
            onPress={() => router.push(link.href)}
            style={({ pressed }) => [
              styles.manageRow,
              { borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth + 0.5, borderTopColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}>
            <View style={[styles.manageIcon, { backgroundColor: alpha(link.rgb, 0.12) }]}>
              <link.Icon size={20} color={`rgb(${link.rgb})`} />
            </View>
            <View style={{ flex: 1 }}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chartGrid: { gap: 10 },
  track: { height: 10, backgroundColor: 'rgba(127,127,127,0.15)', borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth + 0.5, borderBottomColor: 'rgba(127,127,127,0.15)' },
  manageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  manageIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
