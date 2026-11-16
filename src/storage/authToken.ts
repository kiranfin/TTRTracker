import * as SecureStore from 'expo-secure-store';

import { ensureApiTargetLoaded, getApiTarget } from '../api/apiTarget';

const ACCESS_TOKEN_KEY = 'tttracker_access_token';

// Lokales Backend hat eigene User, deshalb eigener Token, damit der Server Login erhalten bleibt
async function getAccessTokenKey() {
    await ensureApiTargetLoaded();

    return getApiTarget() === 'local' ? `${ACCESS_TOKEN_KEY}_local` : ACCESS_TOKEN_KEY;
}

export async function saveAccessToken(token: string) {
    await SecureStore.setItemAsync(await getAccessTokenKey(), token);
}

export async function getAccessToken() {
    return await SecureStore.getItemAsync(await getAccessTokenKey());
}

export async function clearAccessToken() {
    await SecureStore.deleteItemAsync(await getAccessTokenKey());
}
