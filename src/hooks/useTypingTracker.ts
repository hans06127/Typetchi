import { useEffect } from 'react';
import { calculateAddedChars, isTrackableInput } from '../systems/typingSystem';

export function useTypingTracker(onAddedChars: (addedChars: number) => void) {
  useEffect(() => {
    const handleInput = (event: Event) => {
      if (!isTrackableInput(event.target)) return;
      const addedChars = calculateAddedChars(event.target);
      if (addedChars > 0) onAddedChars(addedChars);
    };
    document.addEventListener('input', handleInput, true);
    return () => document.removeEventListener('input', handleInput, true);
  }, [onAddedChars]);
}
