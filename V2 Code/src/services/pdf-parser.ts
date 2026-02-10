import type { ResumeProfile, PersonalInfo } from "@/types/storage";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker - use local worker via Vite URL import
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Try to set worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
} catch (e) {
  console.error("Failed to set PDF worker source:", e);
}

/**
 * Extract text from a base64-encoded PDF
 */
export async function extractTextFromPDF(base64Data: string): Promise<string> {
  const raw = atob(base64Data.split(",")[1]);
  const uint8 = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    uint8[i] = raw.charCodeAt(i);
  }

  const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join("\n");
    fullText += pageText + "\n\n";
  }

  return fullText;
}

/**
 * Extract personal info via regex (fast, no AI needed)
 */
export function extractPersonalInfo(text: string): Partial<PersonalInfo> {
  const info: Partial<PersonalInfo> = {};

  // Email
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  if (emailMatch) info.email = emailMatch[0];

  // Phone
  const phoneMatch = text.match(
    /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/
  );
  if (phoneMatch) info.phone = phoneMatch[0];

  // LinkedIn URL
  const linkedinMatch = text.match(
    /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/)[a-zA-Z0-9-]+/i
  );
  if (linkedinMatch) info.linkedin = "https://" + linkedinMatch[0];

  // Portfolio / Website
  const urlMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g
  );
  if (urlMatch) {
    const portfolio = urlMatch.find(
      (u) => !u.includes("linkedin") && !u.includes("@")
    );
    if (portfolio)
      info.portfolio = portfolio.startsWith("http")
        ? portfolio
        : "https://" + portfolio;
  }

  // Name - first non-contact line in the first 5 lines
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  for (const line of lines.slice(0, 5)) {
    if (/@|linkedin|http|www\.|\+?\d{10,}/.test(line)) continue;
    if (line.length > 40) continue;
    info.name = line;
    break;
  }

  return info;
}

/**
 * Parse resume text into a structured profile using regex heuristics (no AI)
 */
export function parseResumeToProfile(text: string): ResumeProfile {
  const profile: ResumeProfile = {
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
  };

  const findSection = (headers: string[]) => {
    for (const h of headers) {
      const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, "i");
      const match = text.match(regex);
      if (match && match.index !== undefined) return match.index;
    }
    return -1;
  };

  const expHeaders = [
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "WORK HISTORY",
    "PROFESSIONAL EXPERIENCE",
    "EMPLOYMENT",
    "EMPLOYMENT HISTORY",
  ];
  const eduHeaders = [
    "EDUCATION",
    "ACADEMIC HISTORY",
    "EDUCATION & CREDENTIALS",
    "ACADEMIC BACKGROUND",
  ];
  const skillHeaders = ["SKILLS", "TECHNICAL SKILLS", "EXPERTISE", "TECHNOLOGIES", "CORE COMPETENCIES", "CORE SKILLS"];
  const projectHeaders = ["PROJECTS", "PERSONAL PROJECTS", "SELECTED PROJECTS", "ACADEMIC PROJECTS"];

  const expStart = findSection(expHeaders);
  const eduStart = findSection(eduHeaders);
  const skillStart = findSection(skillHeaders);
  const projectStart = findSection(projectHeaders);

  // 1. Summary
  const allSectionIndices = [expStart, eduStart, skillStart, projectStart].filter((i) => i !== -1);
  let firstSectionIndex = allSectionIndices.length > 0 ? Math.min(...allSectionIndices) : text.length;

  if (firstSectionIndex > 0) {
    let summaryRaw = text.substring(0, firstSectionIndex).trim();
    summaryRaw = summaryRaw.replace(/^(SUMMARY|PROFILE|OBJECTIVE|ABOUT ME)\s*/i, "");
    const lines = summaryRaw.split("\n");
    const longLines = lines.filter((l) => l.length > 30);
    profile.summary =
      longLines.length > 0 ? longLines.join("\n") : lines.slice(-3).join("\n");
  }

  // 2. Experience
  if (expStart !== -1) {
    const nextSections = [eduHeaders, skillHeaders, projectHeaders, ["CERTIFICATIONS", "AWARDS", "REFERENCES"]];
    let expEnd = text.length;
    for (const headers of nextSections) {
      for (const h of headers) {
        const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, "i");
        const match = text.slice(expStart + 10).match(regex);
        if (match && match.index !== undefined) {
          const absoluteIndex = expStart + 10 + match.index;
          if (absoluteIndex < expEnd) expEnd = absoluteIndex;
        }
      }
    }
    const expText = text
      .substring(expStart, expEnd)
      .replace(new RegExp(`^\\s*(${expHeaders.join("|")})`, "i"), "");
    profile.experience = parseJobs(expText);
  }

  // 3. Education
  if (eduStart !== -1) {
    let eduEnd = text.length;
    const nextSections = [expHeaders, skillHeaders, projectHeaders, ["CERTIFICATIONS", "AWARDS", "REFERENCES"]];
    for (const headers of nextSections) {
      for (const h of headers) {
        const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, "i");
        const match = text.slice(eduStart + 10).match(regex);
        if (match && match.index !== undefined) {
          const absoluteIndex = eduStart + 10 + match.index;
          if (absoluteIndex < eduEnd) eduEnd = absoluteIndex;
        }
      }
    }
    const eduText = text
      .substring(eduStart, eduEnd)
      .replace(new RegExp(`^\\s*(${eduHeaders.join("|")})`, "i"), "");
    profile.education = parseEducation(eduText);
  }

  // 4. Skills
  if (skillStart !== -1) {
    let skillEnd = text.length;
    const afterSkillSections = [
      expHeaders,
      eduHeaders,
      projectHeaders,
      ["CERTIFICATIONS", "AWARDS", "REFERENCES"],
    ];
    for (const headers of afterSkillSections) {
      for (const h of headers) {
        const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, "i");
        const match = text.slice(skillStart + 10).match(regex);
        if (match && match.index !== undefined) {
          const absoluteIndex = skillStart + 10 + match.index;
          if (absoluteIndex < skillEnd) skillEnd = absoluteIndex;
        }
      }
    }
    const skillText = text
      .substring(skillStart, skillEnd)
      .replace(new RegExp(`^\\s*(${skillHeaders.join("|")})\\s*`, "i"), "");
    profile.skills = skillText
      .split(/[,•·|●\n\t]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 60 && !/^\d+$/.test(s));
  }

  return profile;
}

