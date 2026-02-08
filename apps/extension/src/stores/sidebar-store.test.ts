import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSidebarStore } from "./sidebar-store";
import type { JobData, MatchData } from "./sidebar-store";

// Mock chrome.storage
vi.mock("../lib/chrome-storage-adapter", () => ({
  chromeStorageAdapter: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

describe("useSidebarStore - State Preservation Matrix", () => {
  const mockJobData: JobData = {
    title: "Software Engineer",
    company: "Acme Corp",
    description: "Build cool stuff",
    url: "https://example.com/job/1",
  };

  const mockMatchData: MatchData = {
    score: 85,
    strengths: ["React", "TypeScript"],
    gaps: ["Python"],
  };

  beforeEach(() => {
    // Reset store to default state before each test
    useSidebarStore.setState({
      sidebarState: "non-job-page",
      jobData: null,
      matchData: null,
      aiStudioOutputs: { coverLetter: null, outreach: null, chatHistory: [] },
      lastJobUrl: null,
      activeTab: "scan",
      aiStudioSubTab: "match",
    });
    vi.clearAllMocks();
  });

  describe("resetJob() - Manual Reset (FR72c)", () => {
    it("should clear job data, match data, and AI outputs", () => {
      // Setup: populated state
      useSidebarStore.setState({
        jobData: mockJobData,
        matchData: mockMatchData,
        aiStudioOutputs: {
          coverLetter: "Dear hiring manager...",
          outreach: "Hi, I saw your posting...",
          chatHistory: [{ role: "user", content: "test" }],
        },
        lastJobUrl: mockJobData.url,
        sidebarState: "job-detected",
        activeTab: "ai-studio",
        aiStudioSubTab: "cover-letter",
      });

      // Action: reset
      useSidebarStore.getState().resetJob();

      // Assert: job context cleared
      const state = useSidebarStore.getState();
      expect(state.jobData).toBeNull();
      expect(state.matchData).toBeNull();
      expect(state.aiStudioOutputs.coverLetter).toBeNull();
      expect(state.aiStudioOutputs.outreach).toBeNull();
      expect(state.aiStudioOutputs.chatHistory).toEqual([]);
      expect(state.lastJobUrl).toBeNull();
      expect(state.sidebarState).toBe("non-job-page");
      expect(state.activeTab).toBe("scan");
      expect(state.aiStudioSubTab).toBe("match");
    });
  });

  describe("onUrlChange() - Job URL Change (FR72a)", () => {
    it("should reset job and match data when navigating to new job URL", () => {
      // Setup: existing job
      useSidebarStore.setState({
        jobData: mockJobData,
        matchData: mockMatchData,
        lastJobUrl: mockJobData.url,
        sidebarState: "job-detected",
      });

      // Action: navigate to new job URL
      const newUrl = "https://example.com/job/2";
      useSidebarStore.getState().onUrlChange(newUrl, true);

      // Assert: job and match data reset, AI outputs preserved
      const state = useSidebarStore.getState();
      expect(state.jobData).toBeNull();
      expect(state.matchData).toBeNull();
      expect(state.lastJobUrl).toBe(newUrl);
      expect(state.sidebarState).toBe("job-detected");
      expect(state.activeTab).toBe("scan");
    });

    it("should preserve AI Studio outputs on URL change (until Dive Deeper)", () => {
      // Setup: existing job with AI outputs
      useSidebarStore.setState({
        jobData: mockJobData,
        matchData: mockMatchData,
        aiStudioOutputs: {
          coverLetter: "Dear hiring manager...",
          outreach: "Hi, I saw your posting...",
          chatHistory: [{ role: "user", content: "test" }],
        },
        lastJobUrl: mockJobData.url,
      });

      // Action: navigate to new job URL
      const newUrl = "https://example.com/job/2";
      useSidebarStore.getState().onUrlChange(newUrl, true);

      // Assert: AI outputs NOT reset (preserved)
      const state = useSidebarStore.getState();
      expect(state.aiStudioOutputs.coverLetter).toBe("Dear hiring manager...");
      expect(state.aiStudioOutputs.outreach).toBe("Hi, I saw your posting...");
      expect(state.aiStudioOutputs.chatHistory).toHaveLength(1);
    });

    it("should NOT reset anything when URL is the same", () => {
      // Setup: existing job
      const initialState = {
        jobData: mockJobData,
        matchData: mockMatchData,
        lastJobUrl: mockJobData.url,
      };
      useSidebarStore.setState(initialState);

      // Action: navigate to same URL
      useSidebarStore.getState().onUrlChange(mockJobData.url, true);

      // Assert: no changes
      const state = useSidebarStore.getState();
      expect(state.jobData).toEqual(mockJobData);
      expect(state.matchData).toEqual(mockMatchData);
    });
  });

  describe("onUrlChange() - Non-Job Page Navigation (FR72b)", () => {
    it("should preserve all context when navigating to non-job page", () => {
      // Setup: existing job
      const initialState = {
        jobData: mockJobData,
        matchData: mockMatchData,
        aiStudioOutputs: {
          coverLetter: "Dear hiring manager...",
          outreach: null,
          chatHistory: [],
        },
        lastJobUrl: mockJobData.url,
        sidebarState: "job-detected" as const,
      };
      useSidebarStore.setState(initialState);

      // Action: navigate to non-job page (Gmail, Google Docs, etc.)
      useSidebarStore.getState().onUrlChange("https://mail.google.com", false);

      // Assert: all context preserved
      const state = useSidebarStore.getState();
      expect(state.jobData).toEqual(mockJobData);
      expect(state.matchData).toEqual(mockMatchData);
      expect(state.aiStudioOutputs.coverLetter).toBe("Dear hiring manager...");
      expect(state.lastJobUrl).toBe(mockJobData.url);
    });
  });

  describe("resetAIStudioOutputs() - Dive Deeper Action", () => {
    it("should clear AI Studio outputs when user clicks Dive Deeper", () => {
      // Setup: AI outputs exist
      useSidebarStore.setState({
        aiStudioOutputs: {
          coverLetter: "Dear hiring manager...",
          outreach: "Hi, I saw your posting...",
          chatHistory: [{ role: "user", content: "test" }],
        },
      });

      // Action: user clicks "Dive Deeper" (regenerate)
      useSidebarStore.getState().resetAIStudioOutputs();

      // Assert: AI outputs cleared
      const state = useSidebarStore.getState();
      expect(state.aiStudioOutputs.coverLetter).toBeNull();
      expect(state.aiStudioOutputs.outreach).toBeNull();
      expect(state.aiStudioOutputs.chatHistory).toEqual([]);
    });
  });

  describe("Tab State Preservation (FR72d)", () => {
    it("should preserve active tab when switching tabs", () => {
      useSidebarStore.getState().setActiveTab("ai-studio");
      expect(useSidebarStore.getState().activeTab).toBe("ai-studio");

      useSidebarStore.getState().setActiveTab("coach");
      expect(useSidebarStore.getState().activeTab).toBe("coach");
    });

    it("should preserve AI Studio sub-tab when switching", () => {
      useSidebarStore.getState().setAIStudioSubTab("cover-letter");
      expect(useSidebarStore.getState().aiStudioSubTab).toBe("cover-letter");

      useSidebarStore.getState().setAIStudioSubTab("outreach");
      expect(useSidebarStore.getState().aiStudioSubTab).toBe("outreach");
    });
  });
});
