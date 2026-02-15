import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chromeStorageAdapter } from "../lib/chrome-storage-adapter";
import { apiClient } from "../lib/api-client";

interface CreditsState {
  credits: number;
  maxCredits: number;
  isLoading: boolean;

  fetchCredits: (token: string) => Promise<void>;
  setCredits: (credits: number, maxCredits: number) => void;
  resetCredits: () => void;
}

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set) => ({
      credits: 0,
      maxCredits: 5,
      isLoading: false,

      fetchCredits: async (token) => {
        set({ isLoading: true });
        try {
          const usage = await apiClient.getUsage(token);
          set({
            credits: usage.credits_remaining,
            maxCredits: usage.max_credits,
            isLoading: false,
          });
        } catch (err) {
          console.error("Failed to fetch credits:", err);
          set({ isLoading: false });
        }
      },

      setCredits: (credits, maxCredits) => {
        set({ credits, maxCredits });
      },

      resetCredits: () => {
        set({ credits: 0, maxCredits: 0, isLoading: false });
      },
    }),
    {
      name: "jobswyft-credits",
      storage: createJSONStorage(() => chromeStorageAdapter),
      partialize: (state) => ({
        credits: state.credits,
        maxCredits: state.maxCredits,
      }),
    }
  )
);
