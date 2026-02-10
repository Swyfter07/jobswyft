import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - Worker URL handling
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { openAIService } from './openai';
import { AI_PROMPTS } from './ai-prompts';
import { ResumeData, Resume, ResumeExperienceEntry, ResumeEducationEntry, ResumeProjectEntry } from '@/types';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const resumeParserService = {
    /**
     * Parse a resume PDF file
     * Returns a Resume object with extracted text and structured data
     */
    async parseResume(file: File, apiKey: string | null, model: string = 'gpt-4o-mini'): Promise<Partial<Resume>> {
        console.log('Starting resume parse...', apiKey ? 'With AI' : 'Regex Fallback');
        try {
            // 1. Extract Text from PDF
            console.log('Converting file to ArrayBuffer...');
            const arrayBuffer = await file.arrayBuffer();
            console.log('Loading PDF document...');
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            console.log('PDF Loaded, pages:', pdf.numPages);

            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join('\n');
                fullText += pageText + '\n\n';
            }

            // 1.5 Extract Hyperlinks (LinkedIn, Portfolio)
            console.log('Extracting hyperlinks from PDF annotations...');
            const annotationLinks = await extractLinksFromPDF(pdf);

            // 1.6 Extract Hyperlinks from Text (Fallback)
            const textLinks = extractLinksFromText(fullText);
            const allLinks = [...new Set([...annotationLinks, ...textLinks])];

            const linkedinUrl = allLinks.find(l => /linkedin\.com/i.test(l));
            const portfolioUrl = allLinks.find(l => !/linkedin\.com/i.test(l) && /github\.com|gitlab\.com|behance\.net|dribbble\.com|[a-zA-Z0-9-]+\.(com|net|io|me|dev)/i.test(l));

            // 2. Parse Data (AI or Regex)
            let profile: ResumeData;

            // Always extract basic info via Regex first (as fallback or baseline)
            const regexProfile = parseResumeToProfile(fullText);

            if (apiKey) {
                try {
                    console.log('Parsing with AI...');
                    profile = await parseResumeWithAI(fullText, apiKey, model);

                    // Ensure ID and fileName are set, as AI might not return them or return new ones
                    // Ensure ID and fileName are set, as AI might not return them or return new ones
                    profile.id = profile.id || crypto.randomUUID();
                    profile.fileName = profile.fileName || file.name;

                    // Fallback or Merge Hyperlinks if AI missed them
                    if (!profile.personalInfo) profile.personalInfo = { fullName: '', email: '', phone: '', location: '' };
                    if (!profile.personalInfo.linkedin && linkedinUrl) profile.personalInfo.linkedin = linkedinUrl;
                    if (!profile.personalInfo.website && portfolioUrl) profile.personalInfo.website = portfolioUrl;

                    // Fallback to regex values if AI returns empty critical fields?
                    if (!profile.personalInfo.fullName) profile.personalInfo.fullName = regexProfile.personalInfo.fullName;
                    if (!profile.personalInfo?.email) profile.personalInfo.email = regexProfile.personalInfo.email;

                } catch (error) {
                    console.error('AI Parsing failed, falling back to regex:', error);
                    profile = regexProfile;
                }
            } else {
                console.log('Parsing with Regex (No API Key)...');
                console.log('Parsing with Regex (No API Key)...');
                profile = regexProfile;
                if (!profile.personalInfo.linkedin && linkedinUrl) profile.personalInfo.linkedin = linkedinUrl;
                if (!profile.personalInfo.website && portfolioUrl) profile.personalInfo.website = portfolioUrl;
                // Artificial delay for UX
                await new Promise(r => setTimeout(r, 800));
            }

            // Return partial Resume object
            return {
                id: profile.id, // Ensure ID is propagated
                fileName: file.name,
                content: fullText,
                data: profile,
                timestamp: new Date().toISOString() // Use ISO string for consistency
            };
        } catch (error) {
            console.error('Fatal error in parseResume:', error);
            throw error;
        }
    }
};

/**
 * Extract hyperlinks from PDF annotations
 */
async function extractLinksFromPDF(pdf: any): Promise<string[]> {
    const links: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const annotations = await page.getAnnotations();
        annotations.forEach((annotation: any) => {
            if (annotation.url) {
                links.push(annotation.url);
            }
        });
    }
    return [...new Set(links)]; // Deduplicate
}

/**
 * Extract links from plain text
 */
function extractLinksFromText(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io|me|dev)\/[^\s]+)/g;
    const matches = text.match(urlRegex) || [];
    return matches.map(url => {
        let cleanUrl = url.replace(/[).,;]+$/, ''); // Remove trailing punctuation
        if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = 'https://' + cleanUrl;
        return cleanUrl;
    });
}

/**
 * AI Parsing Logic
 */
