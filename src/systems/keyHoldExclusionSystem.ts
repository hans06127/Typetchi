export const LONG_KEY_HOLD_THRESHOLD_MS = 1500;

type KeyHoldState = {
  startedAt: number;
  invalidAfterThreshold: boolean;
};

const keyHoldMap = new WeakMap<HTMLElement, Map<string, KeyHoldState>>();
const invalidRepeatMap = new WeakMap<HTMLElement, number>();

function getKeyId(event: KeyboardEvent): string {
  return `${event.code || 'unknown'}:${event.key || 'unknown'}`;
}

function getElementMap(element: HTMLElement): Map<string, KeyHoldState> {
  const existing = keyHoldMap.get(element);
  if (existing) return existing;
  const next = new Map<string, KeyHoldState>();
  keyHoldMap.set(element, next);
  return next;
}

export function trackKeyDown(event: KeyboardEvent, now: number): void {
  if (!(event.target instanceof HTMLElement)) return;
  if (event.isComposing) return;

  const keyId = getKeyId(event);
  const elementMap = getElementMap(event.target);
  const existing = elementMap.get(keyId);

  if (!event.repeat || !existing) {
    elementMap.set(keyId, { startedAt: now, invalidAfterThreshold: false });
    return;
  }

  if (now - existing.startedAt > LONG_KEY_HOLD_THRESHOLD_MS) {
    existing.invalidAfterThreshold = true;
    invalidRepeatMap.set(event.target, now);
  }
}

export function trackKeyUp(event: KeyboardEvent): void {
  if (!(event.target instanceof HTMLElement)) return;
  keyHoldMap.get(event.target)?.delete(getKeyId(event));
}

export function wasLongKeyHoldRepeat(element: HTMLElement, now: number): boolean {
  const invalidAt = invalidRepeatMap.get(element);
  return Boolean(invalidAt && now - invalidAt <= 250);
}
