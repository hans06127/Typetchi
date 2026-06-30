import { evolutionNodes, evolutionStages } from '../config/evolutionStages';
import type { EvolutionCondition, EvolutionNode, EvolutionStage, PetStageId } from '../types/pet';

export interface EvolutionContext {
  totalExp: number;
  todayMaxCpm?: number;
  dailyStreak?: number;
  specialEvents?: string[];
}

function compareNumber(left: number, operator: EvolutionCondition['operator'], right: number): boolean {
  if (operator === '>=') return left >= right;
  if (operator === '<=') return left <= right;
  return left === right;
}

function compareString(left: string | undefined, operator: EvolutionCondition['operator'], right: string): boolean {
  if (operator === '===') return left === right;
  return false;
}

export function evaluateEvolutionCondition(condition: EvolutionCondition, context: EvolutionContext): boolean {
  if (condition.type === 'total_exp') {
    return compareNumber(context.totalExp, condition.operator, Number(condition.value));
  }

  if (condition.type === 'typing_speed') {
    return compareNumber(context.todayMaxCpm ?? 0, condition.operator, Number(condition.value));
  }

  if (condition.type === 'daily_streak') {
    return compareNumber(context.dailyStreak ?? 0, condition.operator, Number(condition.value));
  }

  if (condition.type === 'special_event') {
    const expectedEvent = String(condition.value);
    const matchedEvent = context.specialEvents?.find((event) => event === expectedEvent);
    return compareString(matchedEvent, condition.operator, expectedEvent);
  }

  return false;
}

export function canUnlockEvolutionNode(node: EvolutionNode, context: EvolutionContext): boolean {
  const conditions = node.conditions ?? [{ type: 'total_exp', operator: '>=', value: node.requiredExp } satisfies EvolutionCondition];
  return conditions.every((condition) => evaluateEvolutionCondition(condition, context));
}

export function getAvailableEvolutionNodes(context: EvolutionContext): EvolutionNode[] {
  return evolutionNodes.filter((node) => canUnlockEvolutionNode(node, context));
}

export function calculateStage(totalExp: number, context: Partial<EvolutionContext> = {}): PetStageId {
  const resolvedContext: EvolutionContext = { ...context, totalExp };
  return getAvailableEvolutionNodes(resolvedContext).reduce<PetStageId>(
    (stageId, node) => totalExp >= node.requiredExp ? node.id : stageId,
    'stage_1',
  );
}

export function getStage(stageId: PetStageId): EvolutionStage {
  return evolutionStages.find((stage) => stage.id === stageId) ?? evolutionStages[0];
}

export function getCurrentEvolutionNode(stageId: PetStageId): EvolutionNode {
  return evolutionNodes.find((node) => node.id === stageId) ?? evolutionNodes[0];
}

export function getNextStage(totalExp: number, context: Partial<EvolutionContext> = {}): EvolutionStage | undefined {
  const currentStageId = calculateStage(totalExp, context);
  return evolutionStages.find((stage) => stage.requiredExp > totalExp && stage.id !== currentStageId);
}
