import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type ApiTarget = 'server' | 'local';

const STORAGE_KEY = 'tttracker.dev.apiTarget';
const DEFAULT_LOCAL_PORT = '4001';

const SERVER_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const LOCAL_API_BASE_URL = process.env.EXPO_PUBLIC_LOCAL_API_BASE_URL;
const LOCAL_API_PORT = process.env.EXPO_PUBLIC_LOCAL_API_PORT;

// Umschalten geht nur, wenn das JS von Metro kommt (Dev Build).
// Preview und Production Builds sprechen immer mit dem Server.
export const canSwitchApiTarget = __DEV__;

let currentTarget: ApiTarget = 'server';
let loadPromise: Promise<ApiTarget> | null = null;

const listeners = new Set<(target: ApiTarget) => void>();

function isApiTarget(value: string | null): value is ApiTarget {
  return value === 'server' || value === 'local';
}

function getDevMachineHost() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname || null;
  }

  // z. B. "192.168.178.20:8081", also die Adresse des PCs, auf dem Metro läuft
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(':')[0] || null;
}

export function getLocalApiBaseUrl() {
  if (LOCAL_API_BASE_URL) {
    return LOCAL_API_BASE_URL;
  }

  const host = getDevMachineHost();

  if (!host) {
    return null;
  }

  return `http://${host}:${LOCAL_API_PORT || DEFAULT_LOCAL_PORT}`;
}

export function getApiBaseUrlForTarget(target: ApiTarget) {
  if (target === 'local' && canSwitchApiTarget) {
    return getLocalApiBaseUrl();
  }

  return SERVER_API_BASE_URL ?? null;
}

export function getApiTarget() {
  return currentTarget;
}

export function ensureApiTargetLoaded() {
  if (!canSwitchApiTarget) {
    return Promise.resolve(currentTarget);
  }

  if (!loadPromise) {
    loadPromise = AsyncStorage.getItem(STORAGE_KEY)
        .then((stored) => {
          if (isApiTarget(stored)) {
            currentTarget = stored;
          }

          return currentTarget;
        })
        .catch(() => currentTarget);
  }

  return loadPromise;
}

export async function setApiTarget(target: ApiTarget) {
  if (!canSwitchApiTarget) {
    return;
  }

  await ensureApiTargetLoaded();

  if (currentTarget === target) {
    return;
  }

  currentTarget = target;
  await AsyncStorage.setItem(STORAGE_KEY, target);

  listeners.forEach((listener) => listener(target));
}

export function subscribeApiTarget(listener: (target: ApiTarget) => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
