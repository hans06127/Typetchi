export type PetStageId = 'stage_1' | 'stage_2' | 'stage_3';
export type PetAnimationState = 'idle' | 'typing' | 'happy' | 'level_up' | 'evolve';

export interface UserPetState {
  totalExp: number;
  level: number;
  currentStage: PetStageId;
  todayTypedCount: number;
  todayMaxCpm: number;
  todayMaxWpm: number;
  lastActiveDate: string;
}

export interface EvolutionStage {
  id: PetStageId;
  name: string;
  requiredExp: number;
  assetKey: string;
  animationKey: string;
}

export interface EvolutionNode {
  id: string;
  name: string;
  requiredExp: number;
  parentId?: string;
  conditions?: EvolutionCondition[];
  assetKey: string;
  animationKey: string;
}

export interface EvolutionCondition {
  type: 'total_exp' | 'typing_speed' | 'daily_streak' | 'special_event';
  operator: '>=' | '<=' | '===';
  value: number | string;
}