async function parseResumeWithAI(text: string, apiKey: string, model: string): Promise<ResumeData> {
    // Truncate text if needed (100k chars is plenty for resumes)
    const truncatedText = text.substring(0, 50000);

    const client = await openAIService.getClient();

    const completion = await client.chat.completions.create({
        model: model,
        messages: [
            { role: "system", content: AI_PROMPTS.resume_parsing.system },
            { role: "user", content: AI_PROMPTS.resume_parsing.user(truncatedText) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI");

    const parsed = JSON.parse(content) as ResumeData;
    // ensure structure matches strict ResumeData requirements
    return {
        id: crypto.randomUUID(),
        fileName: "Parsed Resume",
        personalInfo: parsed.personalInfo || { fullName: "", email: "", phone: "", location: "" },
        skills: parsed.skills || [],
        experience: parsed.experience || [],
        education: parsed.education || [],
        projects: parsed.projects || [],
        certifications: parsed.certifications || []
    };
}

// Regex Fallback Parsing Logic
function parseResumeToProfile(text: string): ResumeData {
    const profile: ResumeData = {
        id: crypto.randomUUID(),
        fileName: "Parsed Resume",
        personalInfo: { fullName: "", email: "", phone: "", location: "" },
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: []
    };

    // Helper to find section start
    const findSection = (headers: string[]) => {
        for (const h of headers) {
            const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
            const match = text.match(regex);
            if (match) return match.index!;
        }
        return -1;
    };

    const expHeaders = ['EXPERIENCE', 'WORK EXPERIENCE', 'WORK HISTORY', 'PROFESSIONAL EXPERIENCE', 'EMPLOYMENT HISTORY', 'PROFESSIONAL BACKGROUND', 'HISTORY'];
    const eduHeaders = ['EDUCATION', 'ACADEMIC HISTORY', 'EDUCATION & CREDENTIALS', 'ACADEMIC BACKGROUND', 'UNIVERSITY'];
    const skillHeaders = ['SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'TECHNOLOGIES', 'LANGUAGES & TECHNOLOGIES'];
    const projectHeaders = ['PROJECTS', 'PERSONAL PROJECTS', 'KEY PROJECTS'];

    const expStart = findSection(expHeaders);
    const eduStart = findSection(eduHeaders);
    const skillStart = findSection(skillHeaders);
    const projectStart = findSection(projectHeaders);

    // 1. Parse Summary (Everything before first major section)
    // Skipped as UI ResumeData doesn't strictly support summary field yet based on definitions

    // 2. Parse Experience
    if (expStart !== -1) {
        let expEnd = text.length;
        const nextSections = [eduHeaders, skillHeaders, projectHeaders];

        for (const headers of nextSections) {
            for (const h of headers) {
                const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
                const match = text.slice(expStart + 10).match(regex);
                if (match) {
                    const absoluteIndex = expStart + 10 + match.index!;
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
        const nextSections = [skillHeaders, projectHeaders];

        for (const headers of nextSections) {
            for (const h of headers) {
                const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
                const match = text.slice(eduStart + 10).match(regex);
                if (match) {
                    const absoluteIndex = eduStart + 10 + match.index!;
                    if (absoluteIndex < eduEnd) eduEnd = absoluteIndex;
                }
            }
        }

        const eduText = text.substring(eduStart, eduEnd).replace(new RegExp(`^ (${eduHeaders.join('|')})`, 'i'), '');
        profile.education = parseEducation(eduText);
    }

    // 4. Parse Skills
    if (skillStart !== -1) {
        let skillEnd = text.length;
        const nextSections = [projectHeaders, ['CERTIFICATIONS', 'AWARDS', 'REFERENCES']];

        for (const headers of nextSections) {
            for (const h of headers) {
                const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
                const match = text.slice(skillStart + 10).match(regex);
                if (match) {
                    const absoluteIndex = skillStart + 10 + match.index!;
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

function parseJobs(text: string): ResumeExperienceEntry[] {
    const jobs: ResumeExperienceEntry[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let currentJob: ResumeExperienceEntry | null = null;

    // Common Date Regex
    // Supports: Jan 2023, 01/2023, 2023, Summer 2023, Present, Current, Now
    const dateLineRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:\d{1,2}\/\d{4})|(?:\d{4})|(?:Summer|Winter|Spring|Fall)\s+\d{4})\s*(?:-|–|to)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current|Now|(?:\d{1,2}\/\d{4})|(?:\d{4})|(?:Summer|Winter|Spring|Fall)\s+\d{4})/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const dateMatch = line.match(dateLineRegex);

        if (dateMatch) {
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
                startDate: dateMatch[1],
                endDate: dateMatch[2],
                description: "",
                highlights: []
            };
        } else {
            if (currentJob) {
                if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                    currentJob.highlights.push(line.replace(/^[•\-*]\s*/, ''));
                } else {
                    currentJob.description += (currentJob.description ? "\n" : "") + line;
                }
            }
        }
    }
    if (currentJob) jobs.push(currentJob);
    return jobs;
}

function parseEducation(text: string): ResumeEducationEntry[] {
    const schools: ResumeEducationEntry[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let currentSchool: ResumeEducationEntry | null = null;

    for (const line of lines) {
        // Heuristic: Line with "University", "College", "School" is the institution
        if (/University|College|School|Institute/i.test(line) && line.length < 60) {
            if (currentSchool) schools.push(currentSchool);
            currentSchool = {
                school: line,
                degree: "Degree",
                startDate: "",
                endDate: "",
                highlights: [] // UI expects highlights array
            };
        } else if (currentSchool) {
            const dateMatch = line.match(/\d{4}/);
            if (dateMatch) {
                // Simple check for single year or range
                // ideally we parse range if present
                if (line.includes('-') || line.includes('to')) {
                    // try to extract start/end
                    const parts = line.split(/-|to/);
                    if (parts.length === 2) {
                        currentSchool.startDate = parts[0].trim();
                        currentSchool.endDate = parts[1].trim();
                    } else {
                        currentSchool.endDate = line;
                    }
                } else {
                    currentSchool.endDate = line;
                }
            } else if (/Bachelor|Master|PhD|Associate|B\.S|M\.S|B\.A/i.test(line)) {
                currentSchool.degree = line;
            }
        }
    }
    if (currentSchool) schools.push(currentSchool);
    return schools;
}
