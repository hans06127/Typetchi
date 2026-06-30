export const PASTE_DETECTION_WINDOW_MS = 1000;
export const MAX_CHARS_PER_INPUT_EVENT = 20;

const pasteElementMap = new WeakMap<HTMLElement, number>();

export function markPaste(element: HTMLElement, pastedAt: number): void {
  pasteElementMap.set(element, pastedAt);
}

export function wasRecentlyPasted(element: HTMLElement, now: number): boolean {
  const pastedAt = pasteElementMap.get(element);
  if (!pastedAt) return false;
  return now - pastedAt <= PASTE_DETECTION_WINDOW_MS;
}

export function shouldIgnoreInputForExp(params: {
  element: HTMLElement;
  addedChars: number;
  now: number;
  isComposing: boolean;
}): boolean {
  if (params.isComposing) return true;
  if (params.addedChars <= 0) return true;
  if (params.addedChars > MAX_CHARS_PER_INPUT_EVENT) return true;
  return wasRecentlyPasted(params.element, params.now);
}
