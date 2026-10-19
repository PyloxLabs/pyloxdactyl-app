import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { AppText, Button, Card, CheckRow, EmptyState, Field, IconButton, Loading, ModalCard, Pill, Row, Warning, useColors } from '@/components/ui';
import { UserPlusIcon } from '@/components/icons';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage, formatDate } from '@/lib/format';
import type { PanelUser } from '@/lib/types';

export default function AdminUsersScreen() {
  const router = useRouter();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rootAdmin, setRootAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const { data, error, loading, refreshing, reload } = useLoad(() => api.get<{ data: PanelUser[] }>('/api/mobile/admin/users'), []);
  const users = (data?.data ?? []).filter((user) => {
    if (!search.trim()) return true;
    const query = search.trim().toLowerCase();
    return user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
  });

  const create = async () => {
    setBusy(true);
    setModalError(null);
    try {
      await api.post('/api/mobile/admin/users', {
        username: username.trim(),
        email: email.trim(),
        password,
        root_admin: rootAdmin,
      });
      setCreating(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setRootAdmin(false);
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
        data={users}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <Row justify="space-between">
              <AppText variant="title">Users</AppText>
              <IconButton label="New user" small icon={(color) => <UserPlusIcon color={color} />} onPress={() => setCreating(true)} />
            </Row>
            <Field placeholder="Search by username or email" value={search} onChangeText={setSearch} autoCapitalize="none" />
            {error ? <Warning>{error}</Warning> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No users found" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: String(item.id) } })}>
            <Card>
              <Row justify="space-between">
                <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>
                  {item.username}
                </AppText>
                {item.root_admin ? <Pill label="Admin" tone="primary" /> : null}
                {item.totp_enabled ? <Pill label="2FA" tone="success" /> : null}
              </Row>
              <AppText variant="small" color="textSecondary">
                {item.email}
              </AppText>
              <AppText variant="small" color="textSecondary">
                Joined {formatDate(item.created_at)}
              </AppText>
            </Card>
          </Pressable>
        )}
      />

      <ModalCard visible={creating} title="New user" onClose={() => setCreating(false)}>
        <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry hint="At least 8 characters." />
        <CheckRow label="Root administrator" checked={rootAdmin} onPress={() => setRootAdmin((value) => !value)} />
        {modalError ? <Warning>{modalError}</Warning> : null}
        <Button
          title="Create user"
          onPress={create}
          loading={busy}
          disabled={!username.trim() || !email.trim() || password.length < 8}
        />
      </ModalCard>
    </>
  );
}
