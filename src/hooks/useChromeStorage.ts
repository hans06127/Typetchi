import { useCallback, useEffect, useState } from 'react';

export function useChromeStorage<T>(loader: () => Promise<T>, saver: (value: T) => Promise<void>) {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => { void loader().then(setValue); }, [loader]);
  const updateValue = useCallback((next: T | ((current: T) => T)) => {
    setValue((current) => {
      if (!current) return current;
      const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
      void saver(resolved);
      return resolved;
    });
  }, [saver]);
  return [value, updateValue] as const;
}
