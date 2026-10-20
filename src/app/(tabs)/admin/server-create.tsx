import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { AppText, Button, Card, Choice, Field, Hint, Loading, Screen, SectionHeader, Warning } from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';
import type { AdminServerOptions, Server } from '@/lib/types';

const defaults = {
  name: '',
  description: '',
  memory: '1024',
  swap: '0',
  disk: '10240',
  cpu: '100',
  io: '500',
  database_limit: '0',
  backups_limit: '3',
  startup: '',
  image: '',
};

export default function CreateServerScreen() {
  const router = useRouter();
  const [form, setForm] = useState(defaults);
  const [userId, setUserId] = useState<number | null>(null);
  const [nodeId, setNodeId] = useState<number | null>(null);
  const [allocationId, setAllocationId] = useState<number | null>(null);
  const [eggId, setEggId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllAllocations, setShowAllAllocations] = useState(false);

  const { data, loading } = useLoad(
    () => api.get<{ data: Server[]; options: AdminServerOptions }>('/api/mobile/admin/servers'),
    [],
  );
  const options = data?.options;

  useEffect(() => {
    if (!options) return;
    if (!userId && options.users[0]) setUserId(options.users[0].id);
    if (!nodeId && options.nodes[0]) setNodeId(options.nodes[0].id);
    if (!eggId && options.eggs[0]) setEggId(options.eggs[0].id);
  }, [options, userId, nodeId, eggId]);

  useEffect(() => {
    if (!options || !eggId) return;
    const egg = options.eggs.find((item) => item.id === eggId);
    if (egg) {
      setForm((previous) => ({
        ...previous,
        startup: egg.startup || previous.startup,
        image: egg.docker_image || previous.image,
      }));
    }
  }, [eggId, options]);

  const update = (key: keyof typeof defaults, value: string) => setForm((previous) => ({ ...previous, [key]: value }));

  const allocationOptions = (options?.allocations ?? []).filter(
    (allocation) => showAllAllocations || !nodeId || allocation.node_id === nodeId,
  );

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await api.post<{ ok: boolean; server: Server; provision?: { ok: boolean; error?: string } }>(
        '/api/mobile/admin/servers',
        {
          user_id: userId,
          node_id: nodeId,
          allocation_id: allocationId,
          name: form.name.trim(),
          description: form.description,
          egg_id: eggId,
          memory: form.memory,
          swap: form.swap,
          disk: form.disk,
          cpu: form.cpu,
          io: form.io,
          database_limit: form.database_limit,
          backups_limit: form.backups_limit,
          startup: form.startup,
          image: form.image,
        },
        120000,
      );
      const provisionError = result.provision && result.provision.ok === false ? result.provision.error : null;
      Alert.alert(
        provisionError ? 'Server created with warnings' : 'Server created',
        provisionError || 'The server was created and is being provisioned.',
      );
      router.replace({ pathname: '/admin/server/[id]', params: { id: String(result.server.id) } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !options) return <Loading label="Loading options…" />;

  return (
    <Screen>
      <AppText variant="title">New server</AppText>
      <SectionHeader title="Owner & placement" />
      <Card>
        <AppText variant="label">Owner</AppText>
        <Choice
          options={(options?.users ?? []).map((user) => ({ label: user.username, value: user.id }))}
          value={userId}
          onChange={setUserId}
        />
        <AppText variant="label">Node</AppText>
        <Choice
          options={(options?.nodes ?? []).map((node) => ({ label: node.name, value: node.id }))}
          value={nodeId}
          onChange={(value) => {
            setNodeId(value);
            setAllocationId(null);
          }}
        />
        <AppText variant="label">Allocation</AppText>
        <Button
          title={showAllAllocations ? 'Only this node' : 'Show all nodes'}
          small
          variant="ghost"
          onPress={() => setShowAllAllocations((value) => !value)}
        />
        <Choice
          options={[
            { label: 'None', value: 0 },
            ...allocationOptions.slice(0, 80).map((allocation) => ({
              label: `${allocation.ip}:${allocation.port}${allocation.node_name ? ` (${allocation.node_name})` : ''}`,
              value: allocation.id,
            })),
          ]}
          value={allocationId ?? 0}
          onChange={(value) => setAllocationId(value === 0 ? null : value)}
        />
        {allocationOptions.length > 80 ? <Hint>Showing the first 80 free allocations.</Hint> : null}
      </Card>

      <SectionHeader title="Details" />
      <Card>
        <Field label="Name" value={form.name} onChangeText={(value) => update('name', value)} />
        <Field label="Description" value={form.description} onChangeText={(value) => update('description', value)} />
        <AppText variant="label">Egg</AppText>
        <Choice
          options={(options?.eggs ?? []).map((egg) => ({ label: egg.name, value: egg.id }))}
          value={eggId}
          onChange={setEggId}
        />
      </Card>

      <SectionHeader title="Resources" />
      <Card>
        <Field label="Memory (MB)" value={form.memory} onChangeText={(value) => update('memory', value)} keyboardType="number-pad" />
        <Field label="Swap (MB)" value={form.swap} onChangeText={(value) => update('swap', value)} keyboardType="number-pad" />
        <Field label="Disk (MB)" value={form.disk} onChangeText={(value) => update('disk', value)} keyboardType="number-pad" />
        <Field label="CPU (%)" value={form.cpu} onChangeText={(value) => update('cpu', value)} keyboardType="number-pad" />
        <Field label="IO weight" value={form.io} onChangeText={(value) => update('io', value)} keyboardType="number-pad" />
        <Field label="Database limit" value={form.database_limit} onChangeText={(value) => update('database_limit', value)} keyboardType="number-pad" />
        <Field label="Backup limit" value={form.backups_limit} onChangeText={(value) => update('backups_limit', value)} keyboardType="number-pad" />
      </Card>

      <SectionHeader title="Startup" />
      <Card>
        <Field label="Startup command" value={form.startup} onChangeText={(value) => update('startup', value)} autoCapitalize="none" />
        <Field label="Docker image" value={form.image} onChangeText={(value) => update('image', value)} autoCapitalize="none" />
      </Card>

      {error ? <Warning>{error}</Warning> : null}
      <Button
        title="Create server"
        onPress={create}
        loading={busy}
        disabled={!form.name.trim() || !userId || !nodeId}
      />
    </Screen>
  );
}
