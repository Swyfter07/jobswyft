import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chromeStorageAdapter } from "../lib/chrome-storage-adapter";
import type { JobData, MatchData } from "@jobswyft/ui";

export type SidebarState =
  | "logged-out"
  | "non-job-page"
  | "job-detected"
  | "full-power";

export type MainTab = "scan" | "ai-studio" | "autofill" | "coach";
export type AIStudioSubTab = "match" | "cover-letter" | "chat" | "outreach";

export interface AIStudioOutputs {
  coverLetter: string | null;
  outreach: string | null;
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

interface SidebarStoreState {
  // Sidebar state
  sidebarState: SidebarState;

  // Job context
  jobData: JobData | null;
  matchData: MatchData | null;
  aiStudioOutputs: AIStudioOutputs;
  lastJobUrl: string | null;

  // Tab state
  activeTab: MainTab;
  aiStudioSubTab: AIStudioSubTab;

  // Actions
  setJobData: (data: JobData) => void;
  setMatchData: (data: MatchData) => void;
  setActiveTab: (tab: MainTab) => void;
  setAIStudioSubTab: (subTab: AIStudioSubTab) => void;
  setSidebarState: (state: SidebarState) => void;

  /**
   * Reset job context per State Preservation Matrix (FR72a / FR72c).
   * Clears: jobData, matchData, aiStudioOutputs, chatHistory.
   * Preserves: resume selection, auth, credits, settings.
   */
  resetJob: () => void;

  /**
   * Handle URL change — if new URL differs from lastJobUrl,
   * reset job data per FR72a. If non-job page, preserve context per FR72b.
   */
  onUrlChange: (url: string, isJobPage: boolean) => void;

  /**
   * Reset AI Studio outputs when user clicks "Dive Deeper" on a new job.
   * Per State Preservation Matrix: AI Studio outputs persist on URL change
   * until user explicitly regenerates them.
   */
  resetAIStudioOutputs: () => void;
}

const emptyAIStudioOutputs: AIStudioOutputs = {
  coverLetter: null,
  outreach: null,
  chatHistory: [],
};

export const useSidebarStore = create<SidebarStoreState>()(
  persist(
    (set, get) => ({
      sidebarState: "non-job-page",
      jobData: null,
      matchData: null,
      aiStudioOutputs: { ...emptyAIStudioOutputs },
      lastJobUrl: null,
      activeTab: "scan",
      aiStudioSubTab: "match",

      setJobData: (data) => {
        set({ jobData: data, lastJobUrl: data.sourceUrl ?? null });
      },

      setMatchData: (data) => {
        set({ matchData: data });
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      setAIStudioSubTab: (subTab) => {
        set({ aiStudioSubTab: subTab });
      },

      setSidebarState: (state) => {
        set({ sidebarState: state });
      },

      resetJob: () => {
        // Per State Preservation Matrix: Manual Reset clears job, match, AI outputs, chat
        // Preserves: resume, auth, credits, settings (handled by separate stores)
        set({
          jobData: null,
          matchData: null,
          aiStudioOutputs: { ...emptyAIStudioOutputs },
          lastJobUrl: null,
          sidebarState: "non-job-page",
          activeTab: "scan",
          aiStudioSubTab: "match",
        });
      },

      onUrlChange: (url, isJobPage) => {
        const { lastJobUrl } = get();

        if (!isJobPage) {
          // FR72b: Non-job page → preserve last job context
          return;
        }

        if (url !== lastJobUrl) {
          // FR72a: New job page → reset job data, match data
          // AI Studio outputs persist until user clicks "Dive Deeper"
          set({
            jobData: null,
            matchData: null,
            lastJobUrl: url,
            sidebarState: "job-detected",
            activeTab: "scan",
          });
        }
      },

      resetAIStudioOutputs: () => {
        // Per State Preservation Matrix footnote: AI Studio outputs persist on
        // job URL change until user explicitly clicks "Dive Deeper" (regenerate)
        set({
          aiStudioOutputs: { ...emptyAIStudioOutputs },
        });
      },
    }),
    {
      name: "jobswyft-sidebar",
      storage: createJSONStorage(() => chromeStorageAdapter),
      partialize: (state) => ({
        jobData: state.jobData,
        matchData: state.matchData,
        aiStudioOutputs: state.aiStudioOutputs,
        lastJobUrl: state.lastJobUrl,
        activeTab: state.activeTab,
        aiStudioSubTab: state.aiStudioSubTab,
        // sidebarState excluded — always starts at default "non-job-page".
        // The actual state is recalculated when a scan occurs (via onUrlChange /
        // setSidebarState), so persisting it would only risk stale values
        // (e.g., "full-power" hydrating on a non-job page).
      }),
    }
  )
);
