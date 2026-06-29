import { useCallback, useEffect, useRef, useState } from 'react';
import { pickPetMessage, type PetMessageKind } from '../config/petMessages';

const BUBBLE_DURATION_MS = 2600;
const TYPING_MESSAGE_COOLDOWN_MS = 30_000;

export function useSpeechBubble() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const lastTypingMessageAtRef = useRef(0);

  const showMessage = useCallback((kind: PetMessageKind, force = false) => {
    const now = Date.now();
    if (kind === 'typing' && !force && now - lastTypingMessageAtRef.current < TYPING_MESSAGE_COOLDOWN_MS) return;
    if (kind === 'typing') lastTypingMessageAtRef.current = now;

    window.clearTimeout(timerRef.current);
    setMessage(pickPetMessage(kind));
    setVisible(true);
    timerRef.current = window.setTimeout(() => setVisible(false), BUBBLE_DURATION_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { message, visible, showMessage };
}
