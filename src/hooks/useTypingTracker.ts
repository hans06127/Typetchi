import { useEffect, useRef } from 'react';
import { markPaste, shouldIgnoreInputForExp } from '../systems/pasteDetectionSystem';
import { calculateAddedChars, isTrackableInput } from '../systems/typingSystem';
import { trackKeyDown, trackKeyUp } from '../systems/keyHoldExclusionSystem';

export interface ValidTypingInput {
  addedChars: number;
  timestamp: number;
}

export function useTypingTracker(onValidTyping: (input: ValidTypingInput) => void, onPasteIgnored?: () => void) {
  const isComposingRef = useRef(false);

  useEffect(() => {
    const handleCompositionStart = () => { isComposingRef.current = true; };
    const handleCompositionEnd = () => { isComposingRef.current = false; };
    const handleKeyDown = (event: KeyboardEvent) => { trackKeyDown(event, Date.now()); };
    const handleKeyUp = (event: KeyboardEvent) => { trackKeyUp(event); };
    const handlePaste = (event: ClipboardEvent) => {
      if (!isTrackableInput(event.target)) return;
      markPaste(event.target, Date.now());
      onPasteIgnored?.();
    };
    const handleInput = (event: Event) => {
      if (!isTrackableInput(event.target)) return;
      const element = event.target;
      const addedChars = calculateAddedChars(element);
      const timestamp = Date.now();
      if (shouldIgnoreInputForExp({ element, addedChars, now: timestamp, isComposing: isComposingRef.current })) {
        if (addedChars > 0) console.log('[Typetchi] typing ignored for EXP', { addedChars });
        return;
      }
      console.log('[Typetchi] typing tracked', { addedChars });
      onValidTyping({ addedChars, timestamp });
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('compositionstart', handleCompositionStart, true);
    document.addEventListener('compositionend', handleCompositionEnd, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('input', handleInput, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('compositionstart', handleCompositionStart, true);
      document.removeEventListener('compositionend', handleCompositionEnd, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('input', handleInput, true);
    };
  }, [onPasteIgnored, onValidTyping]);
}
