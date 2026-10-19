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
  Pill,
  Row,
  Screen,
  SectionHeader,
  Warning,
} from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { ExternalLinkIcon, TrashIcon } from '@/components/icons';
import { api } from '@/lib/api';
import { errorMessage, formatDate, statusTone } from '@/lib/format';
import type { AdminServerDetail, EggVariable } from '@/lib/types';

export default function AdminServerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const { data, error, loading, reload } = useLoad(
    () => api.get<AdminServerDetail>(`/api/mobile/admin/servers/${id}`),
    [id],
  );

  const [details, setDetails] = useState({ name: '', description: '', user_id: 0, node_id: 0, allocation_id: 0 });
  const [build, setBuild] = useState({ memory: '', swap: '', disk: '', cpu: '', io: '', database_limit: '', backups_limit: '' });
  const [startup, setStartup] = useState({ egg_id: 0, startup: '', image: '' });
  const [vars, setVars] = useState<Record<string, string>>({});
  const [assignId, setAssignId] = useState<number | null>(null);
  const [transferNode, setTransferNode] = useState<number | null>(null);
  const [db, setDb] = useState({ name: '', username: '', password: '', host: '127.0.0.1', port: '3306' });
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const server = data.server;
    setDetails({
      name: server.name,
      description: server.description || '',
      user_id: server.user_id || 0,
      node_id: server.node_id || 0,
      allocation_id: server.allocation_id || 0,
    });
    setBuild({
      memory: String(server.memory ?? ''),
      swap: String(server.swap ?? 0),
      disk: String(server.disk ?? ''),
      cpu: String(server.cpu ?? ''),
      io: String(server.io ?? 500),
      database_limit: String(server.database_limit ?? 0),
      backups_limit: String(server.backups_limit ?? 0),
    });
    setStartup({ egg_id: server.egg_id || 0, startup: server.startup_command || '', image: server.image || '' });
    const nextVars: Record<string, string> = {};
    for (const variable of data.egg_variables) {
      nextVars[variable.env_var] = String(variable.current_value ?? variable.default_value ?? '');
    }
    setVars(nextVars);
    navigation.setOptions({ title: server.name });
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

  const deleteServer = () => {
    Alert.alert('Delete server', 'This removes the server, its files and backups. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          run(
            'delete',
            async () => {
              await api.post(`/api/mobile/admin/servers/${id}/delete`, {});
              router.back();
            },
            'Server deleted.',
          ),
      },
    ]);
  };

  const reinstall = () => {
    Alert.alert('Reinstall server', 'Server files will be wiped and reinstalled from the egg. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reinstall',
        style: 'destructive',
        onPress: () => run('reinstall', () => api.post(`/api/mobile/admin/servers/${id}/reinstall`, {}), 'Reinstall started.'),
      },
    ]);
  };

  if (loading && !data) return <Loading label="Loading server…" />;
  if (error && !data) {
    return (
      <Screen>
        <Warning>{error}</Warning>
        <Button title="Retry" onPress={() => reload()} />
      </Screen>
    );
  }
  if (!data) return null;

  const server = data.server;
  const options = data.options;
  const allAllocations = data.free_allocations.filter((allocation) => allocation.node_id === details.node_id);

  return (
    <Screen>
      <Card>
        <Row justify="space-between">
          <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>
            {server.name}
          </AppText>
          <Pill label={server.status} tone={statusTone(server.status)} />
        </Row>
        <KeyValue label="Owner" value={server.username || `#${server.user_id}`} />
        <KeyValue label="Node" value={server.node_name || `#${server.node_id}`} />
        <KeyValue label="Address" value={server.alloc_ip ? `${server.alloc_ip}:${server.alloc_port}` : 'No allocation'} mono />
        <KeyValue label="Egg" value={server.egg_name || 'None'} />
        <KeyValue label="UUID" value={server.uuid} mono />
        <KeyValue label="Created" value={formatDate(server.created_at)} />
        <Row justify="flex-end">
          <IconButton
            label="Open user view"
            small
            variant="secondary"
            icon={(color) => <ExternalLinkIcon color={color} />}
            onPress={() => router.push({ pathname: '/server/[uuid]', params: { uuid: server.uuid } })}
          />
        </Row>
      </Card>

      <SectionHeader title="Details" />
      <Card>
        <Field label="Name" value={details.name} onChangeText={(value) => setDetails((previous) => ({ ...previous, name: value }))} />
        <Field
          label="Description"
          value={details.description}
          onChangeText={(value) => setDetails((previous) => ({ ...previous, description: value }))}
        />
        <AppText variant="label">Owner</AppText>
        <Choice
          options={options.users.map((user) => ({ label: user.username, value: user.id }))}
          value={details.user_id}
          onChange={(value) => setDetails((previous) => ({ ...previous, user_id: value }))}
        />
        <AppText variant="label">Node</AppText>
        <Choice
          options={options.nodes.map((node) => ({ label: node.name, value: node.id }))}
          value={details.node_id}
          onChange={(value) => setDetails((previous) => ({ ...previous, node_id: value }))}
        />
        <AppText variant="label">Primary allocation</AppText>
        <Choice
          options={[
            { label: 'None', value: 0 },
            ...data.server_allocations.map((allocation) => ({ label: `${allocation.ip}:${allocation.port}`, value: allocation.id })),
          ]}
          value={details.allocation_id}
          onChange={(value) => setDetails((previous) => ({ ...previous, allocation_id: value }))}
        />
        <Button
          title="Save details"
          onPress={() => run('details', () => api.post(`/api/mobile/admin/servers/${id}/details`, details))}
          loading={busy === 'details'}
          disabled={!details.name.trim()}
        />
      </Card>

      <SectionHeader title="Build limits" />
      <Card>
        <Field label="Memory (MB)" value={build.memory} onChangeText={(value) => setBuild((previous) => ({ ...previous, memory: value }))} keyboardType="number-pad" />
        <Field label="Swap (MB)" value={build.swap} onChangeText={(value) => setBuild((previous) => ({ ...previous, swap: value }))} keyboardType="number-pad" />
        <Field label="Disk (MB)" value={build.disk} onChangeText={(value) => setBuild((previous) => ({ ...previous, disk: value }))} keyboardType="number-pad" />
        <Field label="CPU (%)" value={build.cpu} onChangeText={(value) => setBuild((previous) => ({ ...previous, cpu: value }))} keyboardType="number-pad" />
        <Field label="IO weight" value={build.io} onChangeText={(value) => setBuild((previous) => ({ ...previous, io: value }))} keyboardType="number-pad" />
        <Field label="Database limit" value={build.database_limit} onChangeText={(value) => setBuild((previous) => ({ ...previous, database_limit: value }))} keyboardType="number-pad" />
        <Field label="Backup limit" value={build.backups_limit} onChangeText={(value) => setBuild((previous) => ({ ...previous, backups_limit: value }))} keyboardType="number-pad" />
        <Button
          title="Save build"
          onPress={() => run('build', () => api.post(`/api/mobile/admin/servers/${id}/build`, build))}
          loading={busy === 'build'}
        />
      </Card>

      <SectionHeader title="Startup" />
      <Card>
        <AppText variant="label">Egg</AppText>
        <Choice
          options={[{ label: 'None', value: 0 }, ...options.eggs.map((egg) => ({ label: egg.name, value: egg.id }))]}
          value={startup.egg_id}
          onChange={(value) => setStartup((previous) => ({ ...previous, egg_id: value }))}
        />
        <Field label="Startup command" value={startup.startup} onChangeText={(value) => setStartup((previous) => ({ ...previous, startup: value }))} autoCapitalize="none" />
        <Field label="Docker image" value={startup.image} onChangeText={(value) => setStartup((previous) => ({ ...previous, image: value }))} autoCapitalize="none" />
        {data.egg_variables.map((variable: EggVariable) => (
          <Field
            key={`${variable.id}-${variable.env_var}`}
            label={`${variable.name} (${variable.env_var})`}
            value={vars[variable.env_var] ?? ''}
            onChangeText={(value) => setVars((previous) => ({ ...previous, [variable.env_var]: value }))}
            autoCapitalize="none"
          />
        ))}
        <Button
          title="Save startup"
          onPress={() => run('startup', () => api.post(`/api/mobile/admin/servers/${id}/startup`, { ...startup, vars }))}
          loading={busy === 'startup'}
        />
      </Card>

      <SectionHeader title="Network" />
      <Card>
        {data.server_allocations.length === 0 ? <Hint>No allocations assigned.</Hint> : null}
        {data.server_allocations.map((allocation) => (
          <Row key={allocation.id} justify="space-between">
            <View style={{ gap: 2, flex: 1 }}>
              <AppText variant="mono">
                {allocation.ip}:{allocation.port}
              </AppText>
              {server.allocation_id === allocation.id ? <AppText variant="small" color="success">Primary</AppText> : null}
            </View>
            {server.allocation_id !== allocation.id ? (
              <Row gap={6}>
                <Button
                  title="Make primary"
                  small
                  variant="secondary"
                  onPress={() =>
                    run('primary', () => api.post(`/api/mobile/admin/servers/${id}/network/primary`, { allocation_id: allocation.id }))
                  }
                />
                <Button
                  title="Remove"
                  small
                  variant="danger"
                  onPress={() =>
                    run('unassign', () => api.post(`/api/mobile/admin/servers/${id}/network/${allocation.id}/unassign`, {}))
                  }
                />
              </Row>
            ) : null}
          </Row>
        ))}
        <AppText variant="label">Assign free allocation</AppText>
        <Choice
          options={allAllocations.slice(0, 80).map((allocation) => ({ label: `${allocation.ip}:${allocation.port}`, value: allocation.id }))}
          value={assignId}
          onChange={setAssignId}
        />
        <Button
          title="Assign"
          small
          variant="secondary"
          disabled={!assignId}
          onPress={() => run('assign', () => api.post(`/api/mobile/admin/servers/${id}/network/assign`, { allocation_id: assignId }))}
        />
        <Hint>Free allocations shown are on the selected node{allAllocations.length > 80 ? ' (first 80)' : ''}.</Hint>
      </Card>

      <SectionHeader title="Databases" />
      <Card>
        {data.databases.length === 0 ? <Hint>No databases.</Hint> : null}
        {data.databases.map((database) => (
          <Row key={database.id} justify="space-between">
            <View style={{ gap: 2, flex: 1 }}>
              <AppText variant="body">{database.name}</AppText>
              <AppText variant="small" color="textSecondary">
                {database.username} · {database.host || '127.0.0.1'}:{database.port || 3306}
              </AppText>
            </View>
            <IconButton
              label="Delete database"
              small
              variant="danger"
              icon={(color) => <TrashIcon color={color} />}
              onPress={() =>
                run('dbDelete', () => api.post(`/api/mobile/admin/servers/${id}/databases/${database.id}/delete`, {}))
              }
            />
          </Row>
        ))}
        <Field label="Name" value={db.name} onChangeText={(value) => setDb((previous) => ({ ...previous, name: value }))} autoCapitalize="none" />
        <Field label="Username" value={db.username} onChangeText={(value) => setDb((previous) => ({ ...previous, username: value }))} autoCapitalize="none" />
        <Field label="Password" value={db.password} onChangeText={(value) => setDb((previous) => ({ ...previous, password: value }))} secureTextEntry />
        <Field label="Host" value={db.host} onChangeText={(value) => setDb((previous) => ({ ...previous, host: value }))} autoCapitalize="none" />
        <Field label="Port" value={db.port} onChangeText={(value) => setDb((previous) => ({ ...previous, port: value }))} keyboardType="number-pad" />
        <Button
          title="Create database"
          small
          variant="secondary"
          disabled={!db.name.trim() || !db.username.trim()}
          onPress={() => run('dbCreate', () => api.post(`/api/mobile/admin/servers/${id}/databases`, db))}
        />
      </Card>

      <SectionHeader title="Transfer & danger" />
      <Card>
        <AppText variant="label">Transfer to node</AppText>
        <Choice
          options={options.nodes.filter((node) => node.id !== server.node_id).map((node) => ({ label: node.name, value: node.id }))}
          value={transferNode}
          onChange={setTransferNode}
        />
        <Button
          title="Transfer server"
          small
          variant="secondary"
          disabled={!transferNode}
          onPress={() => run('transfer', () => api.post(`/api/mobile/admin/servers/${id}/transfer`, { node_id: transferNode }), 'Transfer started.')}
        />
        <Button title="Reinstall server" variant="danger" onPress={reinstall} loading={busy === 'reinstall'} />
        <Button title="Delete server" variant="danger" onPress={deleteServer} loading={busy === 'delete'} />
      </Card>

      {actionError ? <Warning>{actionError}</Warning> : null}
      {notice ? <Hint>{notice}</Hint> : null}
    </Screen>
  );
}
