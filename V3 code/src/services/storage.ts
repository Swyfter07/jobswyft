import { STORAGE_KEYS, Resume, AIModel, EEOPreferences } from '@/types';

export const storageService = {
    async getOpenAIKey(): Promise<string | null> {
        const result = await chrome.storage.local.get(STORAGE_KEYS.OPENAI_KEY);
        return result[STORAGE_KEYS.OPENAI_KEY] || null;
    },

    async setOpenAIKey(key: string): Promise<void> {
        await chrome.storage.local.set({ [STORAGE_KEYS.OPENAI_KEY]: key });
    },

    async getOpenAIModel(): Promise<AIModel> {
        const result = await chrome.storage.local.get(STORAGE_KEYS.OPENAI_MODEL);
        return result[STORAGE_KEYS.OPENAI_MODEL] || 'gpt-4o';
    },

    async setOpenAIModel(model: AIModel): Promise<void> {
        await chrome.storage.local.set({ [STORAGE_KEYS.OPENAI_MODEL]: model });
    },

    async getResumes(): Promise<Resume[]> {
        const result = await chrome.storage.local.get(STORAGE_KEYS.RESUMES);
        return result[STORAGE_KEYS.RESUMES] || [];
    },

    async saveResumes(resumes: Resume[]): Promise<void> {
        await chrome.storage.local.set({ [STORAGE_KEYS.RESUMES]: resumes });
    },

    async getActiveResumeId(): Promise<string | null> {
        const result = await chrome.storage.local.get(STORAGE_KEYS.ACTIVE_RESUME_ID);
        return result[STORAGE_KEYS.ACTIVE_RESUME_ID] || null;
    },

    async setActiveResumeId(id: string): Promise<void> {
        await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_RESUME_ID]: id });
    },

    async getActiveResume(): Promise<Resume | null> {
        const [resumes, activeId] = await Promise.all([
            this.getResumes(),
            this.getActiveResumeId()
        ]);

        if (!activeId) return null;
        return resumes.find(r => r.id === activeId) || null;
    },

    async getAutoScanEnabled(): Promise<boolean> {
        const result = await chrome.storage.local.get(STORAGE_KEYS.AUTO_SCAN_ENABLED);
        // Default to true if not set (undefined) or true
        return result[STORAGE_KEYS.AUTO_SCAN_ENABLED] !== false;
    },

    async setAutoScanEnabled(enabled: boolean): Promise<void> {
        await chrome.storage.local.set({ [STORAGE_KEYS.AUTO_SCAN_ENABLED]: enabled });
    },

    async getDarkMode(): Promise<boolean> {
        const result = await chrome.storage.local.get(STORAGE_KEYS.DARK_MODE);
        // Default to system preference
        return result[STORAGE_KEYS.DARK_MODE] ?? false;
    },

    async setDarkMode(enabled: boolean): Promise<void> {
        await chrome.storage.local.set({ [STORAGE_KEYS.DARK_MODE]: enabled });
    },

    async getAutoAnalysisEnabled(): Promise<boolean> {
        const result = await chrome.storage.local.get(STORAGE_KEYS.AUTO_ANALYSIS_ENABLED);
        // Default to true
        return result[STORAGE_KEYS.AUTO_ANALYSIS_ENABLED] !== false;
    },

    async setAutoAnalysisEnabled(enabled: boolean): Promise<void> {
        await chrome.storage.local.set({ [STORAGE_KEYS.AUTO_ANALYSIS_ENABLED]: enabled });
    },

    async getEEOPreferences(): Promise<EEOPreferences> {
        const result = await chrome.storage.local.get(STORAGE_KEYS.EEO_PREFERENCES);
        return result[STORAGE_KEYS.EEO_PREFERENCES] || {};
    },

    async setEEOPreferences(preferences: EEOPreferences): Promise<void> {
        await chrome.storage.local.set({ [STORAGE_KEYS.EEO_PREFERENCES]: preferences });
    }
};

