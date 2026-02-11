import { detectJobPage, getJobBoard } from "../../features/scanning/job-detector";
import { AUTO_SCAN_STORAGE_KEY, SENTINEL_STORAGE_KEY, COOLDOWN_STORAGE_KEY, SETTINGS_STORAGE_KEY } from "../../lib/constants";

/** Cooldown (ms) to avoid re-scanning the same URL */
const SCAN_COOLDOWN_MS = 30_000;

/** Delay (ms) after detection to let SPA content render (fallback if no sentinel) */
const SCAN_DELAY_MS = 1500;

// ─── Session Storage Cooldown (AC8: survives SW restart) ─────────────

interface CooldownEntry {
  url: string;
  timestamp: number;
}

async function wasRecentlyScanned(url: string): Promise<boolean> {
  try {
    const result = await chrome.storage.session.get(COOLDOWN_STORAGE_KEY);
    const entries: CooldownEntry[] = result[COOLDOWN_STORAGE_KEY] || [];
    const now = Date.now();
    return entries.some(
      (e) => e.url === url && now - e.timestamp < SCAN_COOLDOWN_MS
    );
  } catch {
    return false;
  }
}

async function markAsScanned(url: string): Promise<void> {
  try {
    const result = await chrome.storage.session.get(COOLDOWN_STORAGE_KEY);
    const entries: CooldownEntry[] = result[COOLDOWN_STORAGE_KEY] || [];
    const now = Date.now();
    // Prune expired + add new
    const pruned = entries.filter((e) => now - e.timestamp < SCAN_COOLDOWN_MS);
    pruned.push({ url, timestamp: now });
    await chrome.storage.session.set({ [COOLDOWN_STORAGE_KEY]: pruned });
  } catch {
    // Ignore storage errors
  }
}

/**
 * Signal the side panel via chrome.storage.local.
 * The side panel listens for storage changes and triggers the actual scraping.
 * Includes board name for board-aware extraction (AC10).
 */
async function triggerAutoScan(tabId: number, url: string): Promise<void> {
  // Check autoScan preference before signaling (background can't use Zustand directly).
  // chromeStorageAdapter stores the Zustand state as a JSON string, not a parsed object.
  // Structure after JSON.parse: { state: { autoScan: true, ... }, version: N }
  try {
    const settingsResult = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
    const raw = settingsResult[SETTINGS_STORAGE_KEY];
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.autoScan === false) return;
    } else if (raw?.state?.autoScan === false) {
      // Defensive: handle case where storage contains a parsed object
      return;
    }
  } catch {
    // If settings read fails, default to enabled (autoScan: true is the default)
  }

  if (await wasRecentlyScanned(url)) return;
  await markAsScanned(url);

  const board = getJobBoard(url);

  await chrome.storage.local.set({
    [AUTO_SCAN_STORAGE_KEY]: { tabId, url, board, isJobPage: true, timestamp: Date.now(), id: crypto.randomUUID() },
  });
}

export default defineBackground(() => {
  // Open side panel when extension icon is clicked
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.warn("[Jobswyft] setPanelBehavior error:", err));

  // ─── Trigger 1: Full page load completion ──────────────────────────
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;
    if (!detectJobPage(tab.url)) return;

    // Delay to ensure page content is ready
    setTimeout(() => {
      triggerAutoScan(tabId, tab.url!);
    }, SCAN_DELAY_MS);
  });

  // ─── Trigger 2: SPA navigation (History API pushState/replaceState) ─
  // Critical for LinkedIn and similar single-page apps
  chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return; // Main frame only
    if (!detectJobPage(details.url)) return;

    setTimeout(() => {
      triggerAutoScan(details.tabId, details.url);
    }, SCAN_DELAY_MS);
  });

  // ─── Trigger 3: Tab switching ──────────────────────────────────────
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (!tab.url || !detectJobPage(tab.url)) return;
      triggerAutoScan(activeInfo.tabId, tab.url);
    } catch {
      // Tab may not exist anymore
    }
  });

  // ─── Trigger 4: Hash-based SPA navigation (AC9) ───────────────────
  // For job boards using hash routing (e.g., #/job/123)
  chrome.webNavigation.onReferenceFragmentUpdated.addListener((details) => {
    if (details.frameId !== 0) return; // Main frame only
    if (!detectJobPage(details.url)) return;

    setTimeout(() => {
      triggerAutoScan(details.tabId, details.url);
    }, SCAN_DELAY_MS);
  });

  // ─── Content Sentinel Integration (AC1, Task 4.3) ─────────────────
  // When the content sentinel signals readiness, forward to side panel
  // via the auto-scan signal. This bypasses the fixed delay.
  chrome.storage.session.onChanged.addListener(async (changes) => {
    const sentinelChange = changes[SENTINEL_STORAGE_KEY];
    if (!sentinelChange?.newValue) return;

    const { url } = sentinelChange.newValue as {
      tabId: number;
      url: string;
    };

    // Sentinel sends tabId: -1 (content scripts can't access their own tab ID).
    // Resolve the actual tab ID by matching the sentinel's URL against open tabs.
    try {
      const tabs = await chrome.tabs.query({ url: url });
      const matchingTab = tabs.find(t => t.id !== undefined);
      if (matchingTab?.id) {
        triggerAutoScan(matchingTab.id, url);
      } else {
        // Fallback: use active tab if URL match fails (e.g., URL mismatch due to redirects)
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          triggerAutoScan(activeTab.id, url);
        }
      }
    } catch {
      // Tab query may fail if no active window
    }
  });
});
