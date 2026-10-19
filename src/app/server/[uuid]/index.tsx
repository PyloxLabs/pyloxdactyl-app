import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, Hint, IconButton, Loading, Meter, Pill, Row, Screen, SectionHeader, Warning, useColors } from '@/components/ui';
import { PlayIcon, PowerIcon, RestartIcon, SendIcon, StopIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { api, consoleSocketUrl } from '@/lib/api';
import { canServer } from '@/lib/access';
import { errorMessage, formatBytes, formatUptime, percent, statusTone } from '@/lib/format';
import type { LiveStats, Server } from '@/lib/types';

const MAX_LINES = 300;

export default function ConsoleScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useColors();

  const { data, error, reload, refreshing } = useLoad(() => api.serverDetail(uuid), [uuid]);
  const server: Server | null = data?.data ?? null;

  const [stats, setStats] = useState<LiveStats | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [command, setCommand] = useState('');
  const [powerBusy, setPowerBusy] = useState<string | null>(null);
  const consoleRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (server?.name) navigation.setOptions({ title: server.name });
  }, [navigation, server?.name]);

  const refreshStats = useCallback(
    async (quiet = true) => {
      if (pollingRef.current || !uuid) return;
      pollingRef.current = true;
      try {
        const live = await api.get<LiveStats & { status?: string | null }>(`/api/mobile/servers/${uuid}/resources`);
        if (mountedRef.current) setStats(live);
      } catch {
      } finally {
        pollingRef.current = false;
      }
      if (!quiet) await reload(true);
    },
    [reload, uuid],
  );

  useEffect(() => {
    mountedRef.current = true;
    void refreshStats();
    const interval = setInterval(() => {
      void refreshStats();
    }, 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refreshStats]);

  useEffect(() => {
    if (!uuid) return;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (closed) return;
      socket = new WebSocket(consoleSocketUrl(uuid));
      socketRef.current = socket;
      socket.onopen = () => {
        if (!closed) setConnected(true);
      };
      socket.onmessage = (event) => {
        const text = typeof event.data === 'string' ? event.data : '';
        if (!text) return;
        setLines((previous) => [...previous, ...text.split('\n').filter(Boolean)].slice(-MAX_LINES));
      };
      socket.onerror = () => {
        if (!closed) setConnected(false);
      };
      socket.onclose = () => {
        if (closed) return;
        setConnected(false);
        retry = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
      socketRef.current = null;
    };
  }, [uuid]);

  useEffect(() => {
    consoleRef.current?.scrollToEnd({ animated: false });
  }, [lines]);

  const power = async (action: 'start' | 'restart' | 'stop' | 'kill') => {
    setPowerBusy(action);
    try {
      await api.post(`/api/mobile/servers/${uuid}/power`, { action });
      await refreshStats(false);
    } catch (err) {
      Alert.alert('Power action failed', errorMessage(err));
    } finally {
      setPowerBusy(null);
    }
  };

  const sendCommand = () => {
    const value = command.trim();
    if (!value || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(value);
    setLines((previous) => [...previous, `> ${value}`].slice(-MAX_LINES));
    setCommand('');
  };

  if (!server && !error) {
    return (
      <Screen scroll={false} contentStyle={{ justifyContent: 'center' }}>
        <Loading label="Loading server…" />
      </Screen>
    );
  }

  if (error && !server) {
    return (
      <Screen>
        <Warning>{error}</Warning>
        <Button title="Retry" onPress={() => reload()} />
      </Screen>
    );
  }

  if (!server) return null;

  const status = stats?.status || server.status;
  const canPower = canServer(server, 'console.power');
  const canCommand = canServer(server, 'console.command');
  const memoryUsed = stats?.memory ?? server.live?.memory ?? 0;
  const memoryLimit = stats?.memory_limit ?? server.live?.memory_limit ?? server.memory * 1024 * 1024;
  const diskUsed = stats?.disk ?? server.live?.disk ?? 0;
  const diskLimit = stats?.disk_limit ?? server.live?.disk_limit ?? server.disk * 1024 * 1024;

  const links = {
    files: '/server/[uuid]/files',
    databases: '/server/[uuid]/databases',
    backups: '/server/[uuid]/backups',
    schedules: '/server/[uuid]/schedules',
    startup: '/server/[uuid]/startup',
    users: '/server/[uuid]/users',
    settings: '/server/[uuid]/settings',
  } as const;

  const sections = (
    [
      { title: 'Files', hint: 'Browse and edit files', href: 'files', allowed: canServer(server, 'files.read') },
      { title: 'Databases', hint: 'Create and manage databases', href: 'databases', allowed: canServer(server, 'databases.view') },
      { title: 'Backups', hint: 'Create and restore backups', href: 'backups', allowed: canServer(server, 'backups.view') },
      { title: 'Schedules', hint: 'Cron tasks for this server', href: 'schedules', allowed: canServer(server, 'schedules.view') },
      { title: 'Startup', hint: 'Command, variables and image', href: 'startup', allowed: canServer(server, 'startup.view') },
      { title: 'Subusers', hint: 'Share access with other accounts', href: 'users', allowed: Boolean(server.is_owner) },
      { title: 'Settings', hint: 'SFTP details and reinstall', href: 'settings', allowed: canServer(server, 'settings.view') },
    ] as { title: string; hint: string; href: keyof typeof links; allowed: boolean }[]
  ).filter((section) => section.allowed);

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload()} tintColor={colors.primary} />}>
      <Row justify="space-between" align="flex-start">
        <View style={{ flex: 1, gap: 3 }}>
          <AppText variant="title" numberOfLines={2}>
            {server.name}
          </AppText>
          <AppText variant="small" color="textSecondary" numberOfLines={2}>
            {[server.node_name, server.allocation_ip ? `${server.allocation_ip}:${server.allocation_port ?? ''}` : null, server.egg_name]
              .filter(Boolean)
              .join(' · ') || 'No node information'}
          </AppText>
        </View>
        <Pill label={status} tone={statusTone(status)} />
      </Row>

      <Card>
        <Row justify="space-between">
          <AppText variant="caption" color="textSecondary">
            Controls
          </AppText>
          <Pill label={connected ? 'Console live' : 'Console offline'} tone={connected ? 'success' : 'muted'} />
        </Row>
        <Row gap={8} wrap>
          <IconButton label="Start" small icon={(color) => <PlayIcon color={color} />} disabled={!canPower} loading={powerBusy === 'start'} onPress={() => power('start')} />
          <IconButton
            label="Restart"
            small
            variant="secondary"
            icon={(color) => <RestartIcon color={color} />}
            disabled={!canPower}
            loading={powerBusy === 'restart'}
            onPress={() => power('restart')}
          />
          <IconButton
            label="Stop"
            small
            variant="secondary"
            icon={(color) => <StopIcon color={color} />}
            disabled={!canPower}
            loading={powerBusy === 'stop'}
            onPress={() => power('stop')}
          />
          <IconButton
            label="Kill"
            small
            variant="danger"
            icon={(color) => <PowerIcon color={color} />}
            disabled={!canPower}
            loading={powerBusy === 'kill'}
            onPress={() => power('kill')}
          />
        </Row>
        {!canPower ? <Hint>Your account does not have power permissions for this server.</Hint> : null}
      </Card>

      <Card>
        <Row justify="space-between">
          <AppText variant="caption" color="textSecondary">
            Live usage
          </AppText>
          <AppText variant="small" color="textSecondary">
            Uptime {formatUptime(stats?.uptime)}
          </AppText>
        </Row>
        <Meter label="CPU" value={stats?.cpu ?? 0} detail={`${Math.round(stats?.cpu ?? 0)}%`} />
        <Meter
          label="Memory"
          value={percent(memoryUsed, memoryLimit)}
          detail={`${formatBytes(memoryUsed)} / ${formatBytes(memoryLimit)}`}
          tone={colors.primary}
        />
        <Meter label="Disk" value={percent(diskUsed, diskLimit)} detail={`${formatBytes(diskUsed)} / ${formatBytes(diskLimit)}`} tone={colors.warning} />
        <Row justify="space-between">
          <AppText variant="small" color="textSecondary">
            Network
          </AppText>
          <AppText variant="small">
            ↓ {formatBytes(stats?.network_rx, true)} · ↑ {formatBytes(stats?.network_tx, true)}
          </AppText>
        </Row>
        {server.install_status && server.install_status !== 'installed' ? (
          <Hint>Install status: {server.install_status}{server.install_error ? ` — ${server.install_error}` : ''}</Hint>
        ) : null}
      </Card>

      <Card style={{ padding: 0, gap: 0 }}>
        <Row justify="space-between" style={{ paddingHorizontal: 12, paddingTop: 12 }}>
          <AppText variant="caption" color="textSecondary">
            Console
          </AppText>
          <Pressable onPress={() => setLines([])}>
            <AppText variant="small" color="primary">
              Clear
            </AppText>
          </Pressable>
        </Row>
        <ScrollView
          ref={consoleRef}
          style={[styles.console, { backgroundColor: colors.console }]}
          contentContainerStyle={{ padding: 12, gap: 2 }}
          keyboardShouldPersistTaps="handled">
          {lines.length === 0 ? (
            <AppText variant="mono" color="consoleText" style={{ opacity: 0.6 }}>
              Waiting for console output…
            </AppText>
          ) : (
            lines.map((line, index) => (
              <AppText key={`${index}-${line.slice(0, 12)}`} variant="mono" color="consoleText" selectable>
                {line}
              </AppText>
            ))
          )}
        </ScrollView>
        <Row gap={8} style={{ padding: 12 }}>
          <TextInput
            value={command}
            onChangeText={setCommand}
            placeholder={canCommand ? 'Type a command…' : 'No command permission'}
            editable={canCommand}
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={sendCommand}
            returnKeyType="send"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1,
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 8,
              color: colors.text,
              paddingHorizontal: 10,
              paddingVertical: 9,
            }}
          />
          <IconButton
            label="Send command"
            small
            icon={(color) => <SendIcon color={color} />}
            onPress={sendCommand}
            disabled={!canCommand || !command.trim() || !connected}
          />
        </Row>
      </Card>

      <SectionHeader title="Manage" />
      <Card style={{ gap: 0, padding: 0 }}>
        {sections.map((section, index) => (
          <Pressable
            key={section.href}
            onPress={() => router.push({ pathname: links[section.href], params: { uuid } })}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 13,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            })}>
            <View style={{ gap: 2 }}>
              <AppText variant="body">{section.title}</AppText>
              <AppText variant="small" color="textSecondary">
                {section.hint}
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
  console: {
    height: 220,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 8,
  },
});
