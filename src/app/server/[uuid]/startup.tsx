import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppText, Button, Card, Choice, Field, Hint, KeyValue, Loading, Screen, SectionHeader, Warning } from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';
import type { StartupInfo } from '@/lib/types';

export default function StartupScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data, error, loading, reload } = useLoad(() => api.get<StartupInfo>(`/api/mobile/servers/${uuid}/startup`), [uuid]);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = {};
    for (const variable of data.variables) {
      next[variable.env_var] = String(variable.current_value ?? variable.default_value ?? '');
    }
    setValues(next);
    setImage(data.current_image || data.egg_images[0]?.image || null);
  }, [data]);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await api.post(`/api/mobile/servers/${uuid}/startup`, { vars: values, image });
      setSaved(true);
      await reload(true);
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <Loading label="Loading startup settings…" />;
  if (error) return <Screen><Warning>{error}</Warning><Button title="Retry" onPress={() => reload()} /></Screen>;
  if (!data) return null;

  const editable = data.can_edit !== false;
  const editableVariables = data.variables.filter((variable) => Boolean(variable.user_editable));

  return (
    <Screen>
      <Card>
        <AppText variant="caption" color="textSecondary">
          Egg
        </AppText>
        <AppText variant="heading">{data.egg?.name || 'No egg assigned'}</AppText>
      </Card>

      <SectionHeader title="Startup command" />
      <Card>
        <AppText variant="mono" selectable>
          {data.startup_command || '—'}
        </AppText>
        <Hint>Startup commands are managed by the egg and panel administrators.</Hint>
      </Card>

      {data.egg_images.length > 0 ? (
        <>
          <SectionHeader title="Docker image" />
          <Card>
            <Choice
              options={data.egg_images.map((option) => ({ label: option.label || option.image, value: option.image }))}
              value={image}
              onChange={(next) => editable && setImage(next)}
            />
            {image ? <KeyValue label="Selected" value={image} mono /> : null}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Variables" />
      {data.variables.length === 0 ? (
        <Card>
          <Hint>This egg has no variables.</Hint>
        </Card>
      ) : (
        <Card>
          {data.variables.map((variable, index) => (
            <Field
              key={variable.env_var}
              label={`${variable.name} (${variable.env_var})`}
              value={values[variable.env_var] ?? ''}
              onChangeText={(text) => setValues((previous) => ({ ...previous, [variable.env_var]: text }))}
              editable={editable && Boolean(variable.user_editable)}
              hint={variable.user_editable ? variable.description || undefined : 'This variable is managed by the panel.'}
              autoCapitalize="none"
              autoCorrect={false}
              multiline={String(variable.field_type || '').includes('text')}
              style={index === 0 ? undefined : { marginTop: 6 }}
            />
          ))}
        </Card>
      )}

      {saveError ? <Warning>{saveError}</Warning> : null}
      {saved ? <Hint>Startup settings saved. Restart the server to apply changes.</Hint> : null}
      {editable ? (
        <Button title="Save changes" onPress={save} loading={saving} disabled={editableVariables.length === 0} />
      ) : (
        <Hint>You do not have permission to edit startup settings.</Hint>
      )}
    </Screen>
  );
}
