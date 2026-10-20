import { useState } from 'react';

import { AppText, Button, Card, Choice, Field, Hint, Loading, Screen, SectionHeader, Warning } from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/format';
import type { PanelSettings } from '@/lib/types';

export default function AdminSettingsScreen() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [smtpPassword, setSmtpPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, loading, reload } = useLoad(async () => {
    const result = await api.get<PanelSettings>('/api/mobile/admin/settings');
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(result.data)) {
      if (key === 'smtp_password_set') continue;
      next[key] = String(value ?? '');
    }
    setForm(next);
    return result.data;
  }, []);

  const update = (key: string, value: string) => setForm((previous) => ({ ...previous, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.post('/api/mobile/admin/settings', { ...form, smtp_password: smtpPassword || undefined });
      setSmtpPassword('');
      setNotice('Settings saved.');
      await reload(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <Loading label="Loading settings…" />;

  return (
    <Screen footer={<Button title="Save settings" onPress={save} loading={saving} />}>
      <AppText variant="title">Panel settings</AppText>

      <SectionHeader title="General" />
      <Card>
        <Field label="Site name" value={form.site_name ?? ''} onChangeText={(value) => update('site_name', value)} />
        <Field label="Timezone" value={form.timezone ?? ''} onChangeText={(value) => update('timezone', value)} placeholder="Europe/Madrid" autoCapitalize="none" />
        <Field label="Default language" value={form.default_language ?? ''} onChangeText={(value) => update('default_language', value)} placeholder="en" autoCapitalize="none" />
        <AppText variant="label">Two-factor requirement</AppText>
        <Choice
          options={[
            { label: 'None', value: 'None' },
            { label: 'Admin only', value: 'Admin Only' },
            { label: 'All users', value: 'All Users' },
          ]}
          value={form.two_factor_auth ?? 'None'}
          onChange={(value) => update('two_factor_auth', value)}
        />
      </Card>

      <SectionHeader title="Mail (SMTP)" />
      <Card>
        <Field label="SMTP host" value={form.smtp_host ?? ''} onChangeText={(value) => update('smtp_host', value)} autoCapitalize="none" />
        <Field label="SMTP port" value={form.smtp_port ?? ''} onChangeText={(value) => update('smtp_port', value)} keyboardType="number-pad" />
        <AppText variant="label">Encryption</AppText>
        <Choice
          options={[
            { label: 'TLS', value: 'tls' },
            { label: 'SSL', value: 'ssl' },
            { label: 'None', value: 'none' },
          ]}
          value={form.smtp_encryption ?? 'tls'}
          onChange={(value) => update('smtp_encryption', value)}
        />
        <Field label="SMTP username" value={form.smtp_username ?? ''} onChangeText={(value) => update('smtp_username', value)} autoCapitalize="none" />
        <Field
          label="SMTP password"
          value={smtpPassword}
          onChangeText={setSmtpPassword}
          secureTextEntry
          hint={data?.smtp_password_set ? 'A password is already stored. Leave blank to keep it.' : 'No password stored yet.'}
        />
        <Field label="From email" value={form.smtp_from_email ?? ''} onChangeText={(value) => update('smtp_from_email', value)} autoCapitalize="none" keyboardType="email-address" />
        <Field label="From name" value={form.smtp_from_name ?? ''} onChangeText={(value) => update('smtp_from_name', value)} />
      </Card>

      <SectionHeader title="Captcha" />
      <Card>
        <AppText variant="label">Provider</AppText>
        <Choice
          options={[
            { label: 'Disabled', value: 'Disabled' },
            { label: 'Turnstile', value: 'Cloudflare Turnstile' },
            { label: 'HCaptcha', value: 'HCaptcha' },
            { label: 'Recaptcha', value: 'Google Recaptcha' },
          ]}
          value={form.captcha_provider ?? 'Disabled'}
          onChange={(value) => update('captcha_provider', value)}
        />
        {(form.captcha_provider ?? 'Disabled') === 'Cloudflare Turnstile' ? (
          <>
            <Field label="Turnstile site key" value={form.cloudflare_turnstile_site_key ?? ''} onChangeText={(value) => update('cloudflare_turnstile_site_key', value)} autoCapitalize="none" />
            <Field label="Turnstile secret" value={form.cloudflare_turnstile_secret_key ?? ''} onChangeText={(value) => update('cloudflare_turnstile_secret_key', value)} autoCapitalize="none" secureTextEntry />
          </>
        ) : null}
        {(form.captcha_provider ?? 'Disabled') === 'HCaptcha' ? (
          <>
            <Field label="HCaptcha site key" value={form.hcaptcha_site_key ?? ''} onChangeText={(value) => update('hcaptcha_site_key', value)} autoCapitalize="none" />
            <Field label="HCaptcha secret" value={form.hcaptcha_secret_key ?? ''} onChangeText={(value) => update('hcaptcha_secret_key', value)} autoCapitalize="none" secureTextEntry />
          </>
        ) : null}
        {(form.captcha_provider ?? 'Disabled') === 'Google Recaptcha' ? (
          <>
            <Field label="Recaptcha site key" value={form.google_recaptcha_site_key ?? ''} onChangeText={(value) => update('google_recaptcha_site_key', value)} autoCapitalize="none" />
            <Field label="Recaptcha secret" value={form.google_recaptcha_secret_key ?? ''} onChangeText={(value) => update('google_recaptcha_secret_key', value)} autoCapitalize="none" secureTextEntry />
          </>
        ) : null}
      </Card>

      {error ? <Warning>{error}</Warning> : null}
      {notice ? <Hint>{notice}</Hint> : null}
    </Screen>
  );
}
