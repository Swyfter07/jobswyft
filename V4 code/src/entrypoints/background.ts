
import { detectJobSite } from '@/utils/job-detection';

export default defineBackground(() => {
    console.log('[JobSwyft] ====== BACKGROUND SERVICE WORKER STARTED ======');

    // Enable side panel to open on action click
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error('[JobSwyft] Failed to set panel behavior:', error));


    // Track recently scanned URLs to avoid duplicate scans
    const recentlyScannedUrls = new Map<string, number>();
    const SCAN_COOLDOWN_MS = 30000; // 30 seconds cooldown per URL

    /**
     * Check if URL was recently scanned (within cooldown period)
     */
    function wasRecentlyScanned(url: string): boolean {
        const lastScanned = recentlyScannedUrls.get(url);
        if (!lastScanned) return false;

        const elapsed = Date.now() - lastScanned;
        if (elapsed > SCAN_COOLDOWN_MS) {
            recentlyScannedUrls.delete(url);
            return false;
        }
        return true;
    }

    /**
     * Mark URL as scanned
     */
    function markAsScanned(url: string) {
        recentlyScannedUrls.set(url, Date.now());

        // Cleanup old entries (keep map size manageable)
        if (recentlyScannedUrls.size > 50) {
            const now = Date.now();
            for (const [key, time] of recentlyScannedUrls) {
                if (now - time > SCAN_COOLDOWN_MS) {
                    recentlyScannedUrls.delete(key);
                }
            }
        }
    }

    /**
     * Signal auto-scan to side panel via storage
     */
    async function triggerAutoScan(tabId: number, url: string, siteName: string) {
        try {
            // Check user preference first
            const result = await chrome.storage.local.get(['job_jet_auto_scan_enabled']);
            const autoScanEnabled = result.job_jet_auto_scan_enabled !== false; // Default to true

            if (!autoScanEnabled) {
                console.log('[JobSwyft] Auto-scan disabled by user preference');
                return;
            }

            // Check cooldown
            if (wasRecentlyScanned(url)) {
                console.log('[JobSwyft] URL recently scanned, skipping:', url);
                return;
            }

            console.log(`[JobSwyft] Job page detected (${siteName}):`, url);
            markAsScanned(url);

            // Signal auto-scan via storage (sidepanel listens for changes)
            // TODO: Replace with WXT messaging/storage for better type safety eventually
            await chrome.storage.local.set({
                'job_jet_auto_scan_request': {
                    tabId: tabId,
                    url: url,
                    siteName: siteName,
                    timestamp: Date.now()
                }
            });
            console.log('[JobSwyft] Auto-scan request saved to storage');

            // Also try to open sidepanel if configured to do so
            // In V3, we might want to be less intrusive, but V1 had openPanelOnActionClick
            // We can't programmatically open sidepanel easily without user gesture in V3 unless previously opened

        } catch (error) {
            console.error('[JobSwyft] Auto-scan trigger error:', error);
        }
    }

    // Listen for tab updates (navigation complete - for full page loads)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        // Only trigger when page load is complete
        if (changeInfo.status !== 'complete') return;
        if (!tab.url) return;

        // Detect if this is a job page
        const siteName = detectJobSite(tab.url);

        if (siteName) {
            console.log(`[JobSwyft] ✓ Job page detected! Site: ${siteName}`);
            // Small delay to ensure page content is ready
            setTimeout(() => {
                if (tab.url) triggerAutoScan(tabId, tab.url, siteName);
            }, 1500);
        }
    });

    // Listen for SPA navigation (History API)
    chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
        // Only care about main frame navigation
        if (details.frameId !== 0) return;

        const siteName = detectJobSite(details.url);
        if (siteName) {
            console.log(`[JobSwyft] ✓ SPA job page detected! Site: ${siteName}`);
            // Delay to let SPA content render
            setTimeout(() => {
                triggerAutoScan(details.tabId, details.url, siteName);
            }, 1500);
        }
    });

    // Listen for tab activation (switching tabs)
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        try {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            if (!tab.url) return;

            const siteName = detectJobSite(tab.url);
            if (siteName) {
                console.log(`[JobSwyft] ✓ Switched to job page! Site: ${siteName}`);
                triggerAutoScan(activeInfo.tabId, tab.url, siteName);
            }
        } catch (error) {
            // Tab might not exist anymore
            console.log('[JobSwyft] Tab activation check error:', error);
        }
    });
});
