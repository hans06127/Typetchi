import type { PetAnimationState } from '../types/pet';

export const PET_ANIMATION_DURATION = {
  typing: 400,
  happy: 800,
  level_up: 1200,
  evolve: 1800,
} as const;

const PRIORITY: Record<PetAnimationState, number> = {
  idle: 0,
  typing: 1,
  happy: 2,
  level_up: 3,
  evolve: 4,
};

export function hasAnimationPriority(next: PetAnimationState, current: PetAnimationState): boolean {
  return PRIORITY[next] >= PRIORITY[current];
}

export function getPetAnimationDuration(state: PetAnimationState): number {
  return state === 'idle' ? 0 : PET_ANIMATION_DURATION[state];
}
