
export interface FieldScore {
    fieldId: string;
    score: number;
    confidence: 'high' | 'medium' | 'low';
    category: string;
    matchedBy: string[]; // e.g., ['label', 'placeholder']
    labelText: string;
}

export type FieldCategory =
    | 'personal.firstName'
    | 'personal.lastName'
    | 'personal.email'
    | 'personal.phone'
    | 'personal.linkedin'
    | 'personal.portfolio'
    | 'experience.company'
    | 'experience.title'
    | 'education.school'
    | 'resume.upload'
    | 'coverLetter.upload'
    | 'eeo.gender'
    | 'eeo.race'
    | 'eeo.veteran'
    | 'eeo.disability';

const CATEGORY_KEYWORDS: Record<FieldCategory, string[]> = {
    'personal.firstName': ['first name', 'given name', 'fname'],
    'personal.lastName': ['last name', 'surname', 'lname', 'family name'],
    'personal.email': ['email', 'e-mail', 'mail'],
    'personal.phone': ['phone', 'mobile', 'cell', 'contact number'],
    'personal.linkedin': ['linkedin', 'linked in'],
    'personal.portfolio': ['portfolio', 'website', 'personal site', 'github'],
    'experience.company': ['company', 'employer', 'organization'],
    'experience.title': ['job title', 'position', 'role'],
    'education.school': ['school', 'university', 'college', 'institution'],
    'resume.upload': ['resume', 'cv', 'curriculum vitae'],
    'coverLetter.upload': ['cover letter'],
    'eeo.gender': ['gender', 'sex', 'identify as'],
    'eeo.race': ['race', 'ethnicity'],
    'eeo.veteran': ['veteran', 'military'],
    'eeo.disability': ['disability', 'handicap']
};

export class ScoringEngine {

    static scoreField(element: HTMLElement): FieldScore | null {
        let bestMatch: FieldScore | null = null;
        let maxScore = 0;

        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            const { score, reasons } = this.calculateScore(element, keywords);

            if (score > maxScore && score > 0.4) { // Minimum threshold
                maxScore = score;
                bestMatch = {
                    fieldId: element.id || (element as any).name || '',
                    score,
                    confidence: score > 0.8 ? 'high' : score > 0.6 ? 'medium' : 'low',
                    category,
                    matchedBy: reasons,
                    labelText: this.getLabelText(element) || (element as any).placeholder || ''
                };
            }
        }

        return bestMatch;
    }

    private static calculateScore(element: HTMLElement, keywords: string[]): { score: number, reasons: string[] } {
        let score = 0;
        const reasons: string[] = [];

        // 1. Check ID and Name (High Value)
        const id = element.id?.toLowerCase() || '';
        const name = (element as any).name?.toLowerCase() || '';

        if (this.matchesAny(id, keywords)) {
            score += 0.5;
            reasons.push('id');
        }
        if (this.matchesAny(name, keywords)) {
            score += 0.5;
            reasons.push('name');
        }

        // 2. Check Label (High Value)
        const label = this.getLabelText(element).toLowerCase();
        if (this.matchesAny(label, keywords)) {
            score += 0.6; // Labels are very strong signals
            reasons.push('label');
        }

        // 3. Check Placeholder (Medium Value)
        const placeholder = (element as any).placeholder?.toLowerCase() || '';
        if (this.matchesAny(placeholder, keywords)) {
            score += 0.3;
            reasons.push('placeholder');
        }

        // 4. Check Aria Label (High Value)
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        if (this.matchesAny(ariaLabel, keywords)) {
            score += 0.5;
            reasons.push('aria-label');
        }

        // Cap score at 1.0
        return { score: Math.min(score, 1.0), reasons };
    }

    private static matchesAny(text: string, keywords: string[]): boolean {
        return keywords.some(keyword => text.includes(keyword));
    }

    private static getLabelText(element: HTMLElement): string {
        // 1. explicit label
        if (element.id) {
            const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
            if (label) return label.textContent || '';
        }

        // 2. implicit label (wrapping)
        const parentLabel = element.closest('label');
        if (parentLabel) return parentLabel.textContent || '';

        // 3. preceding text (heuristics)
        // slightly dangerous, could pick up unrelated text. safer to trust explicit links first.
        return '';
    }
}
