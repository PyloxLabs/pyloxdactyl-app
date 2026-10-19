import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';

import { AppText, Button, Card, Choice, EmptyState, Field, Hint, IconButton, KeyValue, Loading, Pill, Row, Warning, useColors } from '@/components/ui';
import { TrashIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { canServer } from '@/lib/access';
import { api } from '@/lib/api';
import { errorMessage, formatDate } from '@/lib/format';
import type { ScheduleTask } from '@/lib/types';

const ACTIONS = [
  { label: 'Start', value: 'start' },
  { label: 'Restart', value: 'restart' },
  { label: 'Stop', value: 'stop' },
  { label: 'Backup', value: 'backup' },
];

export default function SchedulesScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const colors = useColors();
  const [action, setAction] = useState('restart');
  const [cron, setCron] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, loading, refreshing, reload } = useLoad(async () => {
    const [detail, tasks] = await Promise.all([
      api.serverDetail(uuid),
      api.get<{ data: ScheduleTask[] }>(`/api/mobile/servers/${uuid}/schedules`),
    ]);
    return { server: detail.data, tasks: tasks.data ?? [] };
  }, [uuid]);

  const canManage = canServer(data?.server, 'schedules.manage');
  const tasks = data?.tasks ?? [];

  const create = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/api/mobile/servers/${uuid}/schedules`, { action, cron: cron.trim() });
      setCron('');
      await reload(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = (task: ScheduleTask) => {
    Alert.alert('Delete task', `Delete the "${task.action}" task?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/api/mobile/servers/${uuid}/schedules/delete`, { taskId: task.id });
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
      data={tasks}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ gap: 10, paddingBottom: 4 }}>
          <AppText variant="title">Schedules</AppText>
          {canManage ? (
            <Card>
              <AppText variant="label">New task</AppText>
              <Choice options={ACTIONS} value={action} onChange={setAction} />
              <Field label="Cron expression" value={cron} onChangeText={setCron} placeholder="*/30 * * * *" autoCapitalize="none" autoCorrect={false} />
              <Hint>Five fields: minute, hour, day of month, month, day of week.</Hint>
              <Button title="Add task" onPress={create} loading={busy} disabled={!cron.trim()} />
            </Card>
          ) : (
            <Hint>Your account cannot manage schedules on this server.</Hint>
          )}
          {error ? <Warning>{error}</Warning> : null}
          {actionError ? <Warning>{actionError}</Warning> : null}
        </View>
      }
      ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No scheduled tasks" hint="Add a cron task above to automate power actions and backups." />}
      renderItem={({ item }) => (
        <Card>
          <Row justify="space-between">
            <Pill label={item.action} tone="primary" />
            {canManage ? (
              <IconButton label="Delete task" small variant="danger" icon={(color) => <TrashIcon color={color} />} onPress={() => remove(item)} />
            ) : null}
          </Row>
          <KeyValue label="Cron" value={item.cron} mono />
          <KeyValue label="Last run" value={formatDate(item.last_run_at)} />
        </Card>
      )}
    />
  );
}
