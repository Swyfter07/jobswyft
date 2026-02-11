import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chromeStorageAdapter } from "../lib/chrome-storage-adapter";
import type { JobData } from "@jobswyft/ui";
import { apiClient } from "../lib/api-client";
import type { ExtractionConfidence } from "../features/scanning/extraction-validator";

interface ScanState {
  scanStatus: "idle" | "scanning" | "success" | "error";
  jobData: JobData | null;
  editedJobData: Partial<JobData> | null;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  confidence: ExtractionConfidence | null;
  isRefining: boolean;
  board: string | null;
  savedJobId: string | null;
  hasShowMore: boolean;

  startScan: () => void;
  setScanResult: (data: Partial<JobData>, confidence?: ExtractionConfidence | null, board?: string | null) => void;
  setScanError: (error: string) => void;
  toggleEdit: () => void;
  updateField: (field: keyof JobData, value: string) => void;
  saveJob: (token: string) => Promise<void>;
  resetScan: () => void;
  setRefining: (value: boolean) => void;
  setConfidence: (conf: ExtractionConfidence | null) => void;
  setBoard: (name: string | null) => void;
  setHasShowMore: (value: boolean) => void;
}

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      scanStatus: "idle",
      jobData: null,
      editedJobData: null,
      isEditing: false,
      isSaving: false,
      error: null,
      confidence: null,
      isRefining: false,
      board: null,
      savedJobId: null,
      hasShowMore: false,

      startScan: () => {
        set({
          scanStatus: "scanning",
          error: null,
          isEditing: false,
          editedJobData: null,
          hasShowMore: false,
        });
      },

      setScanResult: (data, confidence, board) => {
        const jobData: JobData = {
          title: data.title ?? "",
          company: data.company ?? "",
          location: data.location ?? "",
          salary: data.salary,
          employmentType: data.employmentType,
          sourceUrl: data.sourceUrl,
          description: data.description,
        };
        set({
          scanStatus: "success",
          jobData,
          editedJobData: null,
          error: null,
          ...(confidence !== undefined ? { confidence } : {}),
          ...(board !== undefined ? { board } : {}),
        });
      },

      setScanError: (error) => {
        set({ scanStatus: "error", error });
      },

      toggleEdit: () => {
        const { isEditing, jobData } = get();
        if (isEditing) {
          // Cancel edit — revert editedJobData
          set({ isEditing: false, editedJobData: null });
        } else {
          // Enter edit — copy current job data as working copy
          set({
            isEditing: true,
            editedJobData: jobData ? { ...jobData } : null,
          });
        }
      },

      updateField: (field, value) => {
        const { editedJobData, jobData } = get();
        const current = editedJobData ?? jobData ?? {};
        set({
          editedJobData: { ...current, [field]: value },
        });
      },

      saveJob: async (token) => {
        const { editedJobData, jobData, isEditing } = get();
        const data = isEditing ? editedJobData : jobData;
        if (!data?.title || !data?.company || !data?.description) {
          console.warn("[scan-store] saveJob skipped — missing required fields:", {
            title: !!data?.title,
            company: !!data?.company,
            description: !!data?.description,
          });
          return;
        }

        set({ isSaving: true, error: null });
        try {
          const response = await apiClient.saveJob(token, {
            title: data.title,
            company: data.company,
            description: data.description,
            location: data.location,
            salary: data.salary,
            employmentType: data.employmentType,
            sourceUrl: data.sourceUrl,
          });

          // Store the server-generated job ID for AI API calls
          const savedJobId = response?.id ?? null;
          console.log("[scan-store] Job saved, savedJobId:", savedJobId);

          // If editing, commit edited data as the new jobData
          if (isEditing && editedJobData) {
            set({
              jobData: {
                ...editedJobData,
                title: editedJobData.title ?? "",
                company: editedJobData.company ?? "",
                location: editedJobData.location ?? "",
              } as JobData,
              editedJobData: null,
              isEditing: false,
            });
          }

          set({ isSaving: false, scanStatus: "success", savedJobId });
        } catch (err) {
          set({
            isSaving: false,
            error: err instanceof Error ? err.message : "Failed to save job",
          });
        }
      },

      resetScan: () => {
        set({
          scanStatus: "idle",
          jobData: null,
          editedJobData: null,
          isEditing: false,
          isSaving: false,
          error: null,
          confidence: null,
          isRefining: false,
          board: null,
          savedJobId: null,
          hasShowMore: false,
        });
      },

      setRefining: (value) => {
        set({ isRefining: value });
      },

      setConfidence: (conf) => {
        set({ confidence: conf });
      },

      setBoard: (name) => {
        set({ board: name });
      },

      setHasShowMore: (value) => {
        set({ hasShowMore: value });
      },
    }),
    {
      name: "jobswyft-scan",
      storage: createJSONStorage(() => chromeStorageAdapter),
      partialize: (state) => ({
        scanStatus: state.scanStatus,
        jobData: state.jobData,
        isRefining: state.isRefining,
        savedJobId: state.savedJobId,
        hasShowMore: state.hasShowMore,
      }),
    }
  )
);
