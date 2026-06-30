import type { TypingInputEvent, TypingSessionState } from '../types/typingStats';

export const TYPING_SESSION_IDLE_TIMEOUT = 10_000;
export const TYPING_EVENT_RETENTION_MS = 120_000;
export const TYPING_SPEED_WINDOW_MS = 60_000;

export function createTypingEvent(params: { addedChars: number; timestamp: number }): TypingInputEvent {
  return { timestamp: params.timestamp, addedChars: params.addedChars, source: 'typing' };
}

export function pruneTypingEvents(events: TypingInputEvent[], now: number): TypingInputEvent[] {
  const threshold = now - TYPING_EVENT_RETENTION_MS;
  return events.filter((event) => event.timestamp >= threshold);
}

export function calculateCpm(events: TypingInputEvent[], now: number): number {
  const windowStartedAt = now - TYPING_SPEED_WINDOW_MS;
  return events.filter((event) => event.timestamp >= windowStartedAt).reduce((sum, event) => sum + event.addedChars, 0);
}

export function calculateWpm(cpm: number): number {
  return Math.round(cpm / 5);
}

export function updateTypingSession(params: { previous: TypingSessionState; addedChars: number; timestamp: number }): TypingSessionState {
  const { previous, addedChars, timestamp } = params;
  const shouldStartNewSession = !previous.lastTypedAt || timestamp - previous.lastTypedAt > TYPING_SESSION_IDLE_TIMEOUT;
  return {
    sessionStartedAt: shouldStartNewSession ? timestamp : previous.sessionStartedAt,
    lastTypedAt: timestamp,
    sessionChars: shouldStartNewSession ? addedChars : previous.sessionChars + addedChars,
  };
}
