const previousValueMap = new WeakMap<HTMLElement, string>();

export function isTrackableInput(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) {
    const ignoredTypes = ['password', 'hidden', 'checkbox', 'radio', 'file', 'submit', 'button'];
    return !ignoredTypes.includes(target.type) && !target.disabled && !target.readOnly;
  }
  if (target instanceof HTMLTextAreaElement) return !target.disabled && !target.readOnly;
  return target.isContentEditable;
}

export function getElementText(element: HTMLElement): string {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value;
  if (element.isContentEditable) return element.innerText;
  return '';
}

export function calculateAddedChars(element: HTMLElement): number {
  const currentValue = getElementText(element);
  const previousValue = previousValueMap.get(element) ?? '';
  previousValueMap.set(element, currentValue);
  return Math.max(currentValue.length - previousValue.length, 0);
}
