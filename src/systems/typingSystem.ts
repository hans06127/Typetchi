const previousLengthMap = new WeakMap<HTMLElement, number>();

export function isTrackableInput(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;

  if (target instanceof HTMLInputElement) {
    const allowedTypes = ['text', 'search'];
    return allowedTypes.includes(target.type) && !target.disabled && !target.readOnly;
  }

  if (target instanceof HTMLTextAreaElement) return !target.disabled && !target.readOnly;
  return target.isContentEditable;
}

export function getElementTextLength(element: HTMLElement): number {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value.length;
  if (element.isContentEditable) return element.innerText.length;
  return 0;
}

export function calculateAddedChars(element: HTMLElement): number {
  const currentLength = getElementTextLength(element);
  const previousLength = previousLengthMap.get(element) ?? currentLength - 1;
  previousLengthMap.set(element, currentLength);
  return Math.max(currentLength - previousLength, 0);
}
