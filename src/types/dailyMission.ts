export type DailyMissionType = 'typed_chars' | 'max_cpm' | 'typing_sessions';

export interface DailyMission {
  id: string;
  type: DailyMissionType;
  title: string;
  description: string;
  targetValue: number;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
  rewardExp: number;
  completedAt: number | null;
  dateKey: string;
}

export interface DailyMissionsState {
  dateKey: string;
  missions: DailyMission[];
  updatedAt?: number;
}

export interface DailyMissionInput {
  addedChars: number;
  todayTypedCount: number;
  todayMaxCpm: number;
  todaySessionCount: number;
  timestamp: number;
}

export interface DailyMissionCompletion {
  missionId: string;
  title: string;
  rewardExp: number;
}
