import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 1000;

export function useExpGainToast() {
  const [amount, setAmount] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  const showExpGain = useCallback((nextAmount: number) => {
    if (nextAmount <= 0) return;
    window.clearTimeout(timerRef.current);
    setAmount(nextAmount);
    setVisible(true);
    timerRef.current = window.setTimeout(() => setVisible(false), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { amount, visible, showExpGain };
}
