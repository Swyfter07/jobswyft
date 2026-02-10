
export interface ResumeProfile {
    summary: string;
    skills: string[];
    experience: any[];
    education: any[];
    projects: any[];
    personal_info?: any;
}

export function parseResumeToProfile(text: string): ResumeProfile {
    const profile: ResumeProfile = {
        summary: "",
        skills: [],
        experience: [],
        education: [],
        projects: []
    };

    // Helper to find section start
    const findSection = (headers: string[]) => {
        for (const h of headers) {
            const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
            const match = text.match(regex);
            if (match && match.index !== undefined) return match.index;
        }
        return -1;
    };

    const expHeaders = ['EXPERIENCE', 'WORK EXPERIENCE', 'WORK HISTORY', 'PROFESSIONAL EXPERIENCE'];
    const eduHeaders = ['EDUCATION', 'ACADEMIC HISTORY', 'EDUCATION & CREDENTIALS'];
    const skillHeaders = ['SKILLS', 'TECHNICAL SKILLS'];
    const projectHeaders = ['PROJECTS'];

    const expStart = findSection(expHeaders);
    const eduStart = findSection(eduHeaders);

    // 1. Parse Summary (Everything before first major section)
    let firstSectionIndex = Math.min(...[expStart, eduStart].filter(i => i !== -1));
    if (firstSectionIndex === Infinity) firstSectionIndex = text.length;

    if (firstSectionIndex > 0) {
        // cleanup generic headers like "SUMMARY"
        let summaryRaw = text.substring(0, firstSectionIndex).trim();
        summaryRaw = summaryRaw.replace(/^(SUMMARY|PROFILE|OBJECTIVE)\s*/i, '');
        // Simple cleanup of name/contact info (heuristic: remove first few short lines)
        const lines = summaryRaw.split('\n');
        // heuristic: usually summary is the long paragraph.
        const longLines = lines.filter(l => l.length > 50);
        if (longLines.length > 0) {
            profile.summary = longLines.join('\n');
        } else {
            profile.summary = lines.slice(-3).join('\n'); // fallback
        }
    }

    // 2. Parse Experience
    if (expStart !== -1) {
        // Find end of experience (next section)
        // We search for Edu, Skills, Projects appearing AFTER experience
        const nextSections = [eduHeaders, skillHeaders, projectHeaders];
        let expEnd = text.length;

        for (const headers of nextSections) {
            for (const h of headers) {
                const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
                // Find match AFTER expStart
                const match = text.slice(expStart + 10).match(regex);
                if (match && match.index !== undefined) {
                    const absoluteIndex = expStart + 10 + match.index;
                    if (absoluteIndex < expEnd) expEnd = absoluteIndex;
                }
            }
        }

        const expText = text.substring(expStart, expEnd).replace(new RegExp(`^ (${expHeaders.join('|')})`, 'i'), '');
        profile.experience = parseJobs(expText);
    }

    // 3. Parse Education
    if (eduStart !== -1) {
        let eduEnd = text.length;
        // logic similar to experience end finding could go here, for now assume it goes to end or until skills
        for (const h of skillHeaders) {
            const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
            const match = text.slice(eduStart + 10).match(regex);
            if (match && match.index !== undefined) {
                const absoluteIndex = eduStart + 10 + match.index;
                if (absoluteIndex < eduEnd) eduEnd = absoluteIndex;
            }
        }

        const eduText = text.substring(eduStart, eduEnd).replace(new RegExp(`^ (${eduHeaders.join('|')})`, 'i'), '');
        profile.education = parseEducation(eduText);
    }

    // 4. Parse Skills
    const skillStart = findSection(skillHeaders);
    if (skillStart !== -1) {
        // Find end of skills section
        let skillEnd = text.length;
        const afterSkillSections = [projectHeaders, ['CERTIFICATIONS', 'AWARDS', 'REFERENCES']];

        for (const headers of afterSkillSections) {
            for (const h of headers) {
                const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
                const match = text.slice(skillStart + 10).match(regex);
                if (match && match.index !== undefined) {
                    const absoluteIndex = skillStart + 10 + match.index;
                    if (absoluteIndex < skillEnd) skillEnd = absoluteIndex;
                }
            }
        }

        const skillText = text.substring(skillStart, skillEnd)
            .replace(new RegExp(`^\\s*(${skillHeaders.join('|')})\\s*`, 'i'), '');

        // Parse skills - split by common delimiters
        const skillArray = skillText
            .split(/[,•·|●\n]+/)
            .map(s => s.trim())
            .filter(s => s.length > 1 && s.length < 50 && !/^\d+$/.test(s));

        profile.skills = skillArray;
    }

    return profile;
}

function parseJobs(text: string) {
    const jobs = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let currentJob: any = null;

    // Common Date Regex
    const dateLineRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:\d{1,2}\/\d{4})|(?:\d{4}))\s*(?:-|–|to)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current|Now|(?:\d{1,2}\/\d{4})|(?:\d{4}))/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (dateLineRegex.test(line)) {
            if (currentJob) jobs.push(currentJob);

            let title = "Title";
            let company = "Company";

            if (i > 0) title = lines[i - 1];
            if (i > 1) company = lines[i - 2];

            if (/Inc|LLC|Ltd|Corp|University|College|Solutions|Systems/i.test(title)) {
                const temp = title;
                title = company;
                company = temp;
            }

            // If company looks like a bullet point or empty, fallback
            if (company.length < 2) company = "Company";

            currentJob = {
                title: title,
                company: company,
                dates: line,
                description: ""
            };
        } else {
            if (currentJob) {
                currentJob.description += line + "\n";
            }
        }
    }
    if (currentJob) jobs.push(currentJob);
    return jobs;
}

function parseEducation(text: string) {
    const schools = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Naive education parser
    for (const line of lines) {
        if (/University|College|School|Institute/i.test(line)) {
            schools.push({
                school: line,
                degree: "",
                dates: ""
            });
        }
    }
    return schools;
}

export function extractPersonalInfo(text: string) {
    const info: any = {};

    // Email regex
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) info.email = emailMatch[0];

    // Phone regex (various formats)
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    // LinkedIn URL
    const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/profile\/)[a-zA-Z0-9-]+/i);
    if (linkedinMatch) info.linkedin = 'https://' + linkedinMatch[0];

    // Portfolio/Website (generic URL not linkedin/email)
    const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g);
    if (urlMatch) {
        const portfolio = urlMatch.find(u => !u.includes('linkedin') && !u.includes('@'));
        if (portfolio) info.portfolio = portfolio.startsWith('http') ? portfolio : 'https://' + portfolio;
    }

    // Name - usually first non-empty line that's not a contact detail
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    for (const line of lines.slice(0, 5)) {
        if (/@|linkedin|http|www\.|^\+?\d{10,}/.test(line)) continue;
        if (line.length > 40) continue;
        info.name = line;
        break;
    }

    return info;
}
