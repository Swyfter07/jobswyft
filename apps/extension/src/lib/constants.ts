export const API_URL =
  import.meta.env.WXT_API_URL ?? "https://api.jobswyft.com";

export const DASHBOARD_URL = "https://dashboard.jobswyft.com";

/**
 * Side Panel className override for ExtensionSidebar component.
 * Chrome Side Panel API manages dimensions, so we remove fixed positioning.
 */
export const SIDE_PANEL_CLASSNAME =
  "relative inset-auto h-screen w-full border-l-0 shadow-none z-auto";

/** Storage key for auto-scan signals from background → side panel */
export const AUTO_SCAN_STORAGE_KEY = "jobswyft-auto-scan-request";

/** Storage key for content sentinel readiness signal */
export const SENTINEL_STORAGE_KEY = "jobswyft-content-ready";

/** Session storage key for cooldown data (survives SW restart) */
export const COOLDOWN_STORAGE_KEY = "jobswyft-scan-cooldown";

/** Storage key for settings (used by background worker's raw chrome.storage reads).
 *  Must match settings-store.ts Zustand persist name.
 *  Format: { state: { autoScan: boolean, autoAnalysis: boolean, ... }, version: N } */
export const SETTINGS_STORAGE_KEY = "jobswyft-settings";
