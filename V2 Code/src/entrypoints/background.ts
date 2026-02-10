export default defineBackground(() => {
  console.log("[JobSwyft] ====== SERVICE WORKER LOADED ======");

  // Open side panel on extension icon click
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: Error) => console.error(error));

  // ============================================
  // AUTO JOB SCAN FEATURE
  // ============================================

  const JOB_SITE_PATTERNS: Array<{ pattern: RegExp; site: string }> = [
    // LinkedIn Jobs
    { pattern: /linkedin\.com\/jobs\/view\//i, site: "LinkedIn" },
    { pattern: /linkedin\.com\/jobs\/collections\//i, site: "LinkedIn" },
    { pattern: /linkedin\.com\/jobs\/search\//i, site: "LinkedIn" },
    { pattern: /linkedin\.com\/jobs\?/i, site: "LinkedIn" },
    { pattern: /linkedin\.com\/jobs\/$/i, site: "LinkedIn" },
    { pattern: /linkedin\.com\/jobs$/i, site: "LinkedIn" },
    { pattern: /linkedin\.com\/my-items\/saved-jobs/i, site: "LinkedIn" },
    { pattern: /currentJobId=/i, site: "LinkedIn" },
    // Indeed
    { pattern: /indeed\.com\/viewjob/i, site: "Indeed" },
    { pattern: /indeed\.com\/jobs\?/i, site: "Indeed" },
    // Greenhouse
    { pattern: /boards\.greenhouse\.io\/.*\/jobs\//i, site: "Greenhouse" },
    { pattern: /job-boards\.greenhouse\.io/i, site: "Greenhouse" },
    // Lever
    { pattern: /jobs\.lever\.co\//i, site: "Lever" },
    // Workday
    { pattern: /myworkdayjobs\.com\/.*\/job\//i, site: "Workday" },
    { pattern: /wd\d+\.myworkdaysite\.com/i, site: "Workday" },
    // Glassdoor
    { pattern: /glassdoor\.com\/job-listing\//i, site: "Glassdoor" },
    // ZipRecruiter
    { pattern: /ziprecruiter\.com\/c\/.*\/job\//i, site: "ZipRecruiter" },
    { pattern: /ziprecruiter\.com\/jobs\//i, site: "ZipRecruiter" },
    // Monster
    { pattern: /monster\.com\/job-openings\//i, site: "Monster" },
    // AngelList / Wellfound
    { pattern: /wellfound\.com\/jobs/i, site: "Wellfound" },
    { pattern: /angel\.co\/company\/.*\/jobs/i, site: "AngelList" },
    // Dice
    { pattern: /dice\.com\/job-detail\//i, site: "Dice" },
    // SimplyHired
    { pattern: /simplyhired\.com\/job\//i, site: "SimplyHired" },
    // CareerBuilder
    { pattern: /careerbuilder\.com\/job\//i, site: "CareerBuilder" },
    // Built In
    { pattern: /builtin\.com\/job\//i, site: "BuiltIn" },
    // Generic career pages
    { pattern: /careers\.[^/]+\.com\/.*job/i, site: "Career Page" },
    { pattern: /jobs\.[^/]+\.com\//i, site: "Jobs Page" },
    { pattern: /\/careers\/.*positions?\//i, site: "Career Page" },
    { pattern: /\/jobs\/\d+/i, site: "Job Page" },
  ];

  // URL cooldown tracking
  const recentlyScannedUrls = new Map<string, number>();
  const SCAN_COOLDOWN_MS = 30000;

  function detectJobSite(url: string): string | null {
    for (const { pattern, site } of JOB_SITE_PATTERNS) {
      if (pattern.test(url)) return site;
    }
    return null;
  }

  function wasRecentlyScanned(url: string): boolean {
    const lastScanned = recentlyScannedUrls.get(url);
    if (!lastScanned) return false;
    if (Date.now() - lastScanned > SCAN_COOLDOWN_MS) {
      recentlyScannedUrls.delete(url);
      return false;
    }
    return true;
  }

  function markAsScanned(url: string): void {
    recentlyScannedUrls.set(url, Date.now());
    // Cleanup old entries
    if (recentlyScannedUrls.size > 50) {
      const now = Date.now();
      for (const [key, time] of recentlyScannedUrls) {
        if (now - time > SCAN_COOLDOWN_MS) {
          recentlyScannedUrls.delete(key);
        }
      }
    }
  }

  async function triggerAutoScan(
    tabId: number,
    url: string,
    siteName: string
  ): Promise<void> {
    try {
      const result = await chrome.storage.local.get([
        "job_jet_auto_scan_enabled",
      ]);
      const autoScanEnabled = result.job_jet_auto_scan_enabled !== false;

      if (!autoScanEnabled) return;
      if (wasRecentlyScanned(url)) return;

      console.log(`[JobSwyft] Job page detected (${siteName}):`, url);
      markAsScanned(url);

      await chrome.storage.local.set({
        job_jet_auto_scan_request: {
          tabId,
          url,
          siteName,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error("[JobSwyft] Auto-scan trigger error:", error);
    }
  }

  // Tab updated (full page loads)
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;
    const siteName = detectJobSite(tab.url);
    if (siteName) {
      setTimeout(() => triggerAutoScan(tabId, tab.url!, siteName), 1500);
    }
  });

  // SPA navigation (critical for LinkedIn)
  chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return;
    const siteName = detectJobSite(details.url);
    if (siteName) {
      setTimeout(
        () => triggerAutoScan(details.tabId, details.url, siteName),
        1500
      );
    }
  });

  // Tab activation (switching tabs)
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (!tab.url) return;
      const siteName = detectJobSite(tab.url);
      if (siteName) {
        triggerAutoScan(activeInfo.tabId, tab.url, siteName);
      }
    } catch {}
  });

  console.log("[JobSwyft] ====== ALL EVENT LISTENERS REGISTERED ======");
});
