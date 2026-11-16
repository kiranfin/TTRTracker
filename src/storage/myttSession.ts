import * as SecureStore from 'expo-secure-store';

const MYTT_COOKIE_KEY = 'tttracker.mytt.cookie';

// Der myTischtennis Cookie bleibt standardmäßig auf dem Gerät. Auf den Server kommt er nur, wenn der
// Besitzer eine Freigabe anlegt.
export async function saveLocalMyttCookie(cookie: string) {
    await SecureStore.setItemAsync(MYTT_COOKIE_KEY, cookie);
}

export async function getLocalMyttCookie() {
    return await SecureStore.getItemAsync(MYTT_COOKIE_KEY);
}

export async function clearLocalMyttCookie() {
    await SecureStore.deleteItemAsync(MYTT_COOKIE_KEY);
}
