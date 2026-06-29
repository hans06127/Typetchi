import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedStorageFlush<T>(flush: (value: T) => Promise<void>, delayMs = 1000) {
  const timerRef = useRef<number | undefined>(undefined);
  const pendingRef = useRef<T | null>(null);

  const flushNow = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    if (pendingRef.current === null) return;
    const value = pendingRef.current;
    pendingRef.current = null;
    void flush(value);
  }, [flush]);

  const scheduleFlush = useCallback((value: T) => {
    pendingRef.current = value;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(flushNow, delayMs);
  }, [delayMs, flushNow]);

  useEffect(() => {
    const flushOnHidden = () => { if (document.visibilityState === 'hidden') flushNow(); };
    window.addEventListener('beforeunload', flushNow);
    document.addEventListener('visibilitychange', flushOnHidden);
    return () => {
      flushNow();
      window.removeEventListener('beforeunload', flushNow);
      document.removeEventListener('visibilitychange', flushOnHidden);
    };
  }, [flushNow]);

  return { scheduleFlush, flushNow };
}
