import { defaultWidgetState } from '../config/defaultState';
import type { WidgetState } from '../types/widget';
import { getStoredValue, setStoredValue } from './chromeStorage';
import { STORAGE_KEYS } from './storageKeys';

export const loadWidgetState = () => getStoredValue<WidgetState>(STORAGE_KEYS.widget, defaultWidgetState());
export const saveWidgetState = (state: WidgetState) => setStoredValue(STORAGE_KEYS.widget, state);
