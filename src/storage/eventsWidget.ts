import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_WIDGET_KEY = 'tttracker.eventsWidgetEnabled';

export async function getEventsWidgetEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(EVENTS_WIDGET_KEY);
  return stored === 'true';
}

export async function setEventsWidgetEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(EVENTS_WIDGET_KEY, enabled ? 'true' : 'false');
}
