export interface TypingInputEvent {
  timestamp: number;
  addedChars: number;
  source: 'typing';
}

export interface TypingSessionState {
  sessionStartedAt: number | null;
  lastTypedAt: number | null;
  sessionChars: number;
}

export interface TypingSpeedState extends TypingSessionState {
  recentCpm: number;
  recentWpm: number;
  todayMaxCpm: number;
  todayMaxWpm: number;
}
