import { createDailyMissions } from '../config/dailyMissions';
import type { DailyMissionCompletion, DailyMissionInput, DailyMissionsState } from '../types/dailyMission';
import { getLocalDateKey } from '../utils/date';

function getProgressForMission(type: string, input: DailyMissionInput): number {
  if (type === 'typed_chars') return input.todayTypedCount;
  if (type === 'max_cpm') return input.todayMaxCpm;
  if (type === 'typing_sessions') return input.todaySessionCount;
  return 0;
}

export function ensureDailyMissionsForToday(state: DailyMissionsState, today = getLocalDateKey()): DailyMissionsState {
  if (state.dateKey === today) return state;
  return { dateKey: today, missions: createDailyMissions(today), updatedAt: Date.now() };
}

export function updateDailyMissionProgress(state: DailyMissionsState, input: DailyMissionInput): { state: DailyMissionsState; completions: DailyMissionCompletion[]; rewardExp: number } {
  const today = getLocalDateKey(new Date(input.timestamp));
  const current = ensureDailyMissionsForToday(state, today);
  const completions: DailyMissionCompletion[] = [];
  const missions = current.missions.map((mission) => {
    const progress = Math.min(mission.targetValue, Math.max(mission.progress, getProgressForMission(mission.type, input)));
    const justCompleted = !mission.completed && progress >= mission.targetValue;
    if (!justCompleted) return { ...mission, progress };
    completions.push({ missionId: mission.id, title: mission.title, rewardExp: mission.rewardExp });
    return { ...mission, progress, completed: true, rewardClaimed: true, completedAt: input.timestamp };
  });
  return {
    state: { ...current, missions, updatedAt: input.timestamp },
    completions,
    rewardExp: completions.reduce((sum, completion) => sum + completion.rewardExp, 0),
  };
}