function parseJobs(text: string) {
  const jobs: { title: string; company: string; dates: string; description: string }[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  let currentJob: (typeof jobs)[0] | null = null;

  const dateLineRegex =
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{2,4}|(?:\d{1,2}\/\d{2,4})|(?:\d{4}))\s*(?:-|–|to|—|–)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{2,4}|Present|Current|Now|(?:\d{1,2}\/\d{2,4})|(?:\d{4}))/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isDateLine = dateLineRegex.test(line);

    if (isDateLine) {
      if (currentJob) jobs.push(currentJob);

      // Heuristic for Title and Company
      // Usually Title is on the same line as dates, or line before.
      let title = "Title";
      let company = "Company";

      const lineWithoutDates = line.replace(dateLineRegex, "").replace(/[|•·●]/g, "").trim();

      if (lineWithoutDates.length > 3) {
        // Title might be on the same line as dates
        title = lineWithoutDates;
        company = i > 0 ? lines[i - 1] : "Company";
      } else {
        title = i > 0 ? lines[i - 1] : "Title";
        company = i > 1 ? lines[i - 2] : "Company";
      }

      // Swap if company seems more like a title
      if (/Inc|LLC|Ltd|Corp|Solutions|Systems|Technologies|University|College|Group/i.test(title) &&
        !/Inc|LLC|Ltd|Corp|Solutions|Systems|Technologies|University|College|Group/i.test(company)) {
        const temp = title;
        title = company;
        company = temp;
      }

      if (company.length < 2) company = "Company";

      currentJob = { title, company, dates: line.match(dateLineRegex)?.[0] || line, description: "" };
    } else if (currentJob) {
      currentJob.description += line + "\n";
    }
  }
  if (currentJob) jobs.push(currentJob);
  return jobs;
}

function parseEducation(text: string) {
  const schools: { school: string; degree: string; dates: string }[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  let currentSchool: (typeof schools)[0] | null = null;

  for (const line of lines) {
    if (/University|College|School|Institute|Academy|Polytechnic/i.test(line)) {
      if (currentSchool) schools.push(currentSchool);
      currentSchool = { school: line, degree: "", dates: "" };
    } else if (currentSchool) {
      if (/\d{4}/.test(line) && !currentSchool.dates) {
        currentSchool.dates = line;
      } else {
        currentSchool.degree += line + " ";
      }
    }
  }
  if (currentSchool) schools.push(currentSchool);
  return schools;
}
