// Content script for job page scraping and autofill
// This script is injected into job sites to extract job details and fill forms

import { defineContentScript } from 'wxt/utils/define-content-script';
import { ScoringEngine, FieldCategory } from '../services/autofill/scoring-engine';
import { AdapterManager } from '../services/autofill/site-adapters';

export default defineContentScript({
    matches: ['<all_urls>'],
    allFrames: true,
    main() {
        console.log('[JobSwyft] Content script loaded');

        // Listen for messages from the sidepanel
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'SCAN_PAGE') {
                console.log('[JobSwyft] Received SCAN_PAGE request');
                const data = scrapePageDetails();
                console.log('[JobSwyft] Scraped data:', data);
                if (data && data.title && data.description) {
                    sendResponse(data);
                } else {
                    sendResponse(null);
                }
            } else if (request.action === 'DETECT_FORM_FIELDS') {
                console.log('[JobSwyft] Detecting form fields');
                const fields = detectFormFields();
                console.log('[JobSwyft] Detected fields:', fields);
                sendResponse({ success: true, fields });
            } else if (request.action === 'START_INSPECTION') {
                startInspection();
                sendResponse({ success: true });
            } else if (request.action === 'STOP_INSPECTION') {
                stopInspection();
                sendResponse({ success: true });
            } else if (request.action === 'FILL_FORM_FIELDS') {
                console.log('[JobSwyft] Filling form fields:', request.fieldValues);
                const result = fillFormFields(request.fieldValues);
                sendResponse(result);
            }
            return true; // Keep channel open for async response
        });
    },
});

let isInspecting = false;
let inspectionOverlay: HTMLDivElement | null = null;
let lastHoveredElement: HTMLElement | null = null;
let ghostLabels: HTMLDivElement[] = [];
let quickPicker: HTMLDivElement | null = null;

const COMMON_CATEGORIES: { id: FieldCategory; label: string }[] = [
    { id: 'personal.firstName', label: 'First Name' },
    { id: 'personal.lastName', label: 'Last Name' },
    { id: 'personal.email', label: 'Email' },
    { id: 'personal.phone', label: 'Phone' },
    { id: 'personal.linkedin', label: 'LinkedIn' },
    { id: 'personal.portfolio', label: 'Portfolio' },
    { id: 'resume.upload', label: 'Resume' },
    { id: 'eeo.gender', label: 'Gender' },
    { id: 'eeo.race', label: 'Race/Ethnicity' },
    { id: 'eeo.veteran', label: 'Veteran Status' },
    { id: 'eeo.disability', label: 'Disability' }
];


function createInspectionOverlay() {
    if (inspectionOverlay) return;
    inspectionOverlay = document.createElement('div');
    inspectionOverlay.id = 'jobswyft-inspection-overlay';
    Object.assign(inspectionOverlay.style, {
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: '999999',
        border: '2px solid #10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: '4px',
        transition: 'all 0.1s ease-out',
        display: 'none'
    });
    document.body.appendChild(inspectionOverlay);
}

function startInspection() {
    isInspecting = true;
    createInspectionOverlay();
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mouseover', handleInspectionHover, true);
    document.addEventListener('click', handleInspectionClick, true);

    // Initial scan and tag everything
    const fields = detectFormFields();
    showGhostLabels(fields);

    console.log('[JobSwyft] Inspection mode started with ghost labels');
}

function stopInspection() {
    isInspecting = false;
    document.body.style.cursor = '';
    document.removeEventListener('mouseover', handleInspectionHover, true);
    document.removeEventListener('click', handleInspectionClick, true);
    window.removeEventListener('scroll', updateGhostLabelPositions);
    window.removeEventListener('resize', updateGhostLabelPositions);

    if (inspectionOverlay) {
        inspectionOverlay.style.display = 'none';
    }

    clearGhostLabels();
    hideQuickPicker();

    console.log('[JobSwyft] Inspection mode stopped');
}

