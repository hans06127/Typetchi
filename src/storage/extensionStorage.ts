let hasLoggedStorageInvalidation = false;

function isExtensionContextInvalidated(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Extension context invalidated');
}

function warnStorageUnavailable(error: unknown): void {
  if (hasLoggedStorageInvalidation) return;
  hasLoggedStorageInvalidation = true;
  if (isExtensionContextInvalidated(error)) {
    console.warn('[Typetchi] extension context invalidated, skipping storage access until reload');
    return;
  }
  console.warn('[Typetchi] storage unavailable, using in-memory state', error);
}

export async function getStorageValue<T>(key: string, defaultValue: T): Promise<T> {
  if (!globalThis.chrome?.storage?.local) return defaultValue;

  try {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T | undefined) ?? defaultValue;
  } catch (error) {
    warnStorageUnavailable(error);
    return defaultValue;
  }
}

export async function setStorageValue<T>(key: string, value: T): Promise<void> {
  if (!globalThis.chrome?.storage?.local) return;

  try {
    await chrome.storage.local.set({ [key]: value });
    console.log('[Typetchi] storage flushed');
  } catch (error) {
    warnStorageUnavailable(error);
  }
}
