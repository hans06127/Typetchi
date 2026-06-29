export async function getStorageValue<T>(key: string, defaultValue: T): Promise<T> {
  if (!globalThis.chrome?.storage?.local) return defaultValue;
  const result = await chrome.storage.local.get(key);
  return (result[key] as T | undefined) ?? defaultValue;
}

export async function setStorageValue<T>(key: string, value: T): Promise<void> {
  if (!globalThis.chrome?.storage?.local) return;
  await chrome.storage.local.set({ [key]: value });
  console.log('[Typetchi] storage flushed');
}
