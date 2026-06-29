import { useCallback, useEffect, useState } from 'react';
import { defaultPetState } from '../config/defaultState';
import { applyTypingExp } from '../systems/expSystem';
import type { UserPetState } from '../types/pet';
import { loadPetState, savePetState } from '../storage/petStorage';

export function usePetProgress() {
  const [petState, setPetState] = useState<UserPetState>(defaultPetState());
  useEffect(() => { void loadPetState().then((state) => { setPetState(state); void savePetState(state); }); }, []);
  const addTypingExp = useCallback((addedChars: number) => {
    setPetState((current) => {
      const next = applyTypingExp(current, addedChars);
      void savePetState(next);
      return next;
    });
  }, []);
  return { petState, addTypingExp };
}
