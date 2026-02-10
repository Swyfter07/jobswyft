// Re-export types from UI package to ensure consistency
import {
    JobData as UIJobData,
    MatchData as UIMatchData,
    ResumeData as UIResumeData,
    MatchAnalysis as UIMatchAnalysis,
    ResumeExperienceEntry,
    ResumeEducationEntry,
    ResumeProjectEntry,
    ResumePersonalInfo
} from '@jobswyft/ui';

export type JobData = UIJobData;
export type MatchData = UIMatchData;
export type ResumeData = UIResumeData;
export type MatchAnalysis = UIMatchAnalysis;
export type { ResumeExperienceEntry, ResumeEducationEntry, ResumeProjectEntry, ResumePersonalInfo };

export interface Resume {
    id: string;
    fileName: string;
    content: string;
    data: ResumeData;
    timestamp: string;
    fileData?: string; // Base64 encoded file data
    fileType?: string; // MIME type (e.g., application/pdf)
}

export type AIModel = 'gpt-3.5-turbo' | 'gpt-4o' | 'gpt-4o-mini';

/**
 * EEO (Equal Employment Opportunity) preferences for autofill
 * Used to auto-fill common compliance questions on job applications
 */
export interface EEOPreferences {
    veteranStatus?: 'I am a veteran' | 'I am not a veteran' | 'I prefer not to answer';
    disabilityStatus?: 'Yes, I have a disability' | 'No, I do not have a disability' | 'I prefer not to answer';
    raceEthnicity?: string;
    gender?: string;
    sponsorshipRequired?: 'Yes' | 'No';
    authorizedToWork?: 'Yes' | 'No';
}

export const STORAGE_KEYS = {
    OPENAI_KEY: 'job_jet_openai_key',
    OPENAI_MODEL: 'job_jet_openai_model',
    RESUMES: 'job_jet_resumes',
    ACTIVE_RESUME_ID: 'job_jet_active_resume_id',
    AUTO_SCAN_ENABLED: 'job_jet_auto_scan_enabled',
    AUTO_SCAN_REQUEST: 'job_jet_auto_scan_request',
    DARK_MODE: 'job_jet_dark_mode',
    AUTO_ANALYSIS_ENABLED: 'job_jet_auto_analysis_enabled',
    EEO_PREFERENCES: 'job_jet_eeo_preferences',
    CUSTOM_MAPPINGS: 'job_jet_custom_mappings',
} as const;

