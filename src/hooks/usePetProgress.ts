import { useCallback, useEffect, useState } from 'react';
import { defaultPetState } from '../config/defaultState';
import { applyTypingExp } from '../systems/expSystem';
import type { UserPetState } from '../types/pet';
import { loadPetState, savePetState } from '../storage/petStorage';
import { useDebouncedStorageFlush } from './useDebouncedStorageFlush';

export function usePetProgress() {
  const [petState, setPetState] = useState<UserPetState>(defaultPetState());
  const { scheduleFlush, flushNow } = useDebouncedStorageFlush<UserPetState>(savePetState, 1000);

  useEffect(() => {
    void loadPetState().then((state) => {
      console.log('[Typetchi] storage loaded');
      setPetState(state);
      scheduleFlush(state);
    });
  }, [scheduleFlush]);

  const addTypingExp = useCallback((addedChars: number) => {
    setPetState((current) => {
      const next = applyTypingExp(current, addedChars);
      scheduleFlush(next);
      return next;
    });
  }, [scheduleFlush]);

  return { petState, addTypingExp, flushNow };
}
