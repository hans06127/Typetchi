import { useCallback, useEffect, useState } from 'react';
import { updateDailyMissionProgress } from '../systems/dailyMissionSystem';
import type { DailyMissionCompletion, DailyMissionInput, DailyMissionsState } from '../types/dailyMission';
import { loadDailyMissionsState, saveDailyMissionsState } from '../storage/dailyMissionStorage';
import { useDebouncedStorageFlush } from './useDebouncedStorageFlush';

function isNewerOrSameRemote(next: DailyMissionsState, current: DailyMissionsState): boolean {
  if (next.dateKey !== current.dateKey) return (next.updatedAt ?? 0) >= (current.updatedAt ?? 0);
  return (next.updatedAt ?? 0) >= (current.updatedAt ?? 0);
}

export function useDailyMissions(onCompleted?: (completions: DailyMissionCompletion[], rewardExp: number) => void) {
  const [missionsState, setMissionsState] = useState<DailyMissionsState | null>(null);
  const { scheduleFlush } = useDebouncedStorageFlush<DailyMissionsState>(saveDailyMissionsState, 300);

  useEffect(() => { void loadDailyMissionsState().then(setMissionsState); }, []);

  const applyRemoteDailyMissionsState = useCallback((next: DailyMissionsState) => {
    setMissionsState((current) => (!current || isNewerOrSameRemote(next, current) ? next : current));
  }, []);

  const recordMissionProgress = useCallback((input: DailyMissionInput) => {
    setMissionsState((current) => {
      if (!current) return current;
      const result = updateDailyMissionProgress(current, input);
      if (result.completions.length > 0) onCompleted?.(result.completions, result.rewardExp);
      scheduleFlush(result.state);
      return result.state;
    });
  }, [onCompleted, scheduleFlush]);

  return { missionsState, recordMissionProgress, applyRemoteDailyMissionsState };
}
