import { useCallback, useEffect, useState } from 'react';
import { defaultPetState } from '../config/defaultState';
import { applyTypingExp, calculateExpFromTyping } from '../systems/expSystem';
import type { PetAnimationState, UserPetState } from '../types/pet';
import { loadPetState, savePetState } from '../storage/petStorage';
import { useDebouncedStorageFlush } from './useDebouncedStorageFlush';

export interface TypingProgressResult {
  gainedExp: number;
  animationState: PetAnimationState;
  leveledUp: boolean;
  evolved: boolean;
}

export function usePetProgress(onTypingProgress?: (result: TypingProgressResult) => void) {
  const [petState, setPetState] = useState<UserPetState>(defaultPetState());
  const { scheduleFlush, flushNow } = useDebouncedStorageFlush<UserPetState>(savePetState, 1000);

  useEffect(() => {
    void loadPetState().then((state) => {
      console.log('[Typetchi] storage loaded');
      setPetState(state);
      scheduleFlush(state);
    });
  }, [scheduleFlush]);

  const updateTodayTypingSpeedMax = useCallback((max: { todayMaxCpm: number; todayMaxWpm: number }) => {
    setPetState((current) => {
      const next = { ...current, todayMaxCpm: max.todayMaxCpm, todayMaxWpm: max.todayMaxWpm };
      scheduleFlush(next);
      return next;
    });
  }, [scheduleFlush]);

  const addTypingExp = useCallback((addedChars: number) => {
    setPetState((current) => {
      const next = applyTypingExp(current, addedChars);
      const gainedExp = calculateExpFromTyping(addedChars);
      const evolved = current.currentStage !== next.currentStage;
      const leveledUp = current.level < next.level;
      const animationState: PetAnimationState = evolved ? 'evolve' : leveledUp ? 'level_up' : gainedExp > 0 ? 'happy' : 'typing';
      onTypingProgress?.({ gainedExp, animationState, leveledUp, evolved });
      scheduleFlush(next);
      return next;
    });
  }, [onTypingProgress, scheduleFlush]);

  return { petState, addTypingExp, updateTodayTypingSpeedMax, flushNow };
}
