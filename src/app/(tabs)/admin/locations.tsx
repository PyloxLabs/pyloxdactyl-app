import { useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';

import { AppText, Button, Card, EmptyState, Field, Hint, IconButton, Loading, ModalCard, Row, Warning, useColors } from '@/components/ui';
import { MapPinIcon, PencilIcon, TrashIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';
import type { Location } from '@/lib/types';

export default function AdminLocationsScreen() {
  const colors = useColors();
  const [editing, setEditing] = useState<Location | 'new' | null>(null);
  const [short, setShort] = useState('');
  const [long, setLong] = useState('');
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const { data, error, loading, refreshing, reload } = useLoad(
    () => api.get<{ data: Location[] }>('/api/mobile/admin/locations'),
    [],
  );

  const locations = data?.data ?? [];

  const openEditor = (location: Location | 'new') => {
    setEditing(location);
    setModalError(null);
    setShort(location === 'new' ? '' : location.short);
    setLong(location === 'new' ? '' : location.long);
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setModalError(null);
    try {
      if (editing === 'new') {
        await api.post('/api/mobile/admin/locations', { short: short.trim(), long: long.trim() });
      } else {
        await api.post(`/api/mobile/admin/locations/${editing.id}`, { short: short.trim(), long: long.trim() });
      }
      setEditing(null);
      await reload(true);
    } catch (err) {
      setModalError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = (location: Location) => {
    Alert.alert('Delete location', `Delete ${location.long}? Nodes must be moved first.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/api/mobile/admin/locations/${location.id}/delete`, {});
            await reload(true);
          } catch (err) {
            Alert.alert('Delete failed', errorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
        data={locations}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <Row justify="space-between">
              <AppText variant="title">Locations</AppText>
              <IconButton label="New location" small icon={(color) => <MapPinIcon color={color} />} onPress={() => openEditor('new')} />
            </Row>
            {error ? <Warning>{error}</Warning> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No locations" hint="Group nodes by region or provider." />}
        renderItem={({ item }) => (
          <Card>
            <Row justify="space-between">
              <AppText variant="heading">{item.long}</AppText>
              <AppText variant="mono" color="textSecondary">
                {item.short}
              </AppText>
            </Row>
            <AppText variant="small" color="textSecondary">
              {item.node_count ?? 0} nodes · {item.server_count ?? 0} servers
            </AppText>
            <Row gap={8}>
              <IconButton label="Edit location" small variant="secondary" icon={(color) => <PencilIcon color={color} />} onPress={() => openEditor(item)} />
              <IconButton label="Delete location" small variant="danger" icon={(color) => <TrashIcon color={color} />} onPress={() => remove(item)} />
            </Row>
          </Card>
        )}
      />

      <ModalCard visible={editing !== null} title={editing === 'new' ? 'New location' : 'Edit location'} onClose={() => setEditing(null)}>
        <Field label="Short code" value={short} onChangeText={setShort} placeholder="eu-west" autoCapitalize="none" />
        <Field label="Description" value={long} onChangeText={setLong} placeholder="Europe — Frankfurt" />
        <Hint>The short code appears in the panel and CLI tools.</Hint>
        {modalError ? <Warning>{modalError}</Warning> : null}
        <Button title="Save location" onPress={save} loading={busy} disabled={!short.trim() || !long.trim()} />
      </ModalCard>
    </>
  );
}
