import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Updates from 'expo-updates';

export type UpdatePhase = 'idle' | 'checking' | 'downloading' | 'ready' | 'error' | 'unavailable';

export type UpdateState = {
  supported: boolean;
  phase: UpdatePhase;
  message: string | null;
  runtimeVersion: string | null;
  channel: string | null;
  apply: () => void;
  check: () => Promise<void>;
};

export function useUpdates(): UpdateState {
  const supported = Updates.isEnabled;
  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const busyRef = useRef(false);

  const check = useCallback(async () => {
    if (!supported || busyRef.current) return;
    busyRef.current = true;
    setPhase('checking');
    setMessage(null);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setPhase('unavailable');
        setMessage('You are on the latest version.');
        return;
      }
      setPhase('downloading');
      const fetched = await Updates.fetchUpdateAsync();
      if (!fetched.isNew && !fetched.isRollBackToEmbedded) {
        setPhase('unavailable');
        setMessage('You are on the latest version.');
        return;
      }
      setPhase('ready');
      setMessage('Update downloaded. Restart to apply it.');
    } catch (error) {
      setPhase('error');
      setMessage(error instanceof Error ? error.message : 'Could not check for updates.');
    } finally {
      busyRef.current = false;
    }
  }, [supported]);

  const apply = useCallback(() => {
    if (!supported) return;
    Updates.reloadAsync().catch(() => {});
  }, [supported]);

  useEffect(() => {
    void check();
  }, [check]);

  useEffect(() => {
    if (!supported) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => subscription.remove();
  }, [supported, check]);

  return {
    supported,
    phase,
    message,
    runtimeVersion: Updates.runtimeVersion ?? null,
    channel: Updates.channel ?? null,
    apply,
    check,
  };
}
