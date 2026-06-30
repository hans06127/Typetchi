import { defaultPetState, defaultWidgetState } from '../config/defaultState';
import type { UserPetState } from '../types/pet';
import type { WidgetState } from '../types/widget';
import { savePetState } from './petStorage';
import { saveWidgetState } from './widgetStorage';

export async function resetWidgetState(): Promise<WidgetState> {
  const next = defaultWidgetState();
  await saveWidgetState(next);
  return next;
}

export async function resetPetProgress(): Promise<UserPetState> {
  const next = defaultPetState();
  await savePetState(next);
  return next;
}
