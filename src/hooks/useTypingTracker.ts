import { useEffect, useRef } from 'react';
import { calculateAddedChars, isTrackableInput } from '../systems/typingSystem';

export function useTypingTracker(onAddedChars: (addedChars: number) => void) {
  const isComposingRef = useRef(false);

  useEffect(() => {
    const handleCompositionStart = () => { isComposingRef.current = true; };
    const handleCompositionEnd = () => { isComposingRef.current = false; };
    const handleInput = (event: Event) => {
      if (isComposingRef.current) return;
      if (!isTrackableInput(event.target)) return;
      const addedChars = calculateAddedChars(event.target);
      if (addedChars > 0) {
        console.log('[Typetchi] typing tracked', { addedChars });
        onAddedChars(addedChars);
      }
    };

    document.addEventListener('compositionstart', handleCompositionStart, true);
    document.addEventListener('compositionend', handleCompositionEnd, true);
    document.addEventListener('input', handleInput, true);

    return () => {
      document.removeEventListener('compositionstart', handleCompositionStart, true);
      document.removeEventListener('compositionend', handleCompositionEnd, true);
      document.removeEventListener('input', handleInput, true);
    };
  }, [onAddedChars]);
}
