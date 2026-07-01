import type { DailyMission, DailyMissionType } from '../types/dailyMission';

interface DailyMissionDefinition {
  id: string;
  type: DailyMissionType;
  title: string;
  description: string;
  targetValue: number;
  rewardExp: number;
}

export const DAILY_MISSION_DEFINITIONS: DailyMissionDefinition[] = [
  { id: 'typed-300', type: 'typed_chars', title: '今日手打 300 字', description: '只計算有效手打輸入，不包含貼上文字。', targetValue: 300, rewardExp: 30 },
  { id: 'max-cpm-60', type: 'max_cpm', title: '最高速度 60 CPM', description: '今日最高打字速度達到 60 CPM。', targetValue: 60, rewardExp: 50 },
  { id: 'sessions-3', type: 'typing_sessions', title: '完成 3 次打字 session', description: '有效手打並在閒置後重新開始會建立新 session。', targetValue: 3, rewardExp: 40 },
];

export function createDailyMissions(dateKey: string): DailyMission[] {
  return DAILY_MISSION_DEFINITIONS.map((definition) => ({
    ...definition,
    progress: 0,
    completed: false,
    rewardClaimed: false,
    completedAt: null,
    dateKey,
  }));
}
