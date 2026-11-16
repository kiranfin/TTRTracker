import { useEffect } from 'react';

type Listener = () => void;

const listeners = new Set<Listener>();

// Nach einem erfolgreichen Login laden Screens, die auf die offiziellen Werte warten, ihre Daten neu.
export function notifyMyttConnected() {
  listeners.forEach((listener) => listener());
}

export function useOnMyttConnected(callback: Listener) {
  useEffect(() => {
    listeners.add(callback);

    return () => {
      listeners.delete(callback);
    };
  }, [callback]);
}
