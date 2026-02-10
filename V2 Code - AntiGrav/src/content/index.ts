console.log("JobSwyft V2 Content Script Loaded");

// Helper to clean text
const clean = (str: string | null | undefined) => str ? str.trim().replace(/\s+/g, ' ') : '';

function scrapePageDetails() {
    // 1. Get Title
    let title = '';
    const h1 = document.querySelector('h1');
    if (h1) title = clean(h1.innerText);
    if (!title) {
        const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
        if (ogTitle) title = clean(ogTitle.content);
    }
    if (!title) title = clean(document.title);

    // 2. Get Company
    let company = '';
    // Strategy A: JSON-LD (Best for structured data)
    try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            if (script.textContent) {
                const json = JSON.parse(script.textContent);
                if (json['@type'] === 'JobPosting' && json.hiringOrganization) {
                    company = json.hiringOrganization.name;
                    break;
                }
            }
        }
    } catch (e) { }

    // Strategy B: Meta Tags
    if (!company) {
        const ogSiteName = document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement;
        if (ogSiteName) company = clean(ogSiteName.content);
    }

    // Strategy C: Common Class Names
    if (!company) {
        const companyEl = document.querySelector('[class*="company"], [class*="employer"], [class*="organization"]') as HTMLElement;
        if (companyEl) company = clean(companyEl.innerText);
    }

    // 3. Get Location
    let location = '';
    // JSON-LD
    try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            if (script.textContent) {
                const json = JSON.parse(script.textContent);
                if (json['@type'] === 'JobPosting' && json.jobLocation) {
                    const loc = json.jobLocation;
                    if (loc.address) {
                        location = [loc.address.addressLocality, loc.address.addressRegion].filter(Boolean).join(', ');
                    }
                    break;
                }
            }
        }
    } catch (e) { }
    // Meta / Common
    if (!location) {
        const locEl = document.querySelector('[class*="location"], [class*="jobLocation"]') as HTMLElement;
        if (locEl) location = clean(locEl.innerText);
    }

    // 4. Get Salary
    let salary = '';
    // JSON-LD
    try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            if (script.textContent) {
                const json = JSON.parse(script.textContent);
                if (json['@type'] === 'JobPosting' && json.baseSalary) {
                    const val = json.baseSalary.value;
                    if (val) {
                        salary = (val.minValue ? val.minValue + '-' + val.maxValue : val.value) + ' ' + (val.currency || '');
                    }
                    break;
                }
            }
        }
    } catch (e) { }
    // Common
    if (!salary) {
        const salEl = document.querySelector('[class*="salary"], [class*="compensation"]') as HTMLElement;
        if (salEl) salary = clean(salEl.innerText);
    }

    // 5. Get Description
    let description = '';
    const selection = window.getSelection()?.toString();
    if (selection && selection.length > 50) {
        description = selection;
    }

    if (!description) {
        const selectors = [
            '#jobDescriptionText',
            '.jobsearch-jobDescriptionText',
            '.jobsearch-JobComponent-description',
            '.jobs-description__content',
            '.jobs-box__html-content',
            '.description__text',
            '#job-details',
            '[class*="JobDetails_jobDescription"]',
            '.jobDescriptionContent',
            '[data-test="jobDescription"]',
            '.jobDescriptionSection',
            '.job_description',
            '[data-testid="jobDescription-container"]',
            '.posting-categories',
            '.section-wrapper',
            '[data-automation-id="jobPostingDescription"]',
            '.job-description-container',
            '#content',
            '.job-post-description',
            '#job_description',
            '.job-details',
            '[class*="styles_description"]',
            '.job-sections',
            '[class*="Ashby"]',
            '.ashby-job-posting-description',
            '[data-test="job-description-text"]',
            '[id*="job_description"]',
            '[id*="job-description"]',
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector) as HTMLElement;
            if (el && el.innerText.length > 100) {
                description = clean(el.innerText);
                break;
            }
        }
    }

    return {
        title,
        company,
        location,
        salary,
        description,
        url: window.location.href,
        postedAt: "Today" // Placeholder
    };
}

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scan_job") {
        console.log("Scanning job via V2 content script...");
        const jobData = scrapePageDetails();
        sendResponse(jobData);
        // Also send message for async handling
        chrome.runtime.sendMessage({ action: "job_data_extracted", data: jobData });
    }
    return true; // Keep channel open for sendResponse
});
