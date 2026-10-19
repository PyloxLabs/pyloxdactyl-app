import type { Backup, LoginPayload, LoginResponse, PanelInfo, PanelUser, Server, ServerDatabase } from './types';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  raw?: BodyInit;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

let baseUrl = '';
let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function normalizeBaseUrl(raw: string): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) throw new Error('Enter your panel URL.');
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error('That does not look like a valid URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Use an http:// or https:// URL.');
  }
  if (!url.hostname) throw new Error('The URL is missing a hostname.');
  const path = url.pathname.replace(/\/+$/, '');
  return `${url.protocol}//${url.host}${path === '/' ? '' : path}`;
}

export function setBaseUrl(value: string | null): void {
  baseUrl = value ? normalizeBaseUrl(value) : '';
}

export function getBaseUrl(): string {
  return baseUrl;
}

export function setToken(value: string | null): void {
  token = value;
}

export function getToken(): string | null {
  return token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!baseUrl) throw new ApiError(0, 'No panel is configured.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  let body: BodyInit | undefined = options.raw;
  if (options.body !== undefined && options.raw === undefined) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    body = JSON.stringify(options.body);
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      throw new ApiError(0, 'The panel took too long to respond.');
    }
    throw new ApiError(0, 'Could not reach the panel. Check the URL and your connection.');
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    const message = typeof record?.error === 'string' ? record.error : `Request failed (${response.status}).`;
    if (response.status === 401 && !path.startsWith('/api/mobile/auth/')) {
      onUnauthorized?.();
    }
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

async function requestAt<T>(origin: string, path: string, options: RequestOptions = {}): Promise<T> {
  const previous = baseUrl;
  baseUrl = normalizeBaseUrl(origin);
  try {
    return await request<T>(path, options);
  } finally {
    baseUrl = previous;
  }
}

export function pingPanel(origin: string): Promise<PanelInfo> {
  return requestAt<PanelInfo>(origin, '/api/mobile/ping', { timeoutMs: 12000 });
}

export function consoleSocketUrl(serverUuid: string): string {
  const ws = baseUrl.replace(/^http/i, 'ws');
  return `${ws}/ws/console?server=${encodeURIComponent(serverUuid)}&token=${encodeURIComponent(token ?? '')}`;
}

export const api = {
  ping: pingPanel,
  login: (payload: LoginPayload) => request<LoginResponse>('/api/mobile/auth/login', { body: payload }),
  logout: () => request<{ ok: boolean }>('/api/mobile/auth/logout', { body: {} }),
  me: () => request<{ user: PanelUser; panel: { name: string; version: string } }>('/api/mobile/me'),
  get: <T>(path: string, timeoutMs?: number) => request<T>(path, { timeoutMs }),
  post: <T>(path: string, body: unknown = {}, timeoutMs?: number) =>
    request<T>(path, { body, timeoutMs }),
  del: <T>(path: string, body: unknown = {}) => request<T>(path, { method: 'DELETE', body }),
  databases: (uuid: string) => request<{ data: ServerDatabase[]; limit: number }>(`/api/mobile/servers/${uuid}/databases`),
  backups: (uuid: string) => request<{ data: Backup[]; limit: number }>(`/api/mobile/servers/${uuid}/backups`),
  serverDetail: (uuid: string) => request<{ data: Server }>(`/api/mobile/servers/${uuid}`),
};
