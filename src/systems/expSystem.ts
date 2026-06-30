import type { UserPetState } from '../types/pet';
import { getLocalDateKey } from '../utils/date';
import { calculateStage } from './evolutionSystem';

export function calculateExpFromTyping(addedChars: number): number { return Math.max(0, addedChars); }
export function calculateLevel(totalExp: number): number { return Math.floor(totalExp / 100) + 1; }
export function applyTypingExp(state: UserPetState, addedChars: number): UserPetState {
  const today = getLocalDateKey();
  const isSameDay = state.lastActiveDate === today;
  const todayTypedCount = isSameDay ? state.todayTypedCount : 0;
  const gainedExp = calculateExpFromTyping(addedChars);
  const nextTotalExp = state.totalExp + gainedExp;
  return {
    ...state,
    totalExp: nextTotalExp,
    level: calculateLevel(nextTotalExp),
    currentStage: calculateStage(nextTotalExp),
    todayTypedCount: todayTypedCount + addedChars,
    todayMaxCpm: isSameDay ? (state.todayMaxCpm ?? 0) : 0,
    todayMaxWpm: isSameDay ? (state.todayMaxWpm ?? 0) : 0,
    lastActiveDate: today,
  };
}
