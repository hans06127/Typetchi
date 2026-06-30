import { useCallback, useRef } from 'react';

const PASTE_HINT_COOLDOWN_MS = 30_000;

export function usePasteDetection(onPasteHint: () => void) {
  const lastPasteHintAtRef = useRef(0);

  const showPasteHint = useCallback(() => {
    const now = Date.now();
    if (now - lastPasteHintAtRef.current < PASTE_HINT_COOLDOWN_MS) return;
    lastPasteHintAtRef.current = now;
    onPasteHint();
  }, [onPasteHint]);

  return { showPasteHint };
}
