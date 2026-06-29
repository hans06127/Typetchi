export async function getStoredValue<T>(key: string, fallback: T): Promise<T> {
  if (!globalThis.chrome?.storage?.local) return fallback;
  const result = await chrome.storage.local.get(key);
  return (result[key] as T | undefined) ?? fallback;
}
export async function setStoredValue<T>(key: string, value: T): Promise<void> {
  if (!globalThis.chrome?.storage?.local) return;
  await chrome.storage.local.set({ [key]: value });
}
