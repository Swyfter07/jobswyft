/// <reference types="chrome" />

console.log('JobSwyft V2 Background Script Loaded');

// Setup Side Panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Job site URL patterns for auto-detection (Ported from V1)
const JOB_SITE_PATTERNS = [
    // LinkedIn Jobs
    { pattern: /linkedin\.com\/jobs\/view\//i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs\/collections\//i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs\/search\//i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs\?/i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs\/$/i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs$/i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/my-items\/saved-jobs/i, site: 'LinkedIn' },
    { pattern: /currentJobId=/i, site: 'LinkedIn' },

    // Indeed
    { pattern: /indeed\.com\/viewjob/i, site: 'Indeed' },
    { pattern: /indeed\.com\/jobs\?/i, site: 'Indeed' },

    // Greenhouse
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

    // Generic
    { pattern: /careers\.[^\/]+\.com\/.*job/i, site: 'Career Page' },
    { pattern: /jobs\.[^\/]+\.com\//i, site: 'Jobs Page' },
];

function detectJobSite(url: string): string | null {
    for (const { pattern, site } of JOB_SITE_PATTERNS) {
        if (pattern.test(url)) return site;
    }
    return null;
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const site = detectJobSite(tab.url);
        if (site) {
            console.log(`Job page detected (${site}):`, tab.url);
            chrome.tabs.sendMessage(tabId, { action: "scan_job" })
                .catch(err => console.log("Scan message failed (content script not ready):", err));
        }
    }
});

// Listen for SPA navigation (History API)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return; // Main frame only

    const site = detectJobSite(details.url);
    if (site) {
        console.log(`SPA navigation to job page (${site}):`, details.url);
        // Small delay for SPA rendering
        setTimeout(() => {
            chrome.tabs.sendMessage(details.tabId, { action: "scan_job" })
                .catch(err => console.log("SPA scan message failed:", err));
        }, 1500);
    }
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'job_data_extracted') {
        console.log("Job Data Extracted:", request.data);
        // Save to storage which UI hooks listen to
        chrome.storage.local.set({ scannedJob: request.data });
    }
});
