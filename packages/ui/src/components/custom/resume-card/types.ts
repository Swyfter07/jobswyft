export interface ResumePersonalInfo {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin?: string
  website?: string
}

export interface ResumeExperienceEntry {
  title: string
  company: string
  startDate: string
  endDate: string
  description: string
  highlights: string[]
}

export interface ResumeEducationEntry {
  degree: string
  school: string
  startDate: string
  endDate: string
  gpa?: string
  highlights?: string[]
}

export interface ResumeCertificationEntry {
  name: string
  issuer: string
  date: string
}

export interface ResumeProjectEntry {
  name: string
  description: string
  techStack: string[]
  url?: string
}

export interface ResumeData {
  id: string
  fileName: string
  personalInfo: ResumePersonalInfo
  skills: string[]
  experience: ResumeExperienceEntry[]
  education: ResumeEducationEntry[]
  certifications?: ResumeCertificationEntry[]
  projects?: ResumeProjectEntry[]
}

export interface ResumeSummary {
  id: string
  fileName: string
}

export interface ResumeCardProps {
  resumes: ResumeSummary[]
  activeResumeId?: string
  resumeData?: ResumeData | null

  state: "empty" | "idle" | "loading" | "parsing" | "error" | "uploading"
  uploadProgress?: number
  uploadFileName?: string
  errorMessage?: string
  errorGuidanceText?: string

  maxResumes?: number

  onResumeSelect?: (id: string) => void
  onUpload?: () => void
  onDelete?: (id: string) => void
  onRetry?: () => void

  maxHeight?: string
  entryContentMaxHeight?: string
  className?: string
}
