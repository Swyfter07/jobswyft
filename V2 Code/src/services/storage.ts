import type { StorageSchema, StorageKey } from "@/types/storage";

export async function getStorage<K extends StorageKey>(
  keys: K[]
): Promise<Pick<StorageSchema, K>> {
  return chrome.storage.local.get(keys) as Promise<Pick<StorageSchema, K>>;
}

export async function setStorage(
  data: Partial<StorageSchema>
): Promise<void> {
  return chrome.storage.local.set(data);
}

export async function removeStorage(keys: StorageKey[]): Promise<void> {
  return chrome.storage.local.remove(keys);
}

export function onStorageChange(
  callback: (changes: {
    [key: string]: chrome.storage.StorageChange;
  }) => void
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === "local") {
      callback(changes);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
