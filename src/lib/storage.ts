import { Platform } from 'react-native';

import * as SecureStore from 'expo-secure-store';

const PREFIX = 'pylox.';

function webStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {}
  return null;
}

export async function readValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webStorage()?.getItem(PREFIX + key) ?? null;
  }
  try {
    return await SecureStore.getItemAsync(PREFIX + key);
  } catch {
    return null;
  }
}

export async function writeValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage()?.setItem(PREFIX + key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(PREFIX + key, value);
  } catch {}
}

export async function deleteValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage()?.removeItem(PREFIX + key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(PREFIX + key);
  } catch {}
}
