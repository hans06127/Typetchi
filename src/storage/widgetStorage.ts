import { defaultWidgetState } from '../config/defaultState';
import type { WidgetState } from '../types/widget';
import { clamp } from '../utils/clamp';
import { getStorageValue, setStorageValue } from './extensionStorage';
import { STORAGE_KEYS } from './storageKeys';

function numberOrFallback(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Partial<WidgetState> {
  return typeof value === 'object' && value !== null;
}

export function normalizeWidgetState(rawState: unknown): WidgetState {
  const defaults = defaultWidgetState();
  const state = isRecord(rawState) ? rawState : {};
  const widthMax = Math.max(240, Math.min(420, window.innerWidth - 32));
  const heightMax = Math.max(280, Math.min(560, window.innerHeight - 32));
  const width = clamp(numberOrFallback(state.width, defaults.width), 240, widthMax);
  const height = clamp(numberOrFallback(state.height, defaults.height), 280, heightMax);

  return {
    ...defaults,
    ...state,
    x: clamp(numberOrFallback(state.x, defaults.x), 8, Math.max(8, window.innerWidth - width - 8)),
    y: clamp(numberOrFallback(state.y, defaults.y), 8, Math.max(8, window.innerHeight - height - 8)),
    width,
    height,
    pinned: typeof state.pinned === 'boolean' ? state.pinned : defaults.pinned,
    collapsed: typeof state.collapsed === 'boolean' ? state.collapsed : defaults.collapsed,
    closed: typeof state.closed === 'boolean' ? state.closed : defaults.closed,
    updatedAt: numberOrFallback(state.updatedAt, defaults.updatedAt ?? 0) || undefined,
  };
}

export async function loadWidgetState(): Promise<WidgetState> {
  return normalizeWidgetState(await getStorageValue<unknown>(STORAGE_KEYS.WIDGET_STATE, defaultWidgetState()));
}

export function saveWidgetState(state: WidgetState): Promise<void> {
  return setStorageValue(STORAGE_KEYS.WIDGET_STATE, { ...normalizeWidgetState(state), updatedAt: Date.now() });
}
