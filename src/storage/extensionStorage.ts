let hasLoggedStorageUnavailable = false;
let isStorageDisabled = false;

function isExtensionContextInvalidated(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Extension context invalidated');
}

function warnStorageUnavailable(error: unknown): void {
  if (hasLoggedStorageUnavailable) return;
  hasLoggedStorageUnavailable = true;

  if (isExtensionContextInvalidated(error)) {
    console.warn('[Typetchi] extension context invalidated; storage is disabled until the page reloads');
    return;
  }

  console.warn('[Typetchi] storage unavailable, using in-memory state', error);
}

function disableStorage(error: unknown): void {
  isStorageDisabled = true;
  warnStorageUnavailable(error);
}

function getChromeLocalStorage(): typeof chrome.storage.local | null {
  if (isStorageDisabled) return null;

  try {
    return globalThis.chrome?.storage?.local ?? null;
  } catch (error) {
    disableStorage(error);
    return null;
  }
}

export async function getStorageValue<T>(key: string, defaultValue: T): Promise<T> {
  const localStorage = getChromeLocalStorage();
  if (!localStorage) return defaultValue;

  try {
    const result = await localStorage.get(key);
    return (result[key] as T | undefined) ?? defaultValue;
  } catch (error) {
    disableStorage(error);
    return defaultValue;
  }
}

export async function setStorageValue<T>(key: string, value: T): Promise<void> {
  const localStorage = getChromeLocalStorage();
  if (!localStorage) return;

  try {
    await localStorage.set({ [key]: value });
    console.log('[Typetchi] storage flushed');
  } catch (error) {
    disableStorage(error);
  }
}
