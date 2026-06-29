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

export async function getStoredValue<T>(key: string, fallback: T): Promise<T> {
  if (!globalThis.chrome?.storage?.local) return fallback;

  try {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T | undefined) ?? fallback;
  } catch (error) {
    warnStorageUnavailable(error);
    return fallback;
  }
}

export async function setStoredValue<T>(key: string, value: T): Promise<void> {
  if (!globalThis.chrome?.storage?.local) return;

  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    warnStorageUnavailable(error);
  }
}
