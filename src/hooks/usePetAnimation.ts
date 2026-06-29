import { useCallback, useEffect, useRef, useState } from 'react';
import { getPetAnimationDuration, hasAnimationPriority } from '../systems/petAnimationSystem';
import type { PetAnimationState } from '../types/pet';

export function usePetAnimation() {
  const [animationState, setAnimationState] = useState<PetAnimationState>('idle');
  const stateRef = useRef<PetAnimationState>('idle');
  const timerRef = useRef<number | undefined>(undefined);

  const playAnimation = useCallback((nextState: PetAnimationState) => {
    if (nextState === 'idle') return;
    if (!hasAnimationPriority(nextState, stateRef.current)) return;

    window.clearTimeout(timerRef.current);
    stateRef.current = nextState;
    setAnimationState(nextState);

    timerRef.current = window.setTimeout(() => {
      stateRef.current = 'idle';
      setAnimationState('idle');
    }, getPetAnimationDuration(nextState));
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { animationState, playAnimation };
}
