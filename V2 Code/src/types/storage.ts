export type OpenAIModel = "gpt-4o-mini" | "gpt-4o" | "gpt-3.5-turbo";

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  location?: string;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  dates: string;
  description: string;
}

export interface EducationEntry {
  school: string;
  degree: string;
  dates: string;
}

export interface ProjectEntry {
  name: string;
  technologies: string | string[];
  description: string;
}

export interface ResumeCertificationEntry {
  name: string;
  issuer: string;
  date: string;
}

export interface ResumeProfile {
  personal_info?: PersonalInfo;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications?: ResumeCertificationEntry[];
}

export interface ResumeEntry {
  id: string;
  name: string;
  data: string; // base64 PDF data URI
  profile?: ResumeProfile;
}

export interface AutoScanRequest {
  tabId: number;
  url: string;
  siteName: string;
  timestamp: number;
}

export interface StorageSchema {
  job_jet_resumes: ResumeEntry[];
  job_jet_active_resume_id: string | null;
  job_jet_profile: ResumeProfile | null;
  job_jet_info: PersonalInfo;
  job_jet_openai_key: string;
  job_jet_openai_model: OpenAIModel;
  job_jet_counter: number;
  job_jet_auto_scan_enabled: boolean;
  job_jet_auto_scan_request: AutoScanRequest | null;
}

export type StorageKey = keyof StorageSchema;
