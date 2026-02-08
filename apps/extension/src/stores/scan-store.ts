import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chromeStorageAdapter } from "../lib/chrome-storage-adapter";
import type { JobData } from "@jobswyft/ui";
import { apiClient } from "../lib/api-client";

interface ScanState {
  scanStatus: "idle" | "scanning" | "success" | "error";
  jobData: JobData | null;
  editedJobData: Partial<JobData> | null;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;

  startScan: () => void;
  setScanResult: (data: Partial<JobData>) => void;
  setScanError: (error: string) => void;
  toggleEdit: () => void;
  updateField: (field: keyof JobData, value: string) => void;
  saveJob: (token: string) => Promise<void>;
  resetScan: () => void;
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

      startScan: () => {
        set({
          scanStatus: "scanning",
          error: null,
          isEditing: false,
          editedJobData: null,
        });
      },

      setScanResult: (data) => {
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
        if (!data?.title || !data?.company || !data?.description) return;

        set({ isSaving: true, error: null });
        try {
          await apiClient.saveJob(token, {
            title: data.title,
            company: data.company,
            description: data.description,
            location: data.location,
            salary: data.salary,
            employmentType: data.employmentType,
            sourceUrl: data.sourceUrl,
          });

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

          set({ isSaving: false, scanStatus: "success" });
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
        });
      },
    }),
    {
      name: "jobswyft-scan",
      storage: createJSONStorage(() => chromeStorageAdapter),
      partialize: (state) => ({ jobData: state.jobData }),
    }
  )
);
