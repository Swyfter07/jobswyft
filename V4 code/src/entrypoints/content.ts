// Content script for job page scraping and autofill
// This script is injected into job sites to extract job details and fill forms

import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
    matches: ['<all_urls>'],
    allFrames: true,
    main() {
        console.log('[JobSwyft] Content script loaded');

        // Listen for messages from the sidepanel
        chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
            if (request.action === 'SCAN_PAGE') {
                console.log('[JobSwyft] Received SCAN_PAGE request');
                const data = scrapePageDetails();
                console.log('[JobSwyft] Scraped data:', data);
                sendResponse(data);
            } else if (request.action === 'DETECT_FORM_FIELDS') {
                console.log('[JobSwyft] Detecting form fields');
                const fields = detectFormFields();
                console.log('[JobSwyft] Detected fields:', fields);
                sendResponse({ success: true, fields });
            } else if (request.action === 'FILL_FORM_FIELDS') {
                console.log('[JobSwyft] Filling form fields:', request.fieldValues);
                const result = fillFormFields(request.fieldValues);
                sendResponse(result);
            }
            return true; // Keep channel open for async response
        });
    },
});

/**
 * Detect which job board we're on based on URL/DOM
 */
function detectJobBoard(): 'ashby' | 'workday' | 'greenhouse' | 'lever' | 'linkedin' | 'indeed' | 'unknown' {
    const url = window.location.hostname;
    if (url.includes('ashbyhq.com')) return 'ashby';
    if (url.includes('myworkdaysite.com') || url.includes('myworkdayjobs.com') || url.includes('wd3.myworkdayjobs.com')) return 'workday';
    if (url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) return 'greenhouse';
    if (url.includes('lever.co') || url.includes('jobs.lever.co')) return 'lever';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('indeed.com')) return 'indeed';
    return 'unknown';
}

/**
 * Check if a field is an EEO/compliance field based on label
 */
function getEEOFieldType(label: string): 'veteran' | 'disability' | 'race' | 'gender' | 'sponsorship' | 'authorization' | null {
    const lower = label.toLowerCase();
    if (/veteran|military|armed forces|served/i.test(lower)) return 'veteran';
    if (/disability|disabled|impairment|accommodation/i.test(lower)) return 'disability';
    if (/race|ethnic|hispanic|latino|asian|african|caucasian|native/i.test(lower)) return 'race';
    if (/gender|sex|male|female|non-binary|pronouns/i.test(lower)) return 'gender';
    if (/sponsor|visa|work authorization|h1b|h-1b/i.test(lower)) return 'sponsorship';
    if (/authorized to work|legally authorized|eligible to work|right to work/i.test(lower)) return 'authorization';
    return null;
}

/**
 * Detect fillable form fields on the page
 */
