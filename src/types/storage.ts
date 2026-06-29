import type { UserPetState } from './pet';
import type { WidgetState } from './widget';

export interface TypetchiSettings {
  enableTypingTracking: boolean;
  enablePasteExp: boolean;
}

export interface TypetchiStorageSchema {
  petState: UserPetState;
  widgetState: WidgetState;
  settings: TypetchiSettings;
}
