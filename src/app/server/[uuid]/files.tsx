import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { AppText, Button, EmptyState, Field, Hint, IconButton, Loading, ModalCard, Row, Warning, useColors } from '@/components/ui';
import { FileIcon, FolderIcon, FolderPlusIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { canServer } from '@/lib/access';
import { api } from '@/lib/api';
import { errorMessage, formatBytes, formatDate, joinPath, parentPath } from '@/lib/format';
import type { FileEntry, Server } from '@/lib/types';

type PromptMode = 'newFolder' | 'rename' | 'move' | 'permissions';

export default function FilesScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const colors = useColors();

  const [path, setPath] = useState('/');
  const [sheetEntry, setSheetEntry] = useState<FileEntry | null>(null);
  const [prompt, setPrompt] = useState<PromptMode | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const { data, error, loading, refreshing, reload } = useLoad(async () => {
    const [detail, listing] = await Promise.all([
      api.serverDetail(uuid),
      api.get<{ data: FileEntry[] }>(`/api/mobile/servers/${uuid}/files?path=${encodeURIComponent(path)}`),
    ]);
    return { server: detail.data, entries: listing.data || [] };
  }, [uuid, path]);

  const server: Server | undefined = data?.server;
  const entries = [...(data?.entries ?? [])].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const canWrite = canServer(server, 'files.write');
  const canDelete = canServer(server, 'files.delete');

  const openEntry = (entry: FileEntry) => {
    const target = joinPath(path, entry.name);
    if (entry.isDirectory) {
      setPath(target);
      return;
    }
    if (!canWrite) {
      Alert.alert('Read only', 'You do not have permission to edit files on this server.');
      return;
    }
    router.push({ pathname: '/server/[uuid]/file', params: { uuid, path: target } });
  };

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setModalError(null);
    try {
      await action();
      setPrompt(null);
      setSheetEntry(null);
      await reload(true);
    } catch (err) {
      setModalError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openPrompt = (mode: PromptMode, entry?: FileEntry | null, initial = '') => {
    setSheetEntry(entry ?? null);
    setPrompt(mode);
    setValue(initial);
    setModalError(null);
  };

  const submitPrompt = () => {
    if (!prompt) return;
    const entry = sheetEntry;
    if (prompt === 'newFolder') {
      void runAction(() => api.post(`/api/mobile/servers/${uuid}/files/mkdir`, { dir: path, name: value.trim() }));
    } else if (prompt === 'rename' && entry) {
      void runAction(() =>
        api.post(`/api/mobile/servers/${uuid}/files/rename`, { file: joinPath(path, entry.name), name: value.trim() }),
      );
    } else if (prompt === 'move' && entry) {
      void runAction(() =>
        api.post(`/api/mobile/servers/${uuid}/files/move`, { paths: [joinPath(path, entry.name)], toDir: value.trim() || '/' }),
      );
    } else if (prompt === 'permissions' && entry) {
      void runAction(() =>
        api.post(`/api/mobile/servers/${uuid}/files/permissions`, { file: joinPath(path, entry.name), mode: value.trim() }),
      );
    }
  };

  const fileAction = (kind: 'duplicate' | 'archive' | 'extract') => {
    const entry = sheetEntry;
    if (!entry) return;
    const target = joinPath(path, entry.name);
    if (kind === 'duplicate') void runAction(() => api.post(`/api/mobile/servers/${uuid}/files/duplicate`, { file: target }));
    if (kind === 'archive') void runAction(() => api.post(`/api/mobile/servers/${uuid}/files/archive`, { paths: [target] }));
    if (kind === 'extract') void runAction(() => api.post(`/api/mobile/servers/${uuid}/files/extract`, { file: target }));
  };

  const deleteEntry = () => {
    const entry = sheetEntry;
    if (!entry) return;
    const target = joinPath(path, entry.name);
    Alert.alert('Delete entry', `Permanently delete "${entry.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void runAction(() => api.post(`/api/mobile/servers/${uuid}/files/delete`, { paths: [target] })),
      },
    ]);
  };

  const promptLabels: Record<PromptMode, { title: string; label: string; placeholder: string }> = {
    newFolder: { title: 'New folder', label: 'Folder name', placeholder: 'plugins' },
    rename: { title: 'Rename', label: 'New name', placeholder: 'server.properties' },
    move: { title: 'Move', label: 'Destination folder', placeholder: '/config' },
    permissions: { title: 'Permissions', label: 'File mode', placeholder: '644' },
  };

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 120 }}
        data={entries}
        keyExtractor={(item) => item.name}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <Row justify="space-between">
              <AppText variant="title">Files</AppText>
              {canWrite ? (
                <IconButton label="New folder" small variant="secondary" icon={(color) => <FolderPlusIcon color={color} />} onPress={() => openPrompt('newFolder')} />
              ) : null}
            </Row>
            <Row gap={8}>
              <Button title="Up" small variant="secondary" onPress={() => setPath(parentPath(path))} disabled={path === '/'} />
              <AppText variant="mono" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
                {path}
              </AppText>
            </Row>
            {error ? <Warning>{error}</Warning> : null}
            {!canWrite ? <Hint>You can browse files but not edit them with this account.</Hint> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="This folder is empty" hint="Create a folder or upload files from the web panel." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEntry(item)}
            onLongPress={() => canWrite && setSheetEntry(item)}
            style={({ pressed }) => ({
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              opacity: pressed ? 0.75 : 1,
            })}>
            {item.isDirectory ? (
              <FolderIcon size={24} color={colors.primary} />
            ) : (
              <FileIcon size={24} color={colors.textSecondary} />
            )}
            <View style={{ flex: 1, gap: 1 }}>
              <AppText variant="body" numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText variant="small" color="textSecondary">
                {item.isDirectory ? 'Folder' : formatBytes(item.size)} · {item.modified ? formatDate(item.modified) : '—'}
              </AppText>
            </View>
            {canWrite ? (
              <Pressable onPress={() => setSheetEntry(item)} hitSlop={10} style={{ paddingHorizontal: 6 }}>
                <AppText variant="heading" color="textSecondary">
                  ⋯
                </AppText>
              </Pressable>
            ) : null}
          </Pressable>
        )}
      />

      <ModalCard visible={sheetEntry !== null} title={sheetEntry?.name} onClose={() => setSheetEntry(null)}>
        {modalError ? <Warning>{modalError}</Warning> : null}
        <Button title="Rename" variant="secondary" onPress={() => openPrompt('rename', sheetEntry, sheetEntry?.name ?? '')} />
        <Button title="Move" variant="secondary" onPress={() => openPrompt('move', sheetEntry, path)} />
        <Button title="Permissions" variant="secondary" onPress={() => openPrompt('permissions', sheetEntry, '644')} />
        {!sheetEntry?.isDirectory ? (
          <Button title="Duplicate" variant="secondary" onPress={() => fileAction('duplicate')} />
        ) : null}
        <Button title="Create archive" variant="secondary" onPress={() => fileAction('archive')} />
        {!sheetEntry?.isDirectory ? <Button title="Extract archive" variant="secondary" onPress={() => fileAction('extract')} /> : null}
        {canDelete ? <Button title="Delete" variant="danger" onPress={deleteEntry} /> : null}
        {busy ? <Hint>Working…</Hint> : null}
      </ModalCard>

      <ModalCard visible={prompt !== null} title={prompt ? promptLabels[prompt].title : ''} onClose={() => setPrompt(null)}>
        <Field
          label={prompt ? promptLabels[prompt].label : ''}
          value={value}
          onChangeText={setValue}
          placeholder={prompt ? promptLabels[prompt].placeholder : ''}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {prompt === 'permissions' ? <Hint>Use a numeric mode such as 644 or 755.</Hint> : null}
        {modalError ? <Warning>{modalError}</Warning> : null}
        <Button title="Apply" onPress={submitPrompt} loading={busy} disabled={!value.trim()} />
      </ModalCard>
    </>
  );
}