function detectFormFields() {
    const fields: Array<{
        id: string;
        selector: string;
        label: string;
        type: string;
        currentValue: string;
        category: 'personal' | 'resume' | 'questions' | 'eeo';
        eeoType?: 'veteran' | 'disability' | 'race' | 'gender' | 'sponsorship' | 'authorization';
        jobBoard: string;
    }> = [];

    const jobBoard = detectJobBoard();
    console.log(`[JobSwyft] Detected job board: ${jobBoard}`);

    // Find all input, textarea, and select elements
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, select'
    );

    inputs.forEach((input, index) => {
        // Skip disabled fields
        if (input.disabled) return;

        // Skip hidden fields ONLY if they are not file inputs
        // Most modern file inputs are "display: none" or hidden, so we must include them
        const isHidden = input.hidden || getComputedStyle(input).display === 'none' || input.type === 'hidden';
        if (isHidden && input.type !== 'file') {
            return;
        }

        // Get label text using multiple strategies
        let label = '';

        // Method 1: Associated label element
        if (input.id) {
            const labelEl = document.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`);
            if (labelEl) label = labelEl.textContent?.trim() || '';
        }

        // Method 2: Parent label
        if (!label) {
            const parentLabel = input.closest('label');
            if (parentLabel) label = parentLabel.textContent?.trim() || '';
        }

        // Method 3: Ashby-specific question title
        if (!label && jobBoard === 'ashby') {
            const container = input.closest('[class*="question"], [class*="field"]');
            const titleEl = container?.querySelector('[class*="question-title"], [class*="label"]');
            if (titleEl) label = titleEl.textContent?.trim() || '';
        }

        // Method 4: Workday-specific labels
        if (!label && jobBoard === 'workday') {
            const container = input.closest('[data-automation-id]');
            const labelEl = container?.querySelector('label, [data-automation-id*="label"]');
            if (labelEl) label = labelEl.textContent?.trim() || '';
        }

        // Method 5: aria-label
        if (!label) label = input.getAttribute('aria-label') || '';

        // Method 6: placeholder
        if (!label && 'placeholder' in input) label = input.placeholder || '';

        // Method 7: name attribute (fallback)
        if (!label) label = input.name || '';

        if (!label) return; // Skip fields with no identifiable label

        // Determine category based on field type/name/label
        const lowerLabel = label.toLowerCase();
        const lowerName = (input.name || '').toLowerCase();
        let category: 'personal' | 'resume' | 'questions' | 'eeo' = 'questions';
        let eeoType = getEEOFieldType(label);

        if (eeoType) {
            category = 'eeo';
        } else if (/name|email|phone|tel|address|city|state|zip|linkedin|website|url|portfolio/i.test(lowerLabel + lowerName)) {
            category = 'personal';
        } else if (/resume|cv|cover/i.test(lowerLabel + lowerName)) {
            category = 'resume';
        }

        if (input.type === 'file' && category === 'questions') {
            const isAutofill = /autofill/i.test(lowerLabel) || /autofill/i.test(lowerName);
            if (!isAutofill && (/resume|cv|curriculum|attach/i.test(lowerLabel) || /resume|cv/i.test(lowerName))) {
                category = 'resume';
            }
        }

        // Create unique selector
        const selector = input.id
            ? `#${CSS.escape(input.id)}`
            : input.name
                ? `[name="${CSS.escape(input.name)}"]`
                : `input:nth-of-type(${index + 1})`;

        fields.push({
            id: `field_${index}`,
            selector,
            label: label.substring(0, 150), // Allow longer labels for questions
            type: input.type || input.tagName.toLowerCase(),
            currentValue: input.value || '',
            category,
            ...(eeoType && { eeoType }),
            jobBoard
        });
    });



    // Fallback: If no resume field detected, but we found a file input, use the first one
    const hasResumeField = fields.some(f => f.category === 'resume');
    if (!hasResumeField) {
        const firstFileInput = fields.find(f => f.type === 'file' && f.category === 'questions');
        if (firstFileInput) {
            console.log('[JobSwyft] No specific resume field found. Fallback: Promoting first file input to resume category.');
            firstFileInput.category = 'resume';
        }
    }

    return fields;
}

/**
 * Set value on an input element in a way that React/frameworks detect
 */
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
    const tagName = element.tagName.toLowerCase();
    let proto;

    if (tagName === 'textarea') {
        proto = window.HTMLTextAreaElement.prototype;
    } else if (tagName === 'select') {
        proto = window.HTMLSelectElement.prototype;
    } else {
        proto = window.HTMLInputElement.prototype;
    }

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;

    if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
    } else {
        element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * Fill form fields with provided values.
 * Post-Hybrid Refactor: This now only handles text-based/choice-based fields.
 * File uploads (Resumes) are handled directly from the sidepanel via executeScript (MAIN world).
 */
function fillFormFields(fieldValues: Array<{ selector: string; value: string }>) {
    let filled = 0;
    let errors: string[] = [];

    fieldValues.forEach(({ selector, value }) => {
        try {
            const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector);
            if (element) {
                // Use native setter for React compatibility
                setNativeValue(element, value);
                filled++;
            } else {
                errors.push(`Element not found: ${selector}`);
            }
        } catch (e) {
            errors.push(`Error filling ${selector}: ${e}`);
        }
    });

    return { success: errors.length === 0, filled, errors };
}

/**
 * Find the potential drop zone container for a file input
 * Looks up the DOM tree for elements that might be drop targets
 */
function findDropZone(input: HTMLInputElement): HTMLElement | null {
    // 1. Check if the input itself is part of a known drop structure
    // react-dropzone often places the input inside a div with role="presentation" or specific classes
    let parent = input.parentElement;
    let attempts = 0;

    while (parent && attempts < 5) { // Look up 5 levels
        // Check for common drop zone indicators
        const role = parent.getAttribute('role');
        const text = parent.textContent?.toLowerCase() || '';
        const classes = parent.className.toLowerCase(); // Check generic class names

        if (
            role === 'presentation' || // Common in react-dropzone
            role === 'button' || // Sometimes the button itself is the target
            text.includes('drag') ||
            text.includes('drop') ||
            classes.includes('drop') ||
            classes.includes('upload') ||
            classes.includes('container') // Ashby uses _container_...
        ) {
            return parent;
        }

        parent = parent.parentElement;
        attempts++;
    }

    return null;
}


