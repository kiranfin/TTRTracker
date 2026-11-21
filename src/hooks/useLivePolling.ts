import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Ruft `poll` alle `intervalMs`, solange `enabled` gilt, der Screen im Vordergrund ist und die App aktiv ist.
 * Kommt der Screen oder die App zurück in den Vordergrund, wird sofort einmal nachgeladen, weil dazwischen
 * nichts aktualisiert wurde. Der allererste Start löst kein zusätzliches Laden aus, das macht der Screen selbst.
 */
export function useLivePolling(poll: () => void, { enabled, intervalMs }: { enabled: boolean; intervalMs: number }) {
  const pollRef = useRef(poll);
  const [focused, setFocused] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const wasRunning = useRef(false);
  const hasRunBefore = useRef(false);

  useEffect(() => {
    pollRef.current = poll;
  });

  useFocusEffect(
      useCallback(() => {
        setFocused(true);

        return () => setFocused(false);
      }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));

    return () => subscription.remove();
  }, []);

  const running = enabled && focused && appActive;

  useEffect(() => {
    if (!running) {
      wasRunning.current = false;
      return;
    }

    // Wieder im Vordergrund: sofort aktualisieren, nicht erst nach einem vollen Intervall.
    if (!wasRunning.current && hasRunBefore.current) {
      pollRef.current();
    }

    wasRunning.current = true;
    hasRunBefore.current = true;

    const timer = setInterval(() => pollRef.current(), intervalMs);

    return () => clearInterval(timer);
  }, [running, intervalMs]);
}
