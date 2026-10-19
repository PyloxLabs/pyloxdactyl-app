import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Hint, IconButton, Loading, Row, Warning, useColors } from '@/components/ui';
import { SaveIcon } from '@/components/icons';
import { Fonts } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';

export default function FileEditorScreen() {
  const { uuid, path } = useLocalSearchParams<{ uuid: string; path: string }>();
  const navigation = useNavigation();
  const colors = useColors();
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, error, loading, reload } = useLoad(
    () => api.get<{ path: string; content: string }>(`/api/mobile/servers/${uuid}/file?path=${encodeURIComponent(path)}`),
    [uuid, path],
  );

  useEffect(() => {
    if (data) {
      setContent(data.content);
      setDirty(false);
    }
  }, [data]);

  useEffect(() => {
    if (path) navigation.setOptions({ title: path.split('/').pop() || 'Edit file' });
  }, [navigation, path]);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.post(`/api/mobile/servers/${uuid}/file`, { path, content });
      setDirty(false);
      Alert.alert('Saved', 'Your changes were written to disk.');
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <Loading label="Opening file…" />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={{ flex: 1, padding: 12, gap: 10 }}>
        <Row justify="space-between">
          <AppText variant="small" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
            {path}
          </AppText>
          <IconButton
            label={dirty ? 'Save changes' : 'Save'}
            small
            icon={(color) => <SaveIcon color={color} />}
            onPress={save}
            loading={saving}
            disabled={!dirty}
          />
        </Row>
        {error ? <Warning>{error}</Warning> : null}
        {saveError ? <Warning>{saveError}</Warning> : null}
        {data ? (
          <TextInput
            value={content}
            onChangeText={(text) => {
              setContent(text);
              setDirty(true);
            }}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            style={[
              styles.editor,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text, fontFamily: Fonts.mono },
            ]}
          />
        ) : (
          <Button title="Retry" onPress={() => reload()} />
        )}
        <Hint>Binary and archive files cannot be edited here.</Hint>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
    textAlignVertical: 'top',
  },
});
