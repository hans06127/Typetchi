import { createDailyMissions } from '../config/dailyMissions';
import type { DailyMissionsState } from '../types/dailyMission';
import { getLocalDateKey } from '../utils/date';
import { getStorageValue, setStorageValue } from './extensionStorage';
import { STORAGE_KEYS } from './storageKeys';

export function defaultDailyMissionsState(dateKey = getLocalDateKey()): DailyMissionsState {
  return { dateKey, missions: createDailyMissions(dateKey), updatedAt: Date.now() };
}

export async function loadDailyMissionsState(): Promise<DailyMissionsState> {
  const today = getLocalDateKey();
  const state = await getStorageValue<DailyMissionsState>(STORAGE_KEYS.DAILY_MISSIONS, defaultDailyMissionsState(today));
  if (state.dateKey !== today) {
    const reset = defaultDailyMissionsState(today);
    await saveDailyMissionsState(reset);
    return reset;
  }
  return { ...state, missions: state.missions.map((mission) => ({ ...mission, dateKey: today })) };
}

export const saveDailyMissionsState = (state: DailyMissionsState) => setStorageValue(STORAGE_KEYS.DAILY_MISSIONS, { ...state, updatedAt: Date.now() });
