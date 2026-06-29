import { defaultWidgetState } from '../config/defaultState';
import type { WidgetState } from '../types/widget';
import { getStorageValue, setStorageValue } from './extensionStorage';
import { STORAGE_KEYS } from './storageKeys';

export const loadWidgetState = () => getStorageValue<WidgetState>(STORAGE_KEYS.widget, defaultWidgetState());
export const saveWidgetState = (state: WidgetState) => setStorageValue(STORAGE_KEYS.widget, state);
