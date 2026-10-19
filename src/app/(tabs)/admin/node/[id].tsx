import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Choice,
  Field,
  Hint,
  IconButton,
  KeyValue,
  Loading,
  ModalCard,
  Pill,
  Row,
  Screen,
  SectionHeader,
  Warning,
} from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { PlusIcon, TrashIcon } from '@/components/icons';
import { api } from '@/lib/api';
import { errorMessage, formatBytes, statusTone } from '@/lib/format';
import type { AdminNodeDetail } from '@/lib/types';

export default function AdminNodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const { data, error, loading, reload } = useLoad(() => api.get<AdminNodeDetail>(`/api/mobile/admin/nodes/${id}`), [id]);
  const [form, setForm] = useState({
    location_id: 0,
    name: '',
    fqdn: '',
    scheme: 'https',
    memory: '',
    disk: '',
    cpu: '',
    memory_overallocate: '',
    disk_overallocate: '',
    daemon_token: '',
    daemon_listen: '',
    sftp_port: '',
    daemon_type: 'rubityle',
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [allocIp, setAllocIp] = useState('');
  const [allocPorts, setAllocPorts] = useState('');

  useEffect(() => {
    if (!data) return;
    const node = data.node;
    setForm({
      location_id: node.location_id || 0,
      name: node.name,
      fqdn: node.fqdn,
      scheme: node.scheme || 'https',
      memory: String(node.memory ?? ''),
      disk: String(node.disk ?? ''),
      cpu: String(node.cpu ?? ''),
      memory_overallocate: String(node.memory_overallocate ?? 0),
      disk_overallocate: String(node.disk_overallocate ?? 0),
      daemon_token: node.daemon_token || '',
      daemon_listen: node.daemon_listen || '',
      sftp_port: String(node.sftp_port ?? 2022),
      daemon_type: node.daemon_type || 'rubityle',
    });
    navigation.setOptions({ title: node.name });
  }, [data, navigation]);

  const run = async (key: string, action: () => Promise<unknown>, message = 'Saved.') => {
    setBusy(key);
    setActionError(null);
    setNotice(null);
    try {
      await action();
      setNotice(message);
      await reload(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const addAllocations = async () => {
    setBusy('alloc');
    setActionError(null);
    try {
      const result = await api.post<{ added: number }>(`/api/mobile/admin/nodes/${id}/allocations`, {
        ip: allocIp.trim(),
        ports: allocPorts.trim(),
      });
      setNotice(`${result.added} allocations added.`);
      setAdding(false);
      setAllocIp('');
      setAllocPorts('');
      await reload(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const deleteNode = () => {
    Alert.alert('Delete node', 'The node must have no servers. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          run('delete', async () => {
            await api.post(`/api/mobile/admin/nodes/${id}/delete`, {});
            router.back();
          }),
      },
    ]);
  };

  if (loading && !data) return <Loading label="Loading node…" />;
  if (error && !data) {
    return (
      <Screen>
        <Warning>{error}</Warning>
        <Button title="Retry" onPress={() => reload()} />
      </Screen>
    );
  }
  if (!data) return null;

  const node = data.node;

  return (
    <>
      <Screen>
        <AppText variant="title">{node.name}</AppText>
        <Row gap={8}>
          <Pill label={node.online ? 'Daemon online' : 'Daemon offline'} tone={node.online ? 'success' : 'danger'} />
          <Pill label={node.daemon_type || 'rubityle'} />
        </Row>

        <Card>
          <KeyValue label="Location" value={node.location_name || '—'} />
          <KeyValue label="Address" value={`${node.scheme || 'http'}://${node.fqdn}:${node.daemon_listen || 8080}`} mono />
          <KeyValue label="Allocated RAM" value={`${formatBytes(data.mem_allocated * 1024 * 1024)} / ${formatBytes(node.memory * 1024 * 1024)}`} />
          <KeyValue label="Allocated disk" value={`${formatBytes(data.disk_allocated * 1024 * 1024)} / ${formatBytes(node.disk * 1024 * 1024)}`} />
        </Card>

        <SectionHeader title="Settings" />
        <Card>
          <AppText variant="label">Location</AppText>
          <Choice
            options={data.locations.map((location) => ({ label: location.long, value: location.id }))}
            value={form.location_id}
            onChange={(value) => setForm((previous) => ({ ...previous, location_id: value }))}
          />
          <Field label="Name" value={form.name} onChangeText={(value) => setForm((previous) => ({ ...previous, name: value }))} />
          <Field label="FQDN / IP" value={form.fqdn} onChangeText={(value) => setForm((previous) => ({ ...previous, fqdn: value }))} autoCapitalize="none" />
          <AppText variant="label">Scheme</AppText>
          <Choice
            options={[{ label: 'https', value: 'https' }, { label: 'http', value: 'http' }]}
            value={form.scheme}
            onChange={(value) => setForm((previous) => ({ ...previous, scheme: value }))}
          />
          <Field label="Memory (MB)" value={form.memory} onChangeText={(value) => setForm((previous) => ({ ...previous, memory: value }))} keyboardType="number-pad" />
          <Field label="Disk (MB)" value={form.disk} onChangeText={(value) => setForm((previous) => ({ ...previous, disk: value }))} keyboardType="number-pad" />
          <Field label="CPU cores" value={form.cpu} onChangeText={(value) => setForm((previous) => ({ ...previous, cpu: value }))} keyboardType="number-pad" />
          <Field label="Memory overallocate %" value={form.memory_overallocate} onChangeText={(value) => setForm((previous) => ({ ...previous, memory_overallocate: value }))} keyboardType="number-pad" />
          <Field label="Disk overallocate %" value={form.disk_overallocate} onChangeText={(value) => setForm((previous) => ({ ...previous, disk_overallocate: value }))} keyboardType="number-pad" />
          <Field label="Daemon listen port" value={form.daemon_listen} onChangeText={(value) => setForm((previous) => ({ ...previous, daemon_listen: value }))} keyboardType="number-pad" />
          <Field label="SFTP port" value={form.sftp_port} onChangeText={(value) => setForm((previous) => ({ ...previous, sftp_port: value }))} keyboardType="number-pad" />
          <Field label="Daemon token" value={form.daemon_token} onChangeText={(value) => setForm((previous) => ({ ...previous, daemon_token: value }))} autoCapitalize="none" />
          <AppText variant="label">Daemon type</AppText>
          <Choice
            options={[{ label: 'rubityle', value: 'rubityle' }, { label: 'oxlify', value: 'oxlify' }]}
            value={form.daemon_type}
            onChange={(value) => setForm((previous) => ({ ...previous, daemon_type: value }))}
          />
          <Button
            title="Save node"
            onPress={() => run('save', () => api.post(`/api/mobile/admin/nodes/${id}`, form))}
            loading={busy === 'save'}
            disabled={!form.name.trim() || !form.fqdn.trim()}
          />
        </Card>

        <SectionHeader
          title="Allocations"
          action={<IconButton label="Add allocation" small variant="secondary" icon={(color) => <PlusIcon color={color} />} onPress={() => setAdding(true)} />}
        />
        <Card>
          {data.allocations.length === 0 ? <Hint>No allocations.</Hint> : null}
          {data.allocations.map((allocation) => (
            <Row key={allocation.id} justify="space-between">
              <View style={{ gap: 2, flex: 1 }}>
                <AppText variant="mono">
                  {allocation.ip}:{allocation.port}
                </AppText>
                <AppText variant="small" color="textSecondary">
                  {allocation.server_name ? `Used by ${allocation.server_name} (${allocation.server_owner || 'unknown'})` : 'Free'}
                </AppText>
              </View>
              {!allocation.server_id ? (
                <IconButton
                  label="Delete allocation"
                  small
                  variant="danger"
                  icon={(color) => <TrashIcon color={color} />}
                  onPress={() => run('allocDelete', () => api.post(`/api/mobile/admin/nodes/${id}/allocations/${allocation.id}/delete`, {}))}
                />
              ) : null}
            </Row>
          ))}
        </Card>

        <SectionHeader title="Servers" />
        <Card style={{ gap: 6 }}>
          {data.servers.length === 0 ? <Hint>No servers on this node.</Hint> : null}
          {data.servers.map((server) => (
            <Row key={server.id} justify="space-between">
              <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>
                {server.name}
              </AppText>
              <Pill label={server.status} tone={statusTone(server.status)} />
            </Row>
          ))}
        </Card>

        <Button title="Delete node" variant="danger" onPress={deleteNode} loading={busy === 'delete'} />

        {actionError ? <Warning>{actionError}</Warning> : null}
        {notice ? <Hint>{notice}</Hint> : null}
      </Screen>

      <ModalCard visible={adding} title="Add allocations" onClose={() => setAdding(false)}>
        <Field label="IP address" value={allocIp} onChangeText={setAllocIp} placeholder="203.0.113.10" autoCapitalize="none" />
        <Field label="Ports" value={allocPorts} onChangeText={setAllocPorts} placeholder="25565-25570, 8080" keyboardType="numbers-and-punctuation" />
        <Hint>Use ranges like 25565-25570 separated by commas.</Hint>
        {actionError ? <Warning>{actionError}</Warning> : null}
        <Button title="Add" onPress={addAllocations} loading={busy === 'alloc'} disabled={!allocIp.trim() || !allocPorts.trim()} />
      </ModalCard>
    </>
  );
}
