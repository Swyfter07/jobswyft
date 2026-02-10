import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chromeStorageAdapter } from "../lib/chrome-storage-adapter";

export interface EEOPreferences {
  veteranStatus?: "I am a veteran" | "I am not a veteran" | "I prefer not to answer";
  disabilityStatus?: "Yes, I have a disability" | "No, I do not have a disability" | "I prefer not to answer";
  raceEthnicity?: string;
  gender?: string;
  sponsorshipRequired?: "Yes" | "No";
  authorizedToWork?: "Yes" | "No";
}

interface SettingsState {
  autoAnalysis: boolean;
  autoScan: boolean;
  eeoPreferences: EEOPreferences;

  setAutoAnalysis: (enabled: boolean) => void;
  setAutoScan: (enabled: boolean) => void;
  setEEOPreferences: (prefs: EEOPreferences) => void;
  updateEEOField: <K extends keyof EEOPreferences>(field: K, value: EEOPreferences[K]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      autoAnalysis: true,
      autoScan: true,
      eeoPreferences: {},

      setAutoAnalysis: (enabled) => set({ autoAnalysis: enabled }),
      setAutoScan: (enabled) => set({ autoScan: enabled }),
      setEEOPreferences: (prefs) => set({ eeoPreferences: prefs }),
      updateEEOField: (field, value) => {
        const current = get().eeoPreferences;
        set({ eeoPreferences: { ...current, [field]: value } });
      },
    }),
    {
      name: "jobswyft-settings",
      storage: createJSONStorage(() => chromeStorageAdapter),
    }
  )
);
