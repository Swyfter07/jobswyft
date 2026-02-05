/* Service Worker to handle Side Panel styling or opening behavior if needed */
console.log('[JobSwyft] ====== SERVICE WORKER LOADED ======');

// Log when service worker installs
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[JobSwyft] Extension installed/updated:', details.reason);
});

// Allows users to open the side panel by clicking the action toolbar icon
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// ============================================
// AUTO JOB SCAN FEATURE
// ============================================
console.log('[JobSwyft] Setting up auto-scan feature...');

// Job site URL patterns for auto-detection
const JOB_SITE_PATTERNS = [
    // LinkedIn Jobs - multiple URL formats
    { pattern: /linkedin\.com\/jobs\/view\//i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs\/collections\//i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs\/search\//i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs\?/i, site: 'LinkedIn' },  // Jobs with query params
    { pattern: /linkedin\.com\/jobs\/$/i, site: 'LinkedIn' }, // Base jobs URL
    { pattern: /linkedin\.com\/jobs$/i, site: 'LinkedIn' },   // Base jobs URL no trailing slash
    { pattern: /linkedin\.com\/my-items\/saved-jobs/i, site: 'LinkedIn' },
    { pattern: /currentJobId=/i, site: 'LinkedIn' },  // Job modal open (key indicator!)


    // Indeed
    { pattern: /indeed\.com\/viewjob/i, site: 'Indeed' },
    { pattern: /indeed\.com\/jobs\?/i, site: 'Indeed' },

    // Greenhouse (hosted job boards)
    { pattern: /boards\.greenhouse\.io\/.*\/jobs\//i, site: 'Greenhouse' },
    { pattern: /job-boards\.greenhouse\.io/i, site: 'Greenhouse' },

    // Lever
    { pattern: /jobs\.lever\.co\//i, site: 'Lever' },

    // Workday
    { pattern: /myworkdayjobs\.com\/.*\/job\//i, site: 'Workday' },
    { pattern: /wd\d+\.myworkdaysite\.com/i, site: 'Workday' },

    // Glassdoor
    { pattern: /glassdoor\.com\/job-listing\//i, site: 'Glassdoor' },

    // ZipRecruiter
    { pattern: /ziprecruiter\.com\/c\/.*\/job\//i, site: 'ZipRecruiter' },
    { pattern: /ziprecruiter\.com\/jobs\//i, site: 'ZipRecruiter' },

    // Monster
    { pattern: /monster\.com\/job-openings\//i, site: 'Monster' },

    // AngelList / Wellfound
    { pattern: /wellfound\.com\/jobs/i, site: 'Wellfound' },
    { pattern: /angel\.co\/company\/.*\/jobs/i, site: 'AngelList' },

    // Dice (tech jobs)
    { pattern: /dice\.com\/job-detail\//i, site: 'Dice' },

    // SimplyHired
    { pattern: /simplyhired\.com\/job\//i, site: 'SimplyHired' },

    // CareerBuilder
    { pattern: /careerbuilder\.com\/job\//i, site: 'CareerBuilder' },

    // Built In
    { pattern: /builtin\.com\/job\//i, site: 'BuiltIn' },

    // Company career pages (generic patterns)
    { pattern: /careers\.[^\/]+\.com\/.*job/i, site: 'Career Page' },
    { pattern: /jobs\.[^\/]+\.com\//i, site: 'Jobs Page' },
    { pattern: /\/careers\/.*positions?\//i, site: 'Career Page' },
    { pattern: /\/jobs\/\d+/i, site: 'Job Page' },
];

// Track recently scanned URLs to avoid duplicate scans
const recentlyScannedUrls = new Map();
const SCAN_COOLDOWN_MS = 30000; // 30 seconds cooldown per URL

/**
 * Check if a URL matches any job site pattern
 */
function detectJobSite(url) {
    console.log('[JobSwyft] Testing URL:', url);
    for (const { pattern, site } of JOB_SITE_PATTERNS) {
        if (pattern.test(url)) {
            console.log('[JobSwyft] ✓ Matched pattern:', pattern.toString(), '→', site);
            return site;
        }
    }
    return null;
}

/**
 * Check if URL was recently scanned (within cooldown period)
 */
function wasRecentlyScanned(url) {
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
function markAsScanned(url) {
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
 * Signal auto-scan to side panel via storage (more reliable than sendMessage)
 */
async function triggerAutoScan(tabId, url, siteName) {
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
        await chrome.storage.local.set({
            'job_jet_auto_scan_request': {
                tabId: tabId,
                url: url,
                siteName: siteName,
                timestamp: Date.now()
            }
        });
        console.log('[JobSwyft] Auto-scan request saved to storage');

    } catch (error) {
        console.error('[JobSwyft] Auto-scan trigger error:', error);
    }
}

// Listen for tab updates (navigation complete - for full page loads)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Log all tab updates for debugging
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('[JobSwyft] Tab updated (complete):', tab.url.substring(0, 80));
    }

    // Only trigger when page load is complete
    if (changeInfo.status !== 'complete') return;
    if (!tab.url) return;

    // Detect if this is a job page
    const siteName = detectJobSite(tab.url);
    console.log('[JobSwyft] Job site check:', siteName || 'not a job site');

    if (siteName) {
        console.log(`[JobSwyft] ✓ Job page detected! Site: ${siteName}`);
        // Small delay to ensure page content is ready
        setTimeout(() => {
            triggerAutoScan(tabId, tab.url, siteName);
        }, 1500);
    }
});

// Listen for SPA navigation (History API - pushState/replaceState)
// This is CRITICAL for LinkedIn and similar single-page apps
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    console.log('[JobSwyft] SPA navigation detected:', details.url.substring(0, 80));

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
    console.log('[JobSwyft] Tab activated:', activeInfo.tabId);
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
        console.log('[JobSwyft] Tab activation check error:', error.message);
    }
});

console.log('[JobSwyft] ====== ALL EVENT LISTENERS REGISTERED ======');
