import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chromeStorageAdapter } from "../lib/chrome-storage-adapter";

interface CreditsState {
  credits: number;
  maxCredits: number;
  setCredits: (credits: number, maxCredits: number) => void;
}

/**
 * Credits store - stub for EXT.10.
 * Placeholder data until real credit system is wired.
 */
export const useCreditsStore = create<CreditsState>()(
  persist(
    (set) => ({
      credits: 5,
      maxCredits: 5,

      setCredits: (credits, maxCredits) => {
        set({ credits, maxCredits });
      },
    }),
    {
      name: "jobswyft-credits",
      storage: createJSONStorage(() => chromeStorageAdapter),
    }
  )
);
