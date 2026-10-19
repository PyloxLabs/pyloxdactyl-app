import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  CheckRow,
  Choice,
  Field,
  Hint,
  IconButton,
  KeyValue,
  Loading,
  ModalCard,
  Row,
  Screen,
  SectionHeader,
  Warning,
} from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { PencilIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';
import type { AdminEggDetail, EggVariable } from '@/lib/types';

const emptyVariable = {
  name: '',
  description: '',
  env_var: '',
  default_value: '',
  rules: '',
  field_type: 'text',
  user_viewable: true,
  user_editable: true,
};

export default function AdminEggScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const { data, error, loading, reload } = useLoad(() => api.get<AdminEggDetail>(`/api/mobile/admin/eggs/${id}`), [id]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    nest_id: 0,
    docker_image: '',
    startup: '',
    author: '',
    docker_images: '',
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [variableModal, setVariableModal] = useState<EggVariable | 'new' | null>(null);
  const [variableForm, setVariableForm] = useState(emptyVariable);

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.egg.name,
      description: data.egg.description || '',
      nest_id: data.egg.nest_id,
      docker_image: data.egg.docker_image || '',
      startup: data.egg.startup || '',
      author: data.egg.author || '',
      docker_images: data.egg.docker_images || '',
    });
    navigation.setOptions({ title: data.egg.name });
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

  const openVariable = (variable: EggVariable | 'new') => {
    setVariableModal(variable);
    setActionError(null);
    if (variable === 'new') {
      setVariableForm(emptyVariable);
    } else {
      setVariableForm({
        name: variable.name,
        description: variable.description || '',
        env_var: variable.env_var,
        default_value: variable.default_value || '',
        rules: variable.rules || '',
        field_type: variable.field_type || 'text',
        user_viewable: Boolean(variable.user_viewable),
        user_editable: Boolean(variable.user_editable),
      });
    }
  };

  const saveVariable = async () => {
    if (!variableModal) return;
    setBusy('variable');
    setActionError(null);
    try {
      if (variableModal === 'new') {
        await api.post(`/api/mobile/admin/eggs/${id}/variables`, variableForm);
      } else {
        await api.post(`/api/mobile/admin/eggs/${id}/variables/${variableModal.id}`, variableForm);
      }
      setVariableModal(null);
      await reload(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const deleteVariable = (variable: EggVariable) => {
    Alert.alert('Delete variable', `Delete ${variable.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => run('variableDelete', () => api.post(`/api/mobile/admin/eggs/${id}/variables/${variable.id}/delete`, {})),
      },
    ]);
  };

  const deleteEgg = () => {
    Alert.alert('Delete egg', 'Servers using this egg may stop working. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          run('delete', async () => {
            await api.post(`/api/mobile/admin/eggs/${id}/delete`, {});
            router.back();
          }),
      },
    ]);
  };

  if (loading && !data) return <Loading label="Loading egg…" />;
  if (error && !data) {
    return (
      <Screen>
        <Warning>{error}</Warning>
        <Button title="Retry" onPress={() => reload()} />
      </Screen>
    );
  }
  if (!data) return null;

  return (
    <>
      <Screen>
        <AppText variant="title">{data.egg.name}</AppText>
        <Card>
          <KeyValue label="Nest" value={data.egg.nest_name || `#${data.egg.nest_id}`} />
          <KeyValue label="Author" value={data.egg.author || '—'} />
          <KeyValue label="UUID" value={data.egg.uuid || '—'} mono />
        </Card>

        <SectionHeader title="Definition" />
        <Card>
          <Field label="Name" value={form.name} onChangeText={(value) => setForm((previous) => ({ ...previous, name: value }))} />
          <Field label="Description" value={form.description} onChangeText={(value) => setForm((previous) => ({ ...previous, description: value }))} />
          <AppText variant="label">Nest</AppText>
          <Choice
            options={data.options.nests.map((nest) => ({ label: nest.name, value: nest.id }))}
            value={form.nest_id}
            onChange={(value) => setForm((previous) => ({ ...previous, nest_id: value }))}
          />
          <Field label="Author" value={form.author} onChangeText={(value) => setForm((previous) => ({ ...previous, author: value }))} />
          <Field label="Docker image" value={form.docker_image} onChangeText={(value) => setForm((previous) => ({ ...previous, docker_image: value }))} autoCapitalize="none" />
          <Field label="Startup command" value={form.startup} onChangeText={(value) => setForm((previous) => ({ ...previous, startup: value }))} autoCapitalize="none" />
          <Field
            label="Docker images JSON"
            value={form.docker_images}
            onChangeText={(value) => setForm((previous) => ({ ...previous, docker_images: value }))}
            multiline
            autoCapitalize="none"
            hint='Optional. Example: {"ghcr.io/parkervcp/yolks:java_17":"Java 17"}'
          />
          <Button
            title="Save egg"
            onPress={() => run('save', () => api.post(`/api/mobile/admin/eggs/${id}`, form))}
            loading={busy === 'save'}
            disabled={!form.name.trim()}
          />
        </Card>

        <SectionHeader
          title="Variables"
          action={<IconButton label="Add variable" small variant="secondary" icon={(color) => <PlusIcon color={color} />} onPress={() => openVariable('new')} />}
        />
        <Card>
          {data.variables.length === 0 ? <Hint>No variables.</Hint> : null}
          {data.variables.map((variable) => (
            <Row key={variable.id} justify="space-between" align="flex-start">
              <View style={{ gap: 2, flex: 1 }}>
                <AppText variant="body">{variable.name}</AppText>
                <AppText variant="small" color="textSecondary">
                  {variable.env_var} · default {variable.default_value || '(empty)'}
                </AppText>
                <AppText variant="small" color="textSecondary">
                  {variable.user_viewable ? 'Visible' : 'Hidden'} · {variable.user_editable ? 'Editable' : 'Locked'} · {variable.field_type || 'text'}
                </AppText>
              </View>
              <Row gap={6}>
                <IconButton label="Edit variable" small variant="secondary" icon={(color) => <PencilIcon color={color} />} onPress={() => openVariable(variable)} />
                <IconButton label="Delete variable" small variant="danger" icon={(color) => <TrashIcon color={color} />} onPress={() => deleteVariable(variable)} />
              </Row>
            </Row>
          ))}
        </Card>

        <Button title="Delete egg" variant="danger" onPress={deleteEgg} loading={busy === 'delete'} />

        {actionError && !variableModal ? <Warning>{actionError}</Warning> : null}
        {notice ? <Hint>{notice}</Hint> : null}
      </Screen>

      <ModalCard visible={variableModal !== null} title={variableModal === 'new' ? 'New variable' : 'Edit variable'} onClose={() => setVariableModal(null)}>
        <Field label="Display name" value={variableForm.name} onChangeText={(value) => setVariableForm((previous) => ({ ...previous, name: value }))} />
        <Field label="Environment variable" value={variableForm.env_var} onChangeText={(value) => setVariableForm((previous) => ({ ...previous, env_var: value.toUpperCase() }))} autoCapitalize="characters" />
        <Field label="Description" value={variableForm.description} onChangeText={(value) => setVariableForm((previous) => ({ ...previous, description: value }))} />
        <Field label="Default value" value={variableForm.default_value} onChangeText={(value) => setVariableForm((previous) => ({ ...previous, default_value: value }))} />
        <Field label="Validation rules" value={variableForm.rules} onChangeText={(value) => setVariableForm((previous) => ({ ...previous, rules: value }))} placeholder="required|string|max:255" autoCapitalize="none" />
        <AppText variant="label">Field type</AppText>
        <Choice
          options={[
            { label: 'Text', value: 'text' },
            { label: 'Number', value: 'number' },
            { label: 'Boolean', value: 'boolean' },
          ]}
          value={variableForm.field_type}
          onChange={(value) => setVariableForm((previous) => ({ ...previous, field_type: value }))}
        />
        <CheckRow label="Users can view" checked={variableForm.user_viewable} onPress={() => setVariableForm((previous) => ({ ...previous, user_viewable: !previous.user_viewable }))} />
        <CheckRow label="Users can edit" checked={variableForm.user_editable} onPress={() => setVariableForm((previous) => ({ ...previous, user_editable: !previous.user_editable }))} />
        {actionError ? <Warning>{actionError}</Warning> : null}
        <Button title="Save variable" onPress={saveVariable} loading={busy === 'variable'} disabled={!variableForm.name.trim() || !variableForm.env_var.trim()} />
      </ModalCard>
    </>
  );
}
