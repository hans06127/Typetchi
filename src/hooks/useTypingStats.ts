import { useCallback, useEffect, useRef, useState } from 'react';
import { calculateCpm, calculateWpm, createTypingEvent, pruneTypingEvents, updateTypingSession } from '../systems/typingStatsSystem';
import type { TypingInputEvent, TypingSpeedState } from '../types/typingStats';
import { getLocalDateKey } from '../utils/date';

const emptySpeedState = (todayMaxCpm = 0, todayMaxWpm = 0): TypingSpeedState => ({
  recentCpm: 0,
  recentWpm: 0,
  todayMaxCpm,
  todayMaxWpm,
  sessionChars: 0,
  sessionStartedAt: null,
  lastTypedAt: null,
});

export function useTypingStats({ todayMaxCpm, todayMaxWpm, onTodayMaxChange }: {
  todayMaxCpm: number;
  todayMaxWpm: number;
  onTodayMaxChange: (max: { todayMaxCpm: number; todayMaxWpm: number }) => void;
}) {
  const eventsRef = useRef<TypingInputEvent[]>([]);
  const activeDateRef = useRef(getLocalDateKey());
  const [speedState, setSpeedState] = useState<TypingSpeedState>(() => emptySpeedState(todayMaxCpm, todayMaxWpm));

  useEffect(() => {
    setSpeedState((current) => ({ ...current, todayMaxCpm, todayMaxWpm }));
  }, [todayMaxCpm, todayMaxWpm]);

  const recordTyping = useCallback((addedChars: number, timestamp = Date.now()) => {
    const eventDate = getLocalDateKey(new Date(timestamp));
    const isNewDay = activeDateRef.current !== eventDate;
    if (isNewDay) {
      activeDateRef.current = eventDate;
      eventsRef.current = [];
    }
    const event = createTypingEvent({ addedChars, timestamp });
    const events = pruneTypingEvents([...eventsRef.current, event], timestamp);
    eventsRef.current = events;
    const recentCpm = calculateCpm(events, timestamp);
    const recentWpm = calculateWpm(recentCpm);

    setSpeedState((current) => {
      const baseState = isNewDay ? emptySpeedState() : current;
      const session = updateTypingSession({ previous: baseState, addedChars, timestamp });
      const nextTodayMaxCpm = Math.max(baseState.todayMaxCpm, recentCpm);
      const nextTodayMaxWpm = Math.max(baseState.todayMaxWpm, recentWpm);
      if (nextTodayMaxCpm !== baseState.todayMaxCpm || nextTodayMaxWpm !== baseState.todayMaxWpm) {
        onTodayMaxChange({ todayMaxCpm: nextTodayMaxCpm, todayMaxWpm: nextTodayMaxWpm });
      }
      return { ...session, recentCpm, recentWpm, todayMaxCpm: nextTodayMaxCpm, todayMaxWpm: nextTodayMaxWpm };
    });
  }, [onTodayMaxChange]);

  return { speedState, recordTyping };
}
