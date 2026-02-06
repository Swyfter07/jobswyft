/**
 * TypeScript representations of API response shapes (snake_case).
 * These mirror the Python Pydantic models in apps/api/app/models/.
 * Used as input types for mapper functions.
 */

// ─── Response Envelope ──────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ApiPaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ─── Auth / Profile ─────────────────────────────────────────────────

export interface ApiProfileResponse {
  id: string
  email: string
  full_name: string | null
  subscription_tier: string
  subscription_status: string
  active_resume_id: string | null
  preferred_ai_provider: string
  created_at: string
}

// ─── Resume ─────────────────────────────────────────────────────────

export interface ApiContactInfo {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  website?: string | null
}

export interface ApiExperienceItem {
  title: string | null
  company: string | null
  start_date: string | null
  end_date: string | null
  description: string | null
  highlights?: string[]
}

export interface ApiEducationItem {
  degree: string | null
  institution: string | null
  graduation_year: string | null
}

export interface ApiCertificationItem {
  name: string | null
  issuer: string | null
  date: string | null
}

export interface ApiProjectItem {
  name: string | null
  description: string | null
  tech_stack?: string[]
  url?: string | null
}

export interface ApiParsedResumeData {
  contact: ApiContactInfo | null
  summary: string | null
  experience: ApiExperienceItem[] | null
  education: ApiEducationItem[] | null
  skills: string[] | null
  certifications?: ApiCertificationItem[] | null
  projects?: ApiProjectItem[] | null
}

export interface ApiResumeResponse {
  id: string
  user_id: string
  file_name: string
  file_path: string
  parsed_data: ApiParsedResumeData | null
  parse_status: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export interface ApiResumeListItem {
  id: string
  file_name: string
  is_active: boolean
  parse_status: string
  created_at: string
  updated_at: string
}

// ─── Job ────────────────────────────────────────────────────────────

export interface ApiJobResponse {
  id: string
  user_id: string
  title: string
  company: string
  description: string | null
  location: string | null
  salary_range: string | null
  employment_type: string | null
  source_url: string | null
  status: string
  notes: string | null
  posted_at?: string | null
  logo_url?: string | null
  created_at: string
  updated_at: string
}

export interface ApiJobListItem {
  id: string
  title: string
  company: string
  status: string
  notes_preview: string | null
  created_at: string
  updated_at: string
}

// ─── Match Analysis ─────────────────────────────────────────────────

export interface ApiMatchAnalysis {
  score: number
  matched_skills: string[]
  missing_skills: string[]
  summary: string | null
}

// ─── Usage / Credits ────────────────────────────────────────────────

export interface ApiUsageByType {
  match: number
  cover_letter: number
  answer: number
  outreach: number
  resume_parse: number
  referral_bonus: number
}

export interface ApiUsageResponse {
  subscription_tier: string
  period_type: string
  period_key: string
  credits_used: number
  credits_limit: number
  credits_remaining: number
  usage_by_type: ApiUsageByType
  subscription_status: string
  current_period_end: string | null
  pending_deletion_expires: string | null
}
