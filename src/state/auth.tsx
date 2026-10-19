import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { api, ApiError, normalizeBaseUrl, pingPanel, setBaseUrl, setToken, setUnauthorizedHandler } from '@/lib/api';
import { deleteValue, readValue, writeValue } from '@/lib/storage';
import type { LoginPayload, LoginResponse, PanelUser } from '@/lib/types';

type AuthContextValue = {
  hydrated: boolean;
  baseUrl: string | null;
  token: string | null;
  user: PanelUser | null;
  panelName: string;
  panelVersion: string;
  installId: string;
  connecting: boolean;
  connect: (url: string) => Promise<{ name: string; version: string }>;
  login: (identifier: string, password: string) => Promise<LoginResponse>;
  verifyTwoFactor: (challenge: string, code: string) => Promise<LoginResponse>;
  completeLogin: (response: LoginResponse) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  forgetPanel: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function makeInstallId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `app-${Date.now().toString(36)}-${random}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [baseUrlState, setBaseUrlState] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<PanelUser | null>(null);
  const [panelName, setPanelName] = useState('');
  const [panelVersion, setPanelVersion] = useState('');
  const [installId, setInstallId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const [url, key, name, version, storedInstall] = await Promise.all([
        readValue('panelUrl'),
        readValue('apiKey'),
        readValue('panelName'),
        readValue('panelVersion'),
        readValue('installId'),
      ]);
      const install = storedInstall || makeInstallId();
      if (!storedInstall) await writeValue('installId', install);
      if (!mounted.current) return;
      setInstallId(install);
      setPanelName(name || '');
      setPanelVersion(version || '');
      if (url) setBaseUrl(url);
      if (key) setToken(key);
      setBaseUrlState(url || null);
      setTokenState(key || null);

      if (url && key) {
        try {
          const result = await api.me();
          if (!mounted.current) return;
          setUser(result.user);
          if (result.panel?.name) setPanelName(result.panel.name);
          if (result.panel?.version) setPanelVersion(result.panel.version);
        } catch (error) {
          if (!mounted.current) return;
          if (error instanceof ApiError && error.status === 401) {
            setToken(null);
            await deleteValue('apiKey');
            if (mounted.current) setTokenState(null);
          }
        }
      }
      if (mounted.current) setHydrated(true);
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    setTokenState(null);
    await deleteValue('apiKey');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
      router.replace('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const connect = useCallback(async (rawUrl: string) => {
    setConnecting(true);
    try {
      const info = await pingPanel(rawUrl);
      if (!info || info.ok !== true || info.panel !== 'pylox-panel') {
        throw new Error('That address is not a Pyloxdactyl panel.');
      }
      const normalized = normalizeBaseUrl(rawUrl);
      setBaseUrl(normalized);
      setBaseUrlState(normalized);
      setPanelName(info.name || 'Pyloxdactyl');
      setPanelVersion(info.version || '');
      setUser(null);
      setToken(null);
      setTokenState(null);
      await Promise.all([
        writeValue('panelUrl', normalized),
        writeValue('panelName', info.name || 'Pyloxdactyl'),
        writeValue('panelVersion', info.version || ''),
        deleteValue('apiKey'),
      ]);
      return { name: info.name || 'Pyloxdactyl', version: info.version || '' };
    } finally {
      if (mounted.current) setConnecting(false);
    }
  }, []);

  const completeLogin = useCallback(async (response: LoginResponse) => {
    if (!response.apiKey || !response.user) throw new Error('The panel did not return a session key.');
    setToken(response.apiKey);
    setTokenState(response.apiKey);
    setUser(response.user);
    if (response.name) setPanelName(response.name);
    if (response.version) setPanelVersion(response.version);
    await Promise.all([
      writeValue('apiKey', response.apiKey),
      response.name ? writeValue('panelName', response.name) : Promise.resolve(),
      response.version ? writeValue('panelVersion', response.version) : Promise.resolve(),
    ]);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const payload: LoginPayload = { identifier, password, installId };
      const response = await api.login(payload);
      if (!response.require2fa) await completeLogin(response);
      return response;
    },
    [completeLogin, installId],
  );

  const verifyTwoFactor = useCallback(
    async (challenge: string, code: string) => {
      const response = await api.login({ challenge, totp: code, installId });
      await completeLogin(response);
      return response;
    },
    [completeLogin, installId],
  );

  const refreshUser = useCallback(async () => {
    const result = await api.me();
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {}
    await clearSession();
  }, [clearSession]);

  const forgetPanel = useCallback(async () => {
    try {
      await api.logout();
    } catch {}
    await clearSession();
    setBaseUrl('');
    setBaseUrlState(null);
    setPanelName('');
    setPanelVersion('');
    await Promise.all([deleteValue('panelUrl'), deleteValue('panelName'), deleteValue('panelVersion')]);
  }, [clearSession]);

  const value = useMemo(
    () => ({
      hydrated,
      baseUrl: baseUrlState,
      token: tokenState,
      user,
      panelName,
      panelVersion,
      installId,
      connecting,
      connect,
      login,
      verifyTwoFactor,
      completeLogin,
      refreshUser,
      logout,
      forgetPanel,
    }),
    [
      hydrated,
      baseUrlState,
      tokenState,
      user,
      panelName,
      panelVersion,
      installId,
      connecting,
      connect,
      login,
      verifyTwoFactor,
      completeLogin,
      refreshUser,
      logout,
      forgetPanel,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
