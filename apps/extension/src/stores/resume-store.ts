import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiClient } from "../lib/api-client";
import { chromeStorageAdapter } from "../lib/chrome-storage-adapter";
import { ApiResponseError, mapResumeResponse, reverseMapResumeData } from "@jobswyft/ui";
import type {
  ApiResumeListItem,
  ApiResumeResponse,
  ResumeData,
} from "@jobswyft/ui";

// ─── Local types ────────────────────────────────────────────────────

export interface ResumeListEntry {
  id: string;
  fileName: string;
  isActive: boolean;
  parseStatus: string;
}

function mapApiListItem(item: ApiResumeListItem): ResumeListEntry {
  return {
    id: item.id,
    fileName: item.file_name,
    isActive: item.is_active,
    parseStatus: item.parse_status,
  };
}

// ─── Error message helpers ──────────────────────────────────────────

const ERROR_MESSAGES = {
  PDF_ONLY: "Only PDF files are allowed",
  RESUME_LIMIT: "Maximum 5 resumes. Delete one to upload more.",
  CREDIT_EXHAUSTED: "No credits remaining for resume parsing",
  GENERIC: "An unexpected error occurred",
  NETWORK: "Check your connection and try again",
};

function getUploadErrorMessage(error: unknown): string {
  if (error instanceof ApiResponseError) {
    switch (error.code) {
      case "VALIDATION_ERROR":
        return ERROR_MESSAGES.PDF_ONLY;
      case "RESUME_LIMIT_REACHED":
        return ERROR_MESSAGES.RESUME_LIMIT;
      case "CREDIT_EXHAUSTED":
        return ERROR_MESSAGES.CREDIT_EXHAUSTED;
      default:
        return error.message;
    }
  }
  if (error instanceof TypeError) {
    return ERROR_MESSAGES.NETWORK;
  }
  return ERROR_MESSAGES.GENERIC;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiResponseError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return ERROR_MESSAGES.NETWORK;
  }
  return ERROR_MESSAGES.GENERIC;
}

// ─── Store ──────────────────────────────────────────────────────────

interface ResumeStoreState {
  resumes: ResumeListEntry[];
  activeResumeId: string | null;
  activeResumeData: ResumeData | null;
  resumeCache: Record<string, ResumeData>;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;

  fetchResumes: (token: string) => Promise<void>;
  fetchResumeDetail: (token: string, id: string) => Promise<void>;
  uploadResume: (token: string, file: File) => Promise<void>;
  deleteResume: (token: string, id: string) => Promise<void>;
  setActiveResume: (token: string, id: string) => Promise<void>;
  saveResumeData: (token: string, data: ResumeData) => Promise<void>;
  updateLocalResumeData: (updates: Partial<ResumeData>) => void;
  clearError: () => void;
}

export const useResumeStore = create<ResumeStoreState>()(
  persist(
    (set, get) => ({
      resumes: [],
      activeResumeId: null,
      activeResumeData: null,
      resumeCache: {},
      isLoading: false,
      isUploading: false,
      error: null,

      fetchResumes: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiClient.listResumes(token);
          // ApiPaginatedData<ApiResumeListItem>
          const resumes = data.items.map(mapApiListItem);
          const active = resumes.find((r) => r.isActive);
          const activeResumeId = active?.id ?? resumes[0]?.id ?? null;

          set({ resumes, activeResumeId, isLoading: false });

          // Fetch detail for active resume
          if (activeResumeId) {
            await get().fetchResumeDetail(token, activeResumeId);
          }
        } catch (error) {
          const msg = getErrorMessage(error);
          set({ error: msg, isLoading: false });
        }
      },

      fetchResumeDetail: async (token: string, id: string) => {
        // Check cache first
        const cached = get().resumeCache[id];
        if (cached) {
          set({ activeResumeData: cached, isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const data = await apiClient.getResume(token, id);
          const resumeData = mapResumeResponse(data);
          if (resumeData) {
            set({
              activeResumeData: resumeData,
              resumeCache: { ...get().resumeCache, [id]: resumeData },
              isLoading: false,
            });
          } else {
            set({ activeResumeData: null, isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false, error: getErrorMessage(error) });
        }
      },

      uploadResume: async (token: string, file: File) => {
        // Client-side limit check
        if (get().resumes.length >= 5) {
          set({ error: ERROR_MESSAGES.RESUME_LIMIT });
          return;
        }

        // Client-side file validation
        if (file.type !== "application/pdf") {
          set({ error: ERROR_MESSAGES.PDF_ONLY });
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          set({ error: "File size exceeds 10MB limit" });
          return;
        }

        set({ isUploading: true, error: null });
        try {
          const data = await apiClient.uploadResume(token, file);
          const apiResume = data.resume;

          const newEntry: ResumeListEntry = {
            id: apiResume.id,
            fileName: apiResume.file_name,
            isActive: apiResume.is_active ?? false,
            parseStatus: apiResume.parse_status,
          };

          const updatedResumes = [...get().resumes, newEntry];
          set({
            resumes: updatedResumes,
            isUploading: false,
          });

          // Ensure uploaded resume becomes active
          if (!apiResume.is_active) {
            await get().setActiveResume(token, apiResume.id);
          } else {
            set({ activeResumeId: apiResume.id });
            await get().fetchResumeDetail(token, apiResume.id);
          }

        } catch (error) {
          set({ isUploading: false, error: getUploadErrorMessage(error) });
        }
      },

      deleteResume: async (token: string, id: string) => {
        set({ error: null });
        try {
          await apiClient.deleteResume(token, id);

          const remaining = get().resumes.filter((r) => r.id !== id);
          const wasActive = get().activeResumeId === id;
          const newActiveId = wasActive
            ? remaining[0]?.id ?? null
            : get().activeResumeId;

          // Remove from cache
          const { [id]: _, ...restCache } = get().resumeCache;

          set({
            resumes: remaining,
            activeResumeId: newActiveId,
            activeResumeData: wasActive ? null : get().activeResumeData,
            resumeCache: restCache,
          });

          // If deleted active resume and there's a new active, fetch its detail
          if (wasActive && newActiveId) {
            await get().fetchResumeDetail(token, newActiveId);
          }
        } catch (error) {
          set({ error: getErrorMessage(error) });
        }
      },

      setActiveResume: async (token: string, id: string) => {
        const cached = get().resumeCache[id];
        set({
          error: null,
          activeResumeId: id,
          activeResumeData: cached ?? null,
        });
        try {
          await apiClient.setActiveResume(token, id);

          // Update isActive flags
          set({
            resumes: get().resumes.map((r) => ({
              ...r,
              isActive: r.id === id,
            })),
          });

          // Fetch detail only if not cached
          if (!cached) {
            await get().fetchResumeDetail(token, id);
          }
        } catch (error) {
          set({ error: getErrorMessage(error) });
        }
      },

      saveResumeData: async (token: string, data: ResumeData) => {
        set({ error: null });
        try {
          const apiData = reverseMapResumeData(data);
          await apiClient.updateParsedData(token, data.id, apiData);
          // Update cache + active data
          set({
            activeResumeData: data,
            resumeCache: { ...get().resumeCache, [data.id]: data },
          });
        } catch (error) {
          set({ error: getErrorMessage(error) });
          throw error; // re-throw so UI can handle
        }
      },

      updateLocalResumeData: (updates: Partial<ResumeData>) => {
        const current = get().activeResumeData;
        if (!current) return;
        set({ activeResumeData: { ...current, ...updates } });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "jobswyft-resumes",
      storage: createJSONStorage(() => chromeStorageAdapter),
      partialize: (state) => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
      }),
    }
  )
);
