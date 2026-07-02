import type { UserPetState } from '../types/pet';
import type { WidgetState } from '../types/widget';
import { getLocalDateKey } from '../utils/date';

export const defaultPetState = (): UserPetState => ({
  totalExp: 0,
  level: 1,
  currentStage: 'stage_1',
  todayTypedCount: 0,
  todayMaxCpm: 0,
  todayMaxWpm: 0,
  lastActiveDate: getLocalDateKey(),
});

export const defaultWidgetState = (): WidgetState => ({
  x: Math.max(16, window.innerWidth - 300),
  y: Math.max(16, window.innerHeight - 380),
  width: 280,
  height: 360,
  pinned: false,
  collapsed: false,
  closed: false,
});

export const createDefaultPetState = defaultPetState;
export const createDefaultWidgetState = defaultWidgetState;

export const CURRENT_STORAGE_SCHEMA_VERSION = 1;
export const defaultStorageSchemaVersion = () => CURRENT_STORAGE_SCHEMA_VERSION;
