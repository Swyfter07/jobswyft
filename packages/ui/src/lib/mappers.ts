/**
 * Pure mapper functions that transform API snake_case responses
 * into UI component camelCase prop shapes.
 *
 * Usage:
 *   import { mapResumeResponse, mapJobResponse } from "@jobswyft/ui"
 *   const resumeData = mapResumeResponse(apiResume)
 *   <ResumeCard resumeData={resumeData} ... />
 */

import type {
  ApiResumeResponse,
  ApiResumeListItem,
  ApiParsedResumeData,
  ApiExperienceItem,
  ApiEducationItem,
  ApiJobResponse,
  ApiMatchAnalysis,
  ApiUsageResponse,
  ApiProfileResponse,
  ApiResponse,
  ApiPaginatedData,
} from "./api-types"

import type {
  ResumeData,
  ResumePersonalInfo,
  ResumeExperienceEntry,
  ResumeEducationEntry,
  ResumeCertificationEntry,
  ResumeProjectEntry,
  ResumeSummary,
} from "../index"

// ─── UI Types (for mappers) ─────────────────────────────────────────

/** Job data shape (UI) — single source of truth for all surfaces */
export interface JobData {
  title: string
  company: string
  location: string
  salary?: string
  employmentType?: string
  sourceUrl?: string
  status?: string
  postedAt?: string
  description?: string
  logo?: string
}

/** Match analysis data shape (UI) - mirrors job-card.tsx (in _reference) */
export interface MatchData {
  score: number // 0-100
  matchedSkills: string[]
  missingSkills: string[]
  summary?: string
}

// ─── Envelope Helpers ───────────────────────────────────────────────

/** Unwrap API response envelope. Throws if success is false. */
export function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    const code = response.error?.code ?? "UNKNOWN"
    const message = response.error?.message ?? "Unknown API error"
    throw new ApiResponseError(code, message, response.error?.details)
  }
  return response.data
}

export class ApiResponseError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "ApiResponseError"
  }
}

/** Unwrap paginated response into items array + pagination metadata. */
export function unwrapPaginated<T>(data: ApiPaginatedData<T>) {
  return {
    items: data.items,
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
  }
}

// ─── Resume Mappers ─────────────────────────────────────────────────

/** Map API resume list items → UI ResumeSummary[] */
export function mapResumeList(items: ApiResumeListItem[]): ResumeSummary[] {
  return items.map((item) => ({
    id: item.id,
    fileName: item.file_name,
  }))
}

/** Map a full API resume response → UI ResumeData (or null if no parsed data) */
export function mapResumeResponse(
  resume: ApiResumeResponse,
): ResumeData | null {
  if (!resume.parsed_data) return null
  return mapParsedResumeData(resume.id, resume.file_name, resume.parsed_data)
}

/** Map parsed resume data with id/fileName context → UI ResumeData */
function mapParsedResumeData(
  id: string,
  fileName: string,
  data: ApiParsedResumeData,
): ResumeData {
  const contact = data.contact
  const personalInfo: ResumePersonalInfo = {
    fullName: [contact?.first_name, contact?.last_name]
      .filter(Boolean)
      .join(" ") || "Unknown",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    location: contact?.location ?? "",
    linkedin: contact?.linkedin_url ?? undefined,
    website: contact?.website ?? undefined,
    _apiFirstName: contact?.first_name ?? undefined,
    _apiLastName: contact?.last_name ?? undefined,
  }

  return {
    id,
    fileName,
    personalInfo,
    skills: data.skills ?? [],
    experience: (data.experience ?? []).map(mapExperience),
    education: (data.education ?? []).map(mapEducation),
    certifications: data.certifications?.map(mapCertification),
    projects: data.projects?.map(mapProject),
  }
}

function mapExperience(item: ApiExperienceItem): ResumeExperienceEntry {
  return {
    title: item.title ?? "",
    company: item.company ?? "",
    startDate: item.start_date ?? "",
    endDate: item.end_date ?? "",
    description: item.description ?? "",
    highlights: item.highlights ?? [],
  }
}

function mapEducation(item: ApiEducationItem): ResumeEducationEntry {
  return {
    degree: item.degree ?? "",
    school: item.institution ?? "",
    startDate: item.start_date ?? item.graduation_year ?? "",
    endDate: item.end_date ?? item.graduation_year ?? "",
    description: item.description ?? undefined,
    highlights: item.highlights ?? undefined,
  }
}

function mapCertification(
  item: NonNullable<ApiParsedResumeData["certifications"]>[number],
): ResumeCertificationEntry {
  return {
    name: item.name ?? "",
    issuer: item.issuer ?? "",
    date: item.date ?? "",
  }
}

