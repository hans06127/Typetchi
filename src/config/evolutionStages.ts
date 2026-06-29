import type { EvolutionStage } from '../types/pet';

export const evolutionStages: EvolutionStage[] = [
  { id: 'stage_1', name: '幼年期', requiredExp: 0, assetKey: 'pet_stage_1', animationKey: 'idle_stage_1' },
  { id: 'stage_2', name: '成長期', requiredExp: 500, assetKey: 'pet_stage_2', animationKey: 'idle_stage_2' },
  { id: 'stage_3', name: '成熟期', requiredExp: 2000, assetKey: 'pet_stage_3', animationKey: 'idle_stage_3' },
];
