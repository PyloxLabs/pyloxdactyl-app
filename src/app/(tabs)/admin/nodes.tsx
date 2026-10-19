import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { AppText, Button, Card, Choice, EmptyState, Field, Hint, IconButton, Loading, ModalCard, Pill, Row, Warning, useColors } from '@/components/ui';
import { GearIcon, HardDriveIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';
import type { Location, Node } from '@/lib/types';

const emptyNode = {
  location_id: 0,
  name: '',
  fqdn: '',
  scheme: 'https',
  memory: '8192',
  disk: '102400',
  cpu: '8',
  memory_overallocate: '0',
  disk_overallocate: '0',
  sftp_port: '2022',
  daemon_listen: '8080',
  daemon_token: '',
  daemon_type: 'rubityle',
};

export default function AdminNodesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyNode);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const { data, error, loading, refreshing, reload } = useLoad(
    () => api.get<{ data: Node[]; options: { locations: Location[] } }>('/api/mobile/admin/nodes'),
    [],
  );

  const nodes = data?.data ?? [];
  const locations = data?.options.locations ?? [];

  const openCreate = () => {
    setForm({ ...emptyNode, location_id: locations[0]?.id ?? 0 });
    setModalError(null);
    setCreating(true);
  };

  const update = (key: keyof typeof emptyNode, value: string) => setForm((previous) => ({ ...previous, [key]: value }));

  const create = async () => {
    setBusy(true);
    setModalError(null);
    try {
      await api.post('/api/mobile/admin/nodes', form);
      setCreating(false);
      await reload(true);
    } catch (err) {
      setModalError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
        data={nodes}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <Row justify="space-between">
              <AppText variant="title">Nodes</AppText>
              <IconButton label="New node" small icon={(color) => <HardDriveIcon color={color} />} onPress={openCreate} disabled={locations.length === 0} />
            </Row>
            {locations.length === 0 ? <Hint>Create a location before adding nodes.</Hint> : null}
            {error ? <Warning>{error}</Warning> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No nodes" hint="Add the daemon that will host servers." />}
        renderItem={({ item }) => (
          <Card>
            <Row justify="space-between">
              <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>
                {item.name}
              </AppText>
              <Pill label={item.online ? 'Online' : 'Offline'} tone={item.online ? 'success' : 'danger'} />
            </Row>
            <AppText variant="small" color="textSecondary">
              {item.fqdn} · {item.location_name || 'No location'}
            </AppText>
            <AppText variant="small" color="textSecondary">
              {item.server_count ?? 0} servers · {item.allocation_count ?? 0} allocations · {item.memory} MB / {item.disk} MB
            </AppText>
            <Row justify="flex-end">
              <IconButton
                label="Manage node"
                small
                variant="secondary"
                icon={(color) => <GearIcon color={color} />}
                onPress={() => router.push({ pathname: '/admin/node/[id]', params: { id: String(item.id) } })}
              />
            </Row>
          </Card>
        )}
      />

      <ModalCard visible={creating} title="New node" onClose={() => setCreating(false)}>
        <AppText variant="label">Location</AppText>
        <Choice options={locations.map((location) => ({ label: location.long, value: location.id }))} value={form.location_id} onChange={(value) => update('location_id', String(value))} />
        <Field label="Name" value={form.name} onChangeText={(value) => update('name', value)} />
        <Field label="FQDN / IP" value={form.fqdn} onChangeText={(value) => update('fqdn', value)} autoCapitalize="none" />
        <AppText variant="label">Scheme</AppText>
        <Choice options={[{ label: 'https', value: 'https' }, { label: 'http', value: 'http' }]} value={form.scheme} onChange={(value) => update('scheme', value)} />
        <Field label="Memory (MB)" value={form.memory} onChangeText={(value) => update('memory', value)} keyboardType="number-pad" />
        <Field label="Disk (MB)" value={form.disk} onChangeText={(value) => update('disk', value)} keyboardType="number-pad" />
        <Field label="CPU cores" value={form.cpu} onChangeText={(value) => update('cpu', value)} keyboardType="number-pad" />
        <Field label="Daemon listen port" value={form.daemon_listen} onChangeText={(value) => update('daemon_listen', value)} keyboardType="number-pad" />
        <Field label="SFTP port" value={form.sftp_port} onChangeText={(value) => update('sftp_port', value)} keyboardType="number-pad" />
        <Field label="Daemon token" value={form.daemon_token} onChangeText={(value) => update('daemon_token', value)} autoCapitalize="none" hint="Leave blank to generate one automatically." />
        {modalError ? <Warning>{modalError}</Warning> : null}
        <Button title="Create node" onPress={create} loading={busy} disabled={!form.name.trim() || !form.fqdn.trim() || !form.location_id} />
      </ModalCard>
    </>
  );
}
