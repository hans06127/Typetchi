import { useEffect } from 'react';
import { STORAGE_KEYS } from '../storage/storageKeys';
import type { UserPetState } from '../types/pet';
import type { WidgetState } from '../types/widget';

export type StateUpdateSource = 'local' | 'remote';
export type SettingsState = Record<string, unknown>;
export type TypingStatsPersistedState = Record<string, unknown>;

export function useStorageSync(params: {
  onPetStateChanged?: (nextState: UserPetState) => void;
  onWidgetStateChanged?: (nextState: WidgetState) => void;
  onSettingsChanged?: (nextState: SettingsState) => void;
  onTypingStatsChanged?: (nextState: TypingStatsPersistedState) => void;
}) {
  useEffect(() => {
    if (!globalThis.chrome?.storage?.onChanged) return;

    const handleChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;

      const petChange = changes[STORAGE_KEYS.PET_STATE];
      if (petChange?.newValue && params.onPetStateChanged) {
        params.onPetStateChanged(petChange.newValue as UserPetState);
      }

      const widgetChange = changes[STORAGE_KEYS.WIDGET_STATE];
      if (widgetChange?.newValue && params.onWidgetStateChanged) {
        params.onWidgetStateChanged(widgetChange.newValue as WidgetState);
      }

      const settingsChange = changes[STORAGE_KEYS.SETTINGS];
      if (settingsChange?.newValue && params.onSettingsChanged) {
        params.onSettingsChanged(settingsChange.newValue as SettingsState);
      }

      const typingStatsChange = changes[STORAGE_KEYS.TYPING_STATS];
      if (typingStatsChange?.newValue && params.onTypingStatsChanged) {
        params.onTypingStatsChanged(typingStatsChange.newValue as TypingStatsPersistedState);
      }
    };

    chrome.storage.onChanged.addListener(handleChanged);
    return () => chrome.storage.onChanged.removeListener(handleChanged);
  }, [params.onPetStateChanged, params.onSettingsChanged, params.onTypingStatsChanged, params.onWidgetStateChanged]);
}
