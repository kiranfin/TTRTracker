import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_KEY = 'tttracker.backgroundImageUri';

const BACKGROUND_DIR_NAME = 'background';
const BACKGROUND_FILE_NAME = 'custom-background.jpg';

function getBackgroundDirectory() {
    if (!FileSystem.documentDirectory) {
        return null;
    }

    return `${FileSystem.documentDirectory}${BACKGROUND_DIR_NAME}/`;
}

function getBackgroundFileUri() {
    const directory = getBackgroundDirectory();

    if (!directory) {
        return null;
    }

    return `${directory}${BACKGROUND_FILE_NAME}`;
}

async function ensureBackgroundDirectory() {
    const directory = getBackgroundDirectory();

    if (!directory) {
        return null;
    }

    const info = await FileSystem.getInfoAsync(directory);

    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(directory, {
            intermediates: true,
        });
    }

    return directory;
}

async function safeDeleteFile(uri: string | null) {
    if (!uri) return;

    try {
        const info = await FileSystem.getInfoAsync(uri);

        if (info.exists) {
            await FileSystem.deleteAsync(uri, {
                idempotent: true,
            });
        }
    } catch {
        // Absichtlich ignorieren:
        // Wenn die alte Datei nicht gelöscht werden kann, soll die App nicht crashen.
    }
}

function isFileUri(uri: string) {
    return uri.startsWith('file://');
}

export async function getCustomBackgroundImageUri() {
    try {
        const storedUri = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedUri) {
            return null;
        }

        // Remote-/content-/asset-URIs können wir nicht zuverlässig mit FileSystem prüfen.
        // Wir geben sie zurück, damit die App nicht unnötig auf null fällt.
        if (!isFileUri(storedUri)) {
            return storedUri;
        }

        try {
            const info = await FileSystem.getInfoAsync(storedUri);

            if (info.exists) {
                return storedUri;
            }

            await AsyncStorage.removeItem(STORAGE_KEY);
            return null;
        } catch {
            // Falls FileSystem auf der Plattform nicht sauber verfügbar ist:
            // gespeicherte URI trotzdem zurückgeben, statt zu crashen.
            return storedUri;
        }
    } catch {
        return null;
    }
}

export async function saveCustomBackgroundImageUri(sourceUri: string) {
    const trimmedSourceUri = sourceUri.trim();

    if (!trimmedSourceUri) {
        throw new Error('Kein gültiges Hintergrundbild ausgewählt.');
    }

    const targetUri = getBackgroundFileUri();

    // Fallback: Wenn App-Dateispeicher nicht verfügbar ist, speichern wir nur die URI.
    // Das verhindert den Fehler "App-Speicher nicht verfügbar".
    if (!targetUri) {
        await AsyncStorage.setItem(STORAGE_KEY, trimmedSourceUri);
        return trimmedSourceUri;
    }

    try {
        await ensureBackgroundDirectory();

        // Alte Datei zuerst entfernen, damit Copy auf Android/iOS nicht an vorhandener Datei scheitert.
        await safeDeleteFile(targetUri);

        await FileSystem.copyAsync({
            from: trimmedSourceUri,
            to: targetUri,
        });

        await AsyncStorage.setItem(STORAGE_KEY, targetUri);

        return targetUri;
    } catch {
        // Wichtig:
        // Nicht mehr crashen. Wenn das Kopieren in den App-Speicher fehlschlägt,
        // speichern wir wenigstens die Picker-URI.
        await AsyncStorage.setItem(STORAGE_KEY, trimmedSourceUri);
        return trimmedSourceUri;
    }
}

export async function clearCustomBackgroundImageUri() {
    const storedUri = await AsyncStorage.getItem(STORAGE_KEY);
    const targetUri = getBackgroundFileUri();

    await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY),
        safeDeleteFile(targetUri),
        safeDeleteFile(storedUri),
    ]);
}