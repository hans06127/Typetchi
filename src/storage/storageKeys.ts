export const STORAGE_KEYS = {
  PET_STATE: 'typetchi.petState',
  WIDGET_STATE: 'typetchi.widgetState',
  SETTINGS: 'typetchi.settings',
  TYPING_STATS: 'typetchi.typingStats',

  // Backward-compatible aliases for existing code paths.
  pet: 'typetchi.petState',
  widget: 'typetchi.widgetState',
} as const;
