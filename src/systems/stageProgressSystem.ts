export interface StageProgress {
  current: number;
  required: number;
  percentage: number;
  isMaxStage: boolean;
}

export function calculateStageProgress(totalExp: number): StageProgress {
  if (totalExp < 500) {
    return { current: totalExp, required: 500, percentage: Math.min((totalExp / 500) * 100, 100), isMaxStage: false };
  }

  if (totalExp < 2000) {
    const current = totalExp - 500;
    return { current, required: 1500, percentage: Math.min((current / 1500) * 100, 100), isMaxStage: false };
  }

  return { current: 2000, required: 2000, percentage: 100, isMaxStage: true };
}