function mapProject(
  item: NonNullable<ApiParsedResumeData["projects"]>[number],
): ResumeProjectEntry {
  return {
    name: item.name ?? "",
    description: item.description ?? "",
    techStack: item.tech_stack ?? [],
    url: item.url ?? undefined,
    highlights: item.highlights ?? undefined,
  }
}

// ─── Reverse Mapper (UI → API) ──────────────────────────────────────

/** Reverse-map UI ResumeData → API ParsedResumeData (for PATCH endpoint).
 *  Only includes fields the UI manages. Omitted fields (e.g. summary)
 *  are preserved server-side via deep merge. */
export function reverseMapResumeData(data: ResumeData): Record<string, unknown> {
  // Use preserved API names if the user didn't change fullName
  const originalFullName = [
    data.personalInfo._apiFirstName,
    data.personalInfo._apiLastName,
  ].filter(Boolean).join(" ")
  const nameChanged = data.personalInfo.fullName !== originalFullName

  return {
    contact: {
      first_name: nameChanged
        ? (data.personalInfo.fullName.split(" ")[0] || null)
        : (data.personalInfo._apiFirstName || null),
      last_name: nameChanged
        ? (data.personalInfo.fullName.split(" ").slice(1).join(" ") || null)
        : (data.personalInfo._apiLastName || null),
      email: data.personalInfo.email || null,
      phone: data.personalInfo.phone || null,
      location: data.personalInfo.location || null,
      linkedin_url: data.personalInfo.linkedin || null,
      website: data.personalInfo.website || null,
    },
    skills: data.skills,
    experience: data.experience.map((e) => ({
      title: e.title || null,
      company: e.company || null,
      start_date: e.startDate || null,
      end_date: e.endDate || null,
      description: e.description || null,
      highlights: e.highlights.length > 0 ? e.highlights : null,
    })),
    education: data.education.map((e) => ({
      degree: e.degree || null,
      institution: e.school || null,
      start_date: e.startDate || null,
      end_date: e.endDate || null,
      graduation_year: e.endDate || null,
      description: e.description || null,
      highlights: e.highlights && e.highlights.length > 0 ? e.highlights : null,
    })),
    certifications:
      data.certifications?.map((c) => ({
        name: c.name || null,
        issuer: c.issuer || null,
        date: c.date || null,
      })) ?? null,
    projects:
      data.projects?.map((p) => ({
        name: p.name || null,
        description: p.description || null,
        tech_stack: p.techStack.length > 0 ? p.techStack : null,
        url: p.url || null,
        highlights: p.highlights && p.highlights.length > 0 ? p.highlights : null,
      })) ?? null,
  }
}

// ─── Job Mappers ────────────────────────────────────────────────────

/** Map API job response → UI JobData */
export function mapJobResponse(job: ApiJobResponse): JobData {
  return {
    title: job.title,
    company: job.company,
    location: job.location ?? "",
    salary: job.salary_range ?? undefined,
    employmentType: job.employment_type ?? undefined,
    sourceUrl: job.source_url ?? undefined,
    status: job.status ?? undefined,
    postedAt: job.posted_at ?? undefined,
    description: job.description ?? undefined,
    logo: job.logo_url ?? undefined,
  }
}

/** Map API match analysis → UI MatchData */
export function mapMatchAnalysis(analysis: ApiMatchAnalysis): MatchData {
  return {
    score: analysis.score,
    matchedSkills: analysis.matched_skills,
    missingSkills: analysis.missing_skills,
    summary: analysis.summary ?? undefined,
  }
}

// ─── Credit Mappers ─────────────────────────────────────────────────

/** Credit data shape consumed by both CreditBar and CreditBalance */
export interface CreditData {
  credits: number
  maxCredits: number
  total: number
  used: number
}

/** Map API usage response → unified CreditData for CreditBar + CreditBalance */
export function mapUsageResponse(usage: ApiUsageResponse): CreditData {
  const limit =
    usage.credits_limit === -1 ? Infinity : usage.credits_limit
  const remaining =
    usage.credits_remaining === -1 ? Infinity : usage.credits_remaining
  return {
    credits: remaining,
    maxCredits: limit === Infinity ? remaining : limit,
    total: limit === Infinity ? remaining : limit,
    used: usage.credits_used,
  }
}

// ─── Profile Mapper ─────────────────────────────────────────────────

export interface ProfileData {
  id: string
  email: string
  fullName: string | null
  subscriptionTier: string
  activeResumeId: string | null
}

/** Map API profile → UI-friendly profile data */
export function mapProfileResponse(profile: ApiProfileResponse): ProfileData {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    subscriptionTier: profile.subscription_tier,
    activeResumeId: profile.active_resume_id,
  }
}
