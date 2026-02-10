import { useState, useEffect, useCallback } from "react";
import type { StorageSchema, StorageKey } from "@/types/storage";

/**
 * Generic hook for reading/writing chrome.storage.local with real-time sync.
 */
export function useStorage<K extends StorageKey>(
  key: K,
  defaultValue: StorageSchema[K]
): [StorageSchema[K], (value: StorageSchema[K]) => void, boolean] {
  const [value, setValue] = useState<StorageSchema[K]>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial value
    chrome.storage.local.get([key]).then((result) => {
      if (result[key] !== undefined) {
        setValue(result[key] as StorageSchema[K]);
      }
      setIsLoading(false);
    });

    // Listen for external changes
    const listener = (
      changes: { [k: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes[key]) {
        setValue(changes[key].newValue as StorageSchema[K]);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key]);

  const setter = useCallback(
    (newValue: StorageSchema[K]) => {
      setValue(newValue);
      chrome.storage.local.set({ [key]: newValue });
    },
    [key]
  );

  return [value, setter, isLoading];
}
