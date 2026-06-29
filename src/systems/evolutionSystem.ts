import { evolutionStages } from '../config/evolutionStages';
import type { EvolutionStage, PetStageId } from '../types/pet';

export function calculateStage(totalExp: number): PetStageId {
  return evolutionStages.reduce<PetStageId>((stageId, stage) => totalExp >= stage.requiredExp ? stage.id : stageId, 'stage_1');
}

export function getStage(stageId: PetStageId): EvolutionStage {
  return evolutionStages.find((stage) => stage.id === stageId) ?? evolutionStages[0];
}

export function getNextStage(totalExp: number): EvolutionStage | undefined {
  return evolutionStages.find((stage) => stage.requiredExp > totalExp);
}
