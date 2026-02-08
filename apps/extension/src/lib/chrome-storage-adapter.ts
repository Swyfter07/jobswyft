import type { StateStorage } from "zustand/middleware";

/**
 * Zustand-compatible StateStorage adapter backed by chrome.storage.local.
 *
 * Zustand's persist middleware supports async storage via createJSONStorage(),
 * so all methods can safely return promises.
 */
export const chromeStorageAdapter: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(name);
    return (result[name] as string) ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [name]: value });
  },
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.local.remove(name);
  },
};
