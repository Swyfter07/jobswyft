import { detectJobPage } from "../../features/scanning/job-detector";

/** Storage key for auto-scan signals to the side panel */
const STORAGE_KEY = "jobswyft-auto-scan-request";

/** Cooldown (ms) to avoid re-scanning the same URL */
const SCAN_COOLDOWN_MS = 30_000;

/** Delay (ms) after detection to let SPA content render */
const SCAN_DELAY_MS = 1500;

/** Track recently scanned URLs to avoid duplicates */
const recentlyScanned = new Map<string, number>();

function wasRecentlyScanned(url: string): boolean {
  const last = recentlyScanned.get(url);
  if (!last) return false;
  if (Date.now() - last > SCAN_COOLDOWN_MS) {
    recentlyScanned.delete(url);
    return false;
  }
  return true;
}

function markAsScanned(url: string): void {
  const now = Date.now();
  recentlyScanned.set(url, now);
  // Prune expired entries on every insert
  for (const [key, time] of recentlyScanned) {
    if (now - time > SCAN_COOLDOWN_MS) recentlyScanned.delete(key);
  }
}

/**
 * Signal the side panel via chrome.storage.local.
 * The side panel listens for storage changes and triggers the actual scraping.
 */
async function triggerAutoScan(tabId: number, url: string): Promise<void> {
  if (wasRecentlyScanned(url)) return;
  markAsScanned(url);

  await chrome.storage.local.set({
    [STORAGE_KEY]: { tabId, url, timestamp: Date.now() },
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
});
