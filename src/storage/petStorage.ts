import { defaultPetState } from '../config/defaultState';
import type { UserPetState } from '../types/pet';
import { getLocalDateKey } from '../utils/date';
import { calculateLevel } from '../systems/expSystem';
import { calculateStage } from '../systems/evolutionSystem';
import { getStorageValue, setStorageValue } from './extensionStorage';
import { STORAGE_KEYS } from './storageKeys';

export async function loadPetState(): Promise<UserPetState> {
  const state = await getStorageValue(STORAGE_KEYS.PET_STATE, defaultPetState());
  const today = getLocalDateKey();
  return {
    ...state,
    level: calculateLevel(state.totalExp),
    currentStage: calculateStage(state.totalExp, { todayMaxCpm: state.todayMaxCpm }),
    todayTypedCount: state.lastActiveDate === today ? state.todayTypedCount : 0,
    todayMaxCpm: state.lastActiveDate === today ? (state.todayMaxCpm ?? 0) : 0,
    todayMaxWpm: state.lastActiveDate === today ? (state.todayMaxWpm ?? 0) : 0,
    lastActiveDate: today,
  };
}
export const savePetState = (state: UserPetState) => setStorageValue(STORAGE_KEYS.PET_STATE, { ...state, updatedAt: Date.now() });
