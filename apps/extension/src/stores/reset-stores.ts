/**
 * resetAllStores — Clears all user-specific Zustand stores and their chrome.storage keys.
 *
 * Called on:
 * 1. signOut() — prevent stale data leaking to next session / different user
 * 2. Login entry point — ensure clean slate before fetching new user's data
 *
 * Does NOT reset:
 * - useSettingsStore (device preferences, not user-specific)
 * - useThemeStore (device preference)
 * - 'jobswyft_session' (handled separately by auth-store clearSession)
 */

import { useSidebarStore } from "./sidebar-store";
import { useScanStore } from "./scan-store";
import { useResumeStore } from "./resume-store";
import { useCreditsStore } from "./credits-store";
import { useAutofillStore } from "./autofill-store";

/** Chrome storage keys for user-specific stores (must match Zustand persist names). */
const USER_SPECIFIC_STORAGE_KEYS = [
  "jobswyft-sidebar",
  "jobswyft-scan",
  "jobswyft-autofill",
  "jobswyft-resumes",
  "jobswyft-credits",
] as const;

/** Safely execute a reset function, capturing errors instead of throwing. */
function safeReset(name: string, fn: () => void, errors: string[]): void {
  try {
    fn();
  } catch (e) {
    errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function resetAllStores(): Promise<void> {
  const errors: string[] = [];

  // 1. Reset Zustand in-memory state for each user-specific store
  safeReset("sidebar", () => useSidebarStore.getState().resetJob(), errors);
  safeReset("scan", () => useScanStore.getState().resetScan(), errors);
  safeReset("resume", () => useResumeStore.getState().resetResumes(), errors);
  safeReset("credits", () => useCreditsStore.getState().resetCredits(), errors);
  safeReset("autofill", () => {
    useAutofillStore.getState().resetAutofill();
    // CRITICAL: resetAutofill() intentionally preserves autofillData (page-scoped use).
    // For logout, we must also clear autofillData explicitly.
    useAutofillStore.setState({ autofillData: null });
  }, errors);

  // 2. Remove user-specific keys from chrome.storage.local to prevent
  //    hydration of stale data on next login.
  try {
    await chrome.storage.local.remove([...USER_SPECIFIC_STORAGE_KEYS]);
  } catch (e) {
    errors.push(`chrome.storage.remove: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (errors.length > 0) {
    console.warn("[resetAllStores] Partial failures:", errors);
  }
}
