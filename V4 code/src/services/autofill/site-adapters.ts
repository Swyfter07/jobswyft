
import { FieldCategory } from './scoring-engine';

export interface SiteAdapter {
    id: string;
    name: string;
    domains: string[];
    selectors: Record<FieldCategory, string>;
    // Optional: Custom logic for complex fields
    customFill?: (category: FieldCategory, value: any) => Promise<boolean>;
}

export const GREENHOUSE_ADAPTER: SiteAdapter = {
    id: 'greenhouse',
    name: 'Greenhouse',
    domains: ['boards.greenhouse.io', 'boards.eu.greenhouse.io'],
    selectors: {
        'personal.firstName': '#first_name',
        'personal.lastName': '#last_name',
        'personal.email': '#email',
        'personal.phone': '#phone',
        'personal.linkedin': '#job_application_answers_attributes_2_text_value', // specialized, might vary
        'personal.portfolio': '#job_application_answers_attributes_3_text_value',
        'experience.company': '', // Usually parsed from resume
        'experience.title': '',
        'education.school': '',
        'resume.upload': 'div[data-ui="resume-upload"] input[type="file"], #resume_fieldset input[type="file"]',
        'coverLetter.upload': '#cover_letter_fieldset input[type="file"]',
        'eeo.gender': '#job_application_gender',
        'eeo.race': '#job_application_race',
        'eeo.veteran': '#job_application_veteran_status',
        'eeo.disability': '#job_application_disability_status'
    }
};

export const LEVER_ADAPTER: SiteAdapter = {
    id: 'lever',
    name: 'Lever',
    domains: ['jobs.lever.co'],
    selectors: {
        'personal.firstName': 'input[name="name"]', // often full name field
        'personal.lastName': '',
        'personal.email': 'input[name="email"]',
        'personal.phone': 'input[name="phone"]',
        'personal.linkedin': 'input[name="urls[LinkedIn]"]',
        'personal.portfolio': 'input[name="urls[Portfolio]"]',
        'experience.company': '',
        'experience.title': '',
        'education.school': '',
        'resume.upload': 'input[name="resume"]',
        'coverLetter.upload': 'textarea[name="comments"]', // often just a text area
        'eeo.gender': 'select[name="gender"]',
        'eeo.race': 'select[name="race"]',
        'eeo.veteran': 'select[name="veteranStatus"]',
        'eeo.disability': 'select[name="disability"]'
    }
};

export const ADAPTERS: SiteAdapter[] = [
    GREENHOUSE_ADAPTER,
    LEVER_ADAPTER
];

export class AdapterManager {
    static getAdapterForUrl(url: string): SiteAdapter | null {
        try {
            const hostname = new URL(url).hostname;
            return ADAPTERS.find(adapter =>
                adapter.domains.some(domain => hostname.includes(domain))
            ) || null;
        } catch {
            return null;
        }
    }

    static getSelector(adapter: SiteAdapter, category: FieldCategory): string | null {
        return adapter.selectors[category] || null;
    }
}
