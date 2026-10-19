import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';

import { AppText, Button, Card, Choice, EmptyState, Field, Hint, IconButton, Loading, ModalCard, Pill, Row, Warning, useColors } from '@/components/ui';
import { EggIcon, LayersIcon, PencilIcon, TrashIcon, UploadIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';
import type { AdminEgg, Nest } from '@/lib/types';

type Mode = 'nest' | 'egg' | 'import' | null;

const emptyEgg = { name: '', description: '', nest_id: 0, docker_image: '', startup: '' };

export default function AdminEggsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [mode, setMode] = useState<Mode>(null);
  const [nestName, setNestName] = useState('');
  const [nestDescription, setNestDescription] = useState('');
  const [eggForm, setEggForm] = useState(emptyEgg);
  const [importJson, setImportJson] = useState('');
  const [importNest, setImportNest] = useState(0);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const { data, error, loading, refreshing, reload } = useLoad(async () => {
    const [nests, eggs] = await Promise.all([
      api.get<{ data: Nest[] }>('/api/mobile/admin/nests'),
      api.get<{ data: AdminEgg[]; options: { nests: Nest[] } }>('/api/mobile/admin/eggs'),
    ]);
    return { nests: nests.data ?? [], eggs: eggs.data ?? [] };
  }, []);

  const nests = data?.nests ?? [];
  const eggs = data?.eggs ?? [];

  const openMode = (next: Mode) => {
    setMode(next);
    setModalError(null);
    setNestName('');
    setNestDescription('');
    setImportJson('');
    setImportNest(nests[0]?.id ?? 0);
    setEggForm({ ...emptyEgg, nest_id: nests[0]?.id ?? 0 });
  };

  const createNest = async () => {
    setBusy(true);
    setModalError(null);
    try {
      await api.post('/api/mobile/admin/nests', { name: nestName.trim(), description: nestDescription });
      setMode(null);
      await reload(true);
    } catch (err) {
      setModalError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const removeNest = (nest: Nest) => {
    Alert.alert('Delete nest', `Delete ${nest.name} and its eggs?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/api/mobile/admin/nests/${nest.id}/delete`, {});
            await reload(true);
          } catch (err) {
            Alert.alert('Delete failed', errorMessage(err));
          }
        },
      },
    ]);
  };

  const createEgg = async () => {
    setBusy(true);
    setModalError(null);
    try {
      await api.post('/api/mobile/admin/eggs', eggForm);
      setMode(null);
      await reload(true);
    } catch (err) {
      setModalError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const importEgg = async () => {
    setBusy(true);
    setModalError(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(importJson);
      } catch {
        throw new Error('That is not valid JSON. Paste the egg JSON file contents.');
      }
      await api.post('/api/mobile/admin/eggs/import', { egg: parsed, nest_id: importNest });
      setMode(null);
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
        data={eggs}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <Row justify="space-between">
              <AppText variant="title">Nests & eggs</AppText>
              <Row gap={6}>
                <IconButton label="New nest" small variant="secondary" icon={(color) => <LayersIcon color={color} />} onPress={() => openMode('nest')} />
                <IconButton label="New egg" small icon={(color) => <EggIcon color={color} />} onPress={() => openMode('egg')} disabled={nests.length === 0} />
              </Row>
            </Row>
            <Row justify="flex-end">
              <IconButton
                label="Import egg JSON"
                small
                variant="secondary"
                icon={(color) => <UploadIcon color={color} />}
                onPress={() => openMode('import')}
                disabled={nests.length === 0}
              />
            </Row>

            <SectionNests nests={nests} onRemove={removeNest} />
            {error ? <Warning>{error}</Warning> : null}
            <AppText variant="caption" color="textSecondary">
              Eggs
            </AppText>
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No eggs" hint="Create a nest, then add an egg or import one." />}
        renderItem={({ item }) => (
          <Card>
            <Row justify="space-between">
              <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>
                {item.name}
              </AppText>
              <Pill label={item.nest_name || `Nest #${item.nest_id}`} />
            </Row>
            <AppText variant="small" color="textSecondary" numberOfLines={2}>
              {item.description || 'No description'}
            </AppText>
            <Row justify="flex-end">
              <IconButton
                label="Edit egg"
                small
                variant="secondary"
                icon={(color) => <PencilIcon color={color} />}
                onPress={() => router.push({ pathname: '/admin/egg/[id]', params: { id: String(item.id) } })}
              />
            </Row>
          </Card>
        )}
      />

      <ModalCard visible={mode === 'nest'} title="New nest" onClose={() => setMode(null)}>
        <Field label="Name" value={nestName} onChangeText={setNestName} />
        <Field label="Description" value={nestDescription} onChangeText={setNestDescription} />
        {modalError ? <Warning>{modalError}</Warning> : null}
        <Button title="Create nest" onPress={createNest} loading={busy} disabled={!nestName.trim()} />
      </ModalCard>

      <ModalCard visible={mode === 'egg'} title="New egg" onClose={() => setMode(null)}>
        <Field label="Name" value={eggForm.name} onChangeText={(value) => setEggForm((previous) => ({ ...previous, name: value }))} />
        <Field label="Description" value={eggForm.description} onChangeText={(value) => setEggForm((previous) => ({ ...previous, description: value }))} />
        <AppText variant="label">Nest</AppText>
        <Choice
          options={nests.map((nest) => ({ label: nest.name, value: nest.id }))}
          value={eggForm.nest_id}
          onChange={(value) => setEggForm((previous) => ({ ...previous, nest_id: value }))}
        />
        <Field label="Docker image" value={eggForm.docker_image} onChangeText={(value) => setEggForm((previous) => ({ ...previous, docker_image: value }))} autoCapitalize="none" />
        <Field label="Startup command" value={eggForm.startup} onChangeText={(value) => setEggForm((previous) => ({ ...previous, startup: value }))} autoCapitalize="none" />
        {modalError ? <Warning>{modalError}</Warning> : null}
        <Button title="Create egg" onPress={createEgg} loading={busy} disabled={!eggForm.name.trim() || !eggForm.nest_id} />
      </ModalCard>

      <ModalCard visible={mode === 'import'} title="Import egg" onClose={() => setMode(null)}>
        <AppText variant="label">Nest</AppText>
        <Choice
          options={nests.map((nest) => ({ label: nest.name, value: nest.id }))}
          value={importNest}
          onChange={setImportNest}
        />
        <Field
          label="Egg JSON"
          value={importJson}
          onChangeText={setImportJson}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          placeholder='{ "name": "Paper", ... }'
          style={{ minHeight: 220 }}
        />
        <Hint>Paste the contents of a Pterodactyl-compatible egg JSON file.</Hint>
        {modalError ? <Warning>{modalError}</Warning> : null}
        <Button title="Import" onPress={importEgg} loading={busy} disabled={!importJson.trim() || !importNest} />
      </ModalCard>
    </>
  );
}

function SectionNests({ nests, onRemove }: { nests: Nest[]; onRemove: (nest: Nest) => void }) {
  const colors = useColors();
  if (nests.length === 0) return null;
  return (
    <Card style={{ gap: 6 }}>
      <AppText variant="caption" color="textSecondary">
        Nests
      </AppText>
      {nests.map((nest) => (
        <Row key={nest.id} justify="space-between">
          <View style={{ gap: 1, flex: 1 }}>
            <AppText variant="body">{nest.name}</AppText>
            <AppText variant="small" color="textSecondary">
              {nest.egg_count ?? 0} eggs
            </AppText>
          </View>
          <IconButton label="Delete nest" small variant="ghost" icon={(color) => <TrashIcon color={color} />} onPress={() => onRemove(nest)} />
        </Row>
      ))}
      <View style={{ height: 1, backgroundColor: colors.border }} />
    </Card>
  );
}