function showGhostLabels(fields: DetectedField[]) {
    clearGhostLabels();

    fields.forEach(field => {
        const element = document.querySelector(field.selector) as HTMLElement;
        if (!element) return;

        const label = document.createElement('div');
        label.className = 'jobswyft-ghost-label';
        (label as any)._targetSelector = field.selector; // Store for repositioning

        const isLowConf = field.confidence === 'low' || field.category === 'questions';

        Object.assign(label.style, {
            position: 'absolute',
            backgroundColor: isLowConf ? '#6366f1' : '#10b981', // Indigo for questions, Emerald for confirmed
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            lineHeight: '1',
            fontWeight: 'bold',
            zIndex: '999998',
            pointerEvents: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(255,255,255,0.2)',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: '1'
        });

        label.textContent = isLowConf ? `? ${field.label}` : `✓ ${field.label}`;
        document.body.appendChild(label);
        ghostLabels.push(label);
    });

    updateGhostLabelPositions();
    window.addEventListener('scroll', updateGhostLabelPositions, { passive: true });
    window.addEventListener('resize', updateGhostLabelPositions, { passive: true });
}

function updateGhostLabelPositions() {
    ghostLabels.forEach(label => {
        const selector = (label as any)._targetSelector;
        const target = document.querySelector(selector) as HTMLElement;
        if (!target) {
            label.style.display = 'none';
            return;
        }

        const rect = target.getBoundingClientRect();
        // Check if visible in viewport
        if (rect.top < 0 || rect.left < 0 || rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
            // Optional: Dim or hide labels out of view? 
            // For now, keep them positioned
        }

        label.style.top = `${rect.top + window.scrollY - 20}px`;
        label.style.left = `${rect.left + window.scrollX}px`;
        label.style.display = 'block';
    });
}

function clearGhostLabels() {
    ghostLabels.forEach(l => l.remove());
    ghostLabels = [];
}

function updateGhostLabel(selector: string, labelText: string) {
    const label = ghostLabels.find(l => (l as any)._targetSelector === selector);
    if (label) {
        label.textContent = `✓ ${labelText}`;
        label.style.backgroundColor = '#10b981'; // Emerald
        label.style.transform = 'scale(1.05)';
        label.style.zIndex = '999999';
        setTimeout(() => {
            if (label) label.style.transform = 'scale(1)';
        }, 200);
    }
}

