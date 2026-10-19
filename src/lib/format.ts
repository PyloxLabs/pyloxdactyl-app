export function formatBytes(bytes: number | null | undefined, perSecond = false): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return '—';
  if (bytes <= 0) return perSecond ? '0 B/s' : '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exp);
  const text = value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
  return `${text} ${units[exp]}${perSecond ? '/s' : ''}`;
}

export function formatUptime(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '—';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatDate(value: string | number | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function relativeTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return '—';
  const seconds = Math.round(diff / 1000);
  if (Math.abs(seconds) < 60) return seconds <= 0 ? 'just now' : `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return minutes > 0 ? `${minutes}m ago` : 'in a minute';
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return hours > 0 ? `${hours}h ago` : 'soon';
  const days = Math.round(hours / 24);
  return days > 0 ? `${days}d ago` : 'soon';
}

export function percent(used: number | undefined, limit: number | undefined): number {
  if (!limit || !used) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function statusTone(status: string | null | undefined): 'success' | 'danger' | 'warning' | 'muted' {
  const value = (status || '').toLowerCase();
  if (['running', 'online', 'active', 'installed', 'success'].includes(value)) return 'success';
  if (['offline', 'stopped', 'crashed', 'failed', 'error'].includes(value)) return 'danger';
  if (['starting', 'stopping', 'installing', 'pending', 'suspended'].includes(value)) return 'warning';
  return 'muted';
}

export function joinPath(dir: string, name: string): string {
  const base = dir === '/' ? '' : dir.replace(/\/+$/, '');
  return `${base}/${name}`;
}

export function parentPath(path: string): string {
  const clean = path.replace(/\/+$/, '');
  const index = clean.lastIndexOf('/');
  return index <= 0 ? '/' : clean.slice(0, index);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong.';
}
