import { evolutionStages } from '../config/evolutionStages';
import { calculateStage } from './evolutionSystem';

export interface StageProgress {
  current: number;
  required: number;
  percentage: number;
  isMaxStage: boolean;
}

export function calculateStageProgress(totalExp: number): StageProgress {
  const currentStageId = calculateStage(totalExp);
  const currentStageIndex = evolutionStages.findIndex((stage) => stage.id === currentStageId);
  const currentStage = evolutionStages[Math.max(0, currentStageIndex)];
  const nextStage = evolutionStages.find((stage) => stage.requiredExp > totalExp);

  if (!nextStage) {
    return { current: currentStage.requiredExp, required: currentStage.requiredExp, percentage: 100, isMaxStage: true };
  }

  const stageStartExp = currentStage.requiredExp;
  const required = Math.max(1, nextStage.requiredExp - stageStartExp);
  const current = Math.max(0, totalExp - stageStartExp);

  return {
    current,
    required,
    percentage: Math.min((current / required) * 100, 100),
    isMaxStage: false,
  };
}