function showQuickPicker(target: HTMLElement, field: any) {
    hideQuickPicker();

    quickPicker = document.createElement('div');
    quickPicker.id = 'jobswyft-quick-picker';
    const rect = target.getBoundingClientRect();

    Object.assign(quickPicker.style, {
        position: 'absolute',
        top: `${rect.bottom + window.scrollY + 8}px`,
        left: `${rect.left + window.scrollX}px`,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        zIndex: '1000000',
        padding: '6px',
        minWidth: '180px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        maxHeight: '320px',
        overflowY: 'auto',
        animation: 'jobswyft-fade-in 0.2s ease-out'
    });

    const header = document.createElement('div');
    header.textContent = 'Map Field To:';
    Object.assign(header.style, {
        fontSize: '11px',
        fontWeight: '800',
        color: '#94a3b8',
        padding: '8px 10px 4px 10px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    });
    quickPicker.appendChild(header);

    COMMON_CATEGORIES.forEach(cat => {
        const item = document.createElement('div');
        item.textContent = cat.label;
        Object.assign(item.style, {
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            borderRadius: '8px',
            color: '#334155',
            transition: 'all 0.15s ease'
        });

        item.onmouseover = () => {
            item.style.backgroundColor = '#f1f5f9';
            item.style.color = '#10b981';
            item.style.paddingLeft = '14px';
        };
        item.onmouseout = () => {
            item.style.backgroundColor = 'transparent';
            item.style.color = '#334155';
            item.style.paddingLeft = '12px';
        };
        item.onclick = (e) => {
            e.stopPropagation();

            // 1. Update visual feedback immediately
            updateGhostLabel(field.selector, cat.label);

            // 2. Send message to sidepanel
            chrome.runtime.sendMessage({
                action: 'FIELD_MAPPED',
                field: { ...field, category: mapToLegacyCategory(cat.id as any), specificCategory: cat.id },
                category: cat.id
            });

            // 3. Hide picker immediately, but wait a bit to stop inspection
            // so the user can see the updated "✓" label
            hideQuickPicker();
            setTimeout(() => {
                stopInspection();
            }, 1000);
        };

        quickPicker?.appendChild(item);
    });

    document.body.appendChild(quickPicker);
}

function hideQuickPicker() {
    if (quickPicker) {
        quickPicker.remove();
        quickPicker = null;
    }
}

function handleInspectionHover(e: MouseEvent) {
    if (!isInspecting || !inspectionOverlay) return;
    const target = e.target as HTMLElement;

    // Only highlight inputs, textareas, selects
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        const rect = target.getBoundingClientRect();
        Object.assign(inspectionOverlay.style, {
            top: `${rect.top + window.scrollY}px`,
            left: `${rect.left + window.scrollX}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            display: 'block'
        });
        lastHoveredElement = target;
    } else {
        inspectionOverlay.style.display = 'none';
    }
}

function handleInspectionClick(e: MouseEvent) {
    if (!isInspecting) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        const selector = getCssSelector(target);
        const fieldData = {
            id: target.id || (target as any).name || `field_${btoa(selector).substring(0, 12)}`,
            selector,
            label: (target as any).name || (target as any).placeholder || "Selected Field",
            type: (target as HTMLInputElement).type || target.tagName.toLowerCase()
        };

        showQuickPicker(target, fieldData);
    } else {
        hideQuickPicker();
    }
}

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
/**
 * Detect fillable form fields on the page using Site Adapters and Scoring Engine
 */
function detectFormFields(): DetectedField[] {
    const fields: DetectedField[] = [];
    const processedElements = new Set<HTMLElement>();
    const adapter = AdapterManager.getAdapterForUrl(window.location.href);
    const jobBoard = adapter ? adapter.name : 'Unknown';

    // 1. Try Site Adapters first (The "Driver" approach)
    if (adapter) {
        console.log(`[JobSwyft] Using site adapter: ${adapter.name}`);
        for (const [categoryString, selector] of Object.entries(adapter.selectors)) {
            const category = categoryString as FieldCategory;
            if (!selector) continue;

            const element = document.querySelector(selector) as HTMLElement;
            if (element && !processedElements.has(element)) {
                // Ensure stable, unique ID
                // 1. DOM ID
                // 2. Name attribute
                // 3. Deterministic path/selector hash (V4 Improvement)
                const id = element.id || (element as any).name || `field_${btoa(selector).substring(0, 16).replace(/[/+=]/g, '')}`;

                // Try to get a human-readable label
                let label = '';
                if (element.id) {
                    const labelEl = document.querySelector(`label[for="${element.id}"]`);
                    if (labelEl) label = labelEl.textContent?.trim() || '';
                }
                if (!label) label = (element as any).placeholder || element.getAttribute('aria-label') || '';
                if (!label) {
                    // Fallback to prettified category name (e.g. personal.firstName -> First Name)
                    label = category.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || category;
                    label = label.charAt(0).toUpperCase() + label.slice(1);
                }

                fields.push({
                    id,
                    selector,
                    label, // Use human-readable label
                    type: (element as HTMLInputElement).type || element.tagName.toLowerCase(),
                    currentValue: (element as HTMLInputElement).value || '',
                    category: mapToLegacyCategory(category),
                    confidence: 'high',
                    jobBoard
                });
                processedElements.add(element);
            }
        }
    }

    // 2. Fallback to Scoring Engine for remaining fields
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
    inputs.forEach((input: any) => {
        if (processedElements.has(input)) return;
        if (input.type === 'hidden' || input.style.display === 'none') {
            // Skip hidden unless it's a file input, which we might need to score as resume upload
            if (input.type !== 'file') return;
        }

        const score = ScoringEngine.scoreField(input as HTMLElement);

        if (score) {
            // High/Medium confidence match
            const selector = getCssSelector(input);
            fields.push({
                id: input.id || (input as any).name || `field_${btoa(selector).substring(0, 16).replace(/[/+=]/g, '')}`,
                selector,
                label: score.labelText || (input as any).name || (input as any).placeholder || "Field",
                type: input.type || input.tagName.toLowerCase(),
                currentValue: input.value || '',
                category: mapToLegacyCategory(score.category as FieldCategory),
                specificCategory: score.category,
                confidence: score.confidence,
                jobBoard
            });
        } else {
            // No heuristic match -> Treat as a generic "Question"
            // We want to capture these so the user can manually fill or map them

            // NEW: Only detect generic questions if they are text box inputs
            if (!isTextBoxInput(input)) {
                processedElements.add(input);
                return;
            }

            const selector = getCssSelector(input);
            const id = input.id || (input as any).name || `field_${btoa(selector).substring(0, 16).replace(/[/+=]/g, '')}`;

            // Try to extract a label for this unknown field
            let label = '';
            if (input.id) {
                const labelEl = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
                if (labelEl) label = labelEl.textContent?.trim() || '';
            }
            if (!label) {
                const parentLabel = input.closest('label');
                if (parentLabel) label = parentLabel.textContent?.trim() || '';
            }
            if (!label) label = (input as any).placeholder || input.getAttribute('aria-label') || (input as any).name || "Question";

            fields.push({
                id,
                selector,
                label,
                type: input.type || input.tagName.toLowerCase(),
                currentValue: input.value || '',
                category: "questions", // Explicitly categorize as question
                confidence: 'low',
                jobBoard
            });
        }
        processedElements.add(input);
    });

    return fields;
}

/**
 * Helper to determine if an element is a "text box" input
 */
function isTextBoxInput(el: HTMLElement): boolean {
    const tagName = el.tagName.toLowerCase();
    if (tagName === 'textarea') return true;
    if (tagName === 'input') {
        const type = (el as HTMLInputElement).type.toLowerCase();
        // Standard text-based types
        return [
            'text',
            'email',
            'tel',
            'url',
            'number',
            'password',
            'search'
        ].includes(type) || !type; // Treat missing type as text
    }
    return false;
}

// Helper to map new granular categories to the legacy categories used by AutofillTab
function mapToLegacyCategory(newCategory: FieldCategory): 'personal' | 'resume' | 'questions' | 'eeo' {
    if (newCategory.startsWith('personal')) return 'personal';
    if (newCategory.startsWith('resume') || newCategory.startsWith('coverLetter')) return 'resume';
    if (newCategory.startsWith('eeo')) return 'eeo';
    return 'questions';
}

// Helper to generate a unique selector
const getCssSelector = (el: HTMLElement): string => {
    if (el.id) return `#${CSS.escape(el.id)}`;
    if ((el as any).name) return `[name="${CSS.escape((el as any).name)}"]`;

    // Positional fallback for stability
    const tag = el.tagName.toLowerCase();
    const parent = el.parentElement;
    if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
        if (siblings.length > 1) {
            const index = siblings.indexOf(el) + 1;
            return `${tag}:nth-of-type(${index})`;
        }
    }

    return tag;
};

// Define DetectedField type locally if not imported, or match existing
interface DetectedField {
    id: string;
    selector: string;
    label: string;
    type: string;
    currentValue: string;
    category: 'personal' | 'gender' | 'sponsorship' | 'authorization' | 'questions' | 'eeo' | 'resume';
    specificCategory?: string;
    confidence?: 'high' | 'medium' | 'low';
    jobBoard: string;
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
