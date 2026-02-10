// Ported from JobSwyft V1 sidepanel.js

export function fillForm(data: any): number {
    let filledCount = 0;

    // ========== TIER 2: ATS-SPECIFIC SELECTORS ==========
    const atsSelectors: Record<string, Record<string, string>> = {
        // Lever
        lever: {
            firstName: '[name="cards[eeec0675-db6d-4a4c-b8ca-0f3da3240ade][field0]"], [data-qa="first-name-input"], input[name*="firstName"]',
            lastName: '[name="cards[eeec0675-db6d-4a4c-b8ca-0f3da3240ade][field1]"], [data-qa="last-name-input"], input[name*="lastName"]',
            email: '[data-qa="email-input"], input[name*="email"]',
            phone: '[data-qa="phone-input"], input[name*="phone"]',
            linkedin: '[name*="linkedin"], [name*="urls[LinkedIn]"]',
            website: '[name*="portfolio"], [name*="urls[Portfolio]"], [name*="urls[GitHub]"]'
        },
        // Workday
        workday: {
            firstName: '[data-automation-id="legalNameSection_firstName"], [data-automation-id="firstName"]',
            lastName: '[data-automation-id="legalNameSection_lastName"], [data-automation-id="lastName"]',
            email: '[data-automation-id="email"], [data-automation-id="addressSection_email"]',
            phone: '[data-automation-id="phone-number"], [data-automation-id="phone"]'
        },
        // Greenhouse
        greenhouse: {
            firstName: '#first_name, [name="job_application[first_name]"]',
            lastName: '#last_name, [name="job_application[last_name]"]',
            email: '#email, [name="job_application[email]"]',
            phone: '#phone, [name="job_application[phone]"]',
            linkedin: '[name="job_application[question_id][linkedin_url]"]'
        },
        // SmartRecruiters
        smartrecruiters: {
            firstName: '[name="firstName"], [id*="firstName"]',
            lastName: '[name="lastName"], [id*="lastName"]',
            email: '[name="email"], [type="email"]',
            phone: '[name="phoneNumber"], [id*="phone"]'
        },
        // ICIMS
        icims: {
            firstName: '[id*="firstName"], [name*="firstName"]',
            lastName: '[id*="lastName"], [name*="lastName"]',
            email: '[id*="email"], [type="email"]',
            phone: '[id*="phone"], [name*="phone"]'
        }
    };

    // ========== TIER 1: ATTRIBUTE PATTERNS ==========
    const fieldMappings = [
        { patterns: ['firstname', 'first_name', 'fname', 'givenname', 'first-name'], key: 'firstName' },
        { patterns: ['lastname', 'last_name', 'lname', 'familyname', 'surname', 'last-name'], key: 'lastName' },
        { patterns: ['fullname', 'full_name', 'legalname', 'candidatename'], key: 'name' },
        { patterns: ['linkedin', 'linkedinprofile', 'linkedinurl'], key: 'linkedin' },
        { patterns: ['portfolio', 'website', 'github', 'personalsite', 'personalurl'], key: 'website' },
        { patterns: ['phone', 'phonenumber', 'telephone', 'mobile', 'cell'], key: 'phone' },
        { patterns: ['summary', 'coverletter', 'aboutyou', 'professionalprofile', 'bio'], key: 'summary' },
        { patterns: ['jobtitle', 'currenttitle', 'position', 'title'], key: 'currentTitle' },
        { patterns: ['company', 'employer', 'currentcompany', 'organization'], key: 'currentCompany' },
        { patterns: ['school', 'university', 'college', 'institution', 'almamater'], key: 'school' },
        { patterns: ['degree', 'education', 'major', 'fieldofstudy'], key: 'degree' },
        { patterns: ['city', 'location', 'currentlocation'], key: 'city' },
        { patterns: ['address', 'street', 'streetaddress'], key: 'address' }
    ];

    // ========== HELPER: Get all inputs including Shadow DOM ==========
    function getAllInputs(root: Document | ShadowRoot = document): (HTMLInputElement | HTMLTextAreaElement)[] {
        const inputs: (HTMLInputElement | HTMLTextAreaElement)[] = [];
        const selector = 'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input:not([type]), textarea';

        // Regular DOM
        inputs.push(...Array.from(root.querySelectorAll(selector)) as (HTMLInputElement | HTMLTextAreaElement)[]);

        // Pierce Shadow DOM
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                inputs.push(...getAllInputs(el.shadowRoot));
            }
        });

        return inputs;
    }

    // ========== HELPER: Fill field with proper event simulation ==========
    function fillField(field: HTMLInputElement | HTMLTextAreaElement, value: string): boolean {
        if (!value) return false;

        // Skip if already filled
        const currentValue = field.value || field.textContent || '';
        if (currentValue.trim()) return false;

        // Focus first
        field.focus();
        field.click();

        // Handle contenteditable
        if (field.getAttribute('contenteditable') === 'true') {
            field.textContent = value;
            field.innerHTML = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }

        // Use native setter for React/Angular/Vue compatibility
        const proto = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

        if (setter) {
            setter.call(field, value);
        } else {
            field.value = value;
        }

        // Reset React 16+ value tracker before dispatching events
        // @ts-ignore
        if (field._valueTracker) {
            // @ts-ignore
            field._valueTracker.setValue('');
        }

        // Dispatch full event sequence
        field.dispatchEvent(new Event('focus', { bubbles: true }));
        field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
        field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
        field.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'a' }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));

        // Double-tap input for stubborn frameworks
        field.dispatchEvent(new Event('input', { bubbles: true }));

        return true;
    }

    // ========== HELPER: Get field context for matching ==========
    function getFieldContext(field: HTMLInputElement | HTMLTextAreaElement): string {
        let context = '';

        // Direct attributes (highest confidence)
        context += (field.name || '') + ' ';
        context += (field.id || '') + ' ';
        context += (field.placeholder || '') + ' ';
        context += (field.getAttribute('autocomplete') || '') + ' ';
        context += (field.getAttribute('data-testid') || '') + ' ';
        context += (field.getAttribute('data-automation-id') || '') + ' ';
        context += (field.getAttribute('aria-label') || '') + ' ';
        context += (field.getAttribute('data-qa') || '') + ' ';

        // Associated label
        if (field.id) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) context += label.textContent + ' ';
        }

        // Immediate parent label
        const parent = field.parentElement;
        if (parent) {
            const label = parent.querySelector('label');
            if (label && !label.contains(field)) context += label.textContent + ' ';
        }

        return context.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // ========== HELPER: Match context against patterns ==========
    function matchesPattern(context: string, patterns: string[]): boolean {
        return patterns.some(p => context.includes(p.replace(/[^a-z0-9]/g, '')));
    }

    // ========== STEP 1: Try ATS-Specific Selectors First ==========
    for (const [atsName, selectors] of Object.entries(atsSelectors)) {
        for (const [fieldKey, selector] of Object.entries(selectors)) {
            if (!data[fieldKey]) continue;

            try {
                const fields = document.querySelectorAll(selector);
                fields.forEach(field => {
                    if (fillField(field as HTMLInputElement, data[fieldKey])) {
                        filledCount++;
                        // console.log(`[JobSwyft] ATS(${atsName}): Filled ${fieldKey} `);
                    }
                });
            } catch (e) { /* Invalid selector */ }
        }
    }

    // ========== STEP 2: Fill by HTML Input Type ==========
    const allInputs = getAllInputs();

    allInputs.forEach(field => {
        // Skip hidden, disabled, readonly, or already filled
        if (field.type === 'hidden' || field.disabled || field.readOnly) return;
        if (field.offsetParent === null && !field.closest('[class*="modal"]')) return;
        if ((field.value || '').trim()) return;

        // Type-based filling (most reliable)
        if (field.type === 'email' && data.email) {
            if (fillField(field, data.email)) {
                filledCount++;
            }
            return;
        }
        if (field.type === 'tel' && data.phone) {
            if (fillField(field, data.phone)) {
                filledCount++;
            }
            return;
        }
    });

    // ========== STEP 3: Fill by Attribute Pattern Matching ==========
    allInputs.forEach(field => {
        if (field.type === 'hidden' || field.disabled || field.readOnly) return;
        if ((field.value || '').trim()) return;

        const context = getFieldContext(field);

        for (const mapping of fieldMappings) {
            if (matchesPattern(context, mapping.patterns) && data[mapping.key]) {
                if (fillField(field, data[mapping.key])) {
                    filledCount++;
                    break;
                }
            }
        }
    });

    return filledCount;
}

