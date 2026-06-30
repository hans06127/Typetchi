import { defaultWidgetState } from '../config/defaultState';
import type { WidgetState } from '../types/widget';
import { clamp } from '../utils/clamp';
import { getStorageValue, setStorageValue } from './extensionStorage';
import { STORAGE_KEYS } from './storageKeys';

function numberOrFallback(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeWidgetState(state: WidgetState): WidgetState {
  const defaults = defaultWidgetState();
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
    closed: false,
  };
}

export async function loadWidgetState(): Promise<WidgetState> {
  return normalizeWidgetState(await getStorageValue<WidgetState>(STORAGE_KEYS.widget, defaultWidgetState()));
}

export function saveWidgetState(state: WidgetState): Promise<void> {
  return setStorageValue(STORAGE_KEYS.widget, normalizeWidgetState(state));
}