function scrapePageDetails() {
    // Helper to clean text
    const clean = (str: string | null | undefined) => str ? str.trim().replace(/\s+/g, ' ') : '';

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
        const scripts = document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const json = JSON.parse(script.textContent || '{}');
                if (json['@type'] === 'JobPosting' && json.hiringOrganization) {
                    company = json.hiringOrganization.name;
                    // Bonus: We can get description from here too!
                    if (!(window as any)._scrapedDescription && json.description) {
                        (window as any)._scrapedDescription = json.description.replace(/<[^>]*>?/gm, ''); // Strip HTML
                    }
                    break;
                }
            } catch (e) { }
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

    // 4. Get Location
    let location = '';
    // JSON-LD
    try {
        const scripts = document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const json = JSON.parse(script.textContent || '{}');
                if (json['@type'] === 'JobPosting' && json.jobLocation) {
                    const loc = json.jobLocation;
                    if (loc.address) {
                        // Handle both string and object address formats if needed, but schema.org usually is object
                        const parts: string[] = [];
                        if (loc.address.addressLocality) parts.push(loc.address.addressLocality);
                        if (loc.address.addressRegion) parts.push(loc.address.addressRegion);
                        if (parts.length > 0) location = parts.join(', ');
                    }
                    break;
                }
            } catch (e) { }
        }
    } catch (e) { }
    // Meta / Common
    if (!location) {
        const locEl = document.querySelector('[class*="location"], [class*="jobLocation"]') as HTMLElement;
        if (locEl) location = clean(locEl.innerText);
    }

    // 5. Get Salary
    let salary = '';
    // JSON-LD
    try {
        const scripts = document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const json = JSON.parse(script.textContent || '{}');
                if (json['@type'] === 'JobPosting' && json.baseSalary) {
                    const val = json.baseSalary.value;
                    if (val) {
                        salary = (val.minValue ? val.minValue + '-' + val.maxValue : val.value) + ' ' + (val.currency || '');
                    }
                    break;
                }
            } catch (e) { }
        }
    } catch (e) { }
    // Common
    if (!salary) {
        const salEl = document.querySelector('[class*="salary"], [class*="compensation"]') as HTMLElement;
        if (salEl) salary = clean(salEl.innerText);
    }

    // 3. Get Description
    let description = '';

    // Strategy A: User Selection (Highest Priority if deliberate)
    const selection = window.getSelection()?.toString();
    if (selection && selection.length > 50) {
        description = selection;
    }

    // Strategy B: Cached from JSON-LD
    if (!description && (window as any)._scrapedDescription) {
        description = (window as any)._scrapedDescription;
    }

    // Strategy C: Heuristic Selectors (Common job boards)
    if (!description) {
        const selectors = [
            // Indeed
            '#jobDescriptionText',
            '.jobsearch-jobDescriptionText',
            '.jobsearch-JobComponent-description',
            // LinkedIn
            '.jobs-description__content',
            '.jobs-box__html-content',
            '.description__text',
            '#job-details',
            '.show-more-less-html__markup', // LinkedIn typically uses this class for the description body
            // Glassdoor
            '[class*="JobDetails_jobDescription"]',
            '.jobDescriptionContent',
            '[data-test="jobDescription"]',
            // ZipRecruiter
            '.jobDescriptionSection',
            '.job_description',
            // Lever
            '[data-testid="jobDescription-container"]',
            '.posting-categories',
            '.section-wrapper',
            // Workday
            '[data-automation-id="jobPostingDescription"]',
            '.job-description-container',
            // Greenhouse
            '#content',
            '.job-post-description',
            '#job_description',
            // AngelList / Wellfound
            '.job-details',
            '[class*="styles_description"]',
            // SmartRecruiters
            '.job-sections',
            // Ashby
            '[class*="Ashby"]',
            '.ashby-job-posting-description',
            // Generic fallbacks
            '[data-test="job-description-text"]',
            '[id*="job_description"]',
            '[id*="job-description"]',
            '[class*="job-description"]',
            '[class*="jobDescription"]',
            '[class*="description"]',
            '#main',
            'article',
            'main'
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel) as HTMLElement;
            if (el && el.innerText.length > 100) {
                description = clean(el.innerText);
                break;
            }
        }
    }

    // Strategy D: Meta Description (Last resort)
    if (!description) {
        const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
        if (metaDesc) description = clean(metaDesc.content);
    }

    return {
        title,
        company,
        location,
        salary,
        description,
        url: window.location.href,
        status: 'new', // Default status for new scan
        postDate: new Date().toISOString()
    };
}
