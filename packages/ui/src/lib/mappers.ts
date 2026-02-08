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

/** Job data shape (UI) - mirrors job-card.tsx (in _reference) */
export interface JobData {
  title: string
  company: string
  location: string
  salary?: string
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
    startDate: item.graduation_year ?? "",
    endDate: item.graduation_year ?? "",
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
