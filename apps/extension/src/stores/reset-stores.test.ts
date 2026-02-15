import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetAllStores } from "./reset-stores";
import { useSidebarStore } from "./sidebar-store";
import { useScanStore } from "./scan-store";
import { useResumeStore } from "./resume-store";
import { useCreditsStore } from "./credits-store";
import { useAutofillStore } from "./autofill-store";
import { useSettingsStore } from "./settings-store";
import { useThemeStore } from "./theme-store";

// Mock chrome.storage adapter
vi.mock("../lib/chrome-storage-adapter", () => ({
  chromeStorageAdapter: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

// Mock api-client
vi.mock("../lib/api-client", () => ({
  apiClient: {
    saveJob: vi.fn(),
    listResumes: vi.fn(),
    getResume: vi.fn(),
    uploadResume: vi.fn(),
    deleteResume: vi.fn(),
    setActiveResume: vi.fn(),
    updateParsedData: vi.fn(),
    getUsage: vi.fn(),
  },
}));

// Mock chrome.storage.local
const mockChromeStorageLocal = {
  remove: vi.fn(async () => {}),
  get: vi.fn(async () => ({})),
  set: vi.fn(async () => {}),
};

vi.stubGlobal("chrome", {
  storage: {
    local: mockChromeStorageLocal,
  },
});

describe("resetAllStores", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Populate user-specific stores with test data
    useSidebarStore.setState({
      sidebarState: "job-detected",
      jobData: { title: "Engineer", company: "Acme", location: "Remote" },
      matchData: { score: 85, matchedSkills: ["React"], missingSkills: ["Go"] },
      lastJobUrl: "https://example.com/job/1",
      activeTab: "ai-studio",
    });

    useScanStore.setState({
      scanStatus: "success",
      jobData: { title: "Engineer", company: "Acme", location: "Remote" },
      savedJobId: "job-123",
      board: "linkedin",
    });

    useResumeStore.setState({
      resumes: [{ id: "r1", fileName: "resume.pdf", isActive: true, parseStatus: "done" }],
      activeResumeId: "r1",
      activeResumeData: { id: "r1" } as never,
      resumeCache: { r1: { id: "r1" } as never },
    });

    useCreditsStore.setState({
      credits: 10,
      maxCredits: 20,
    });

    useAutofillStore.setState({
      detectionStatus: "detected",
      autofillData: { personal: { firstName: "John" } } as never,
      fields: [{ stableId: "f1" }] as never,
    });

    // Populate settings and theme (should NOT be cleared)
    useSettingsStore.setState({
      autoScan: false,
      autoAnalysis: false,
      eeoPreferences: { gender: "Male" },
    });

    useThemeStore.setState({
      theme: "dark",
      userOverride: true,
    });
  });

  it("should clear all user-specific stores", async () => {
    await resetAllStores();

    // Sidebar store cleared
    const sidebar = useSidebarStore.getState();
    expect(sidebar.jobData).toBeNull();
    expect(sidebar.matchData).toBeNull();
    expect(sidebar.lastJobUrl).toBeNull();
    expect(sidebar.sidebarState).toBe("non-job-page");
    expect(sidebar.activeTab).toBe("scan");

    // Scan store cleared
    const scan = useScanStore.getState();
    expect(scan.scanStatus).toBe("idle");
    expect(scan.jobData).toBeNull();
    expect(scan.savedJobId).toBeNull();
    expect(scan.board).toBeNull();

    // Resume store cleared
    const resume = useResumeStore.getState();
    expect(resume.resumes).toEqual([]);
    expect(resume.activeResumeId).toBeNull();
    expect(resume.activeResumeData).toBeNull();
    expect(resume.resumeCache).toEqual({});

    // Credits store cleared
    const credits = useCreditsStore.getState();
    expect(credits.credits).toBe(0);
    expect(credits.maxCredits).toBe(0);

    // Autofill store cleared (including autofillData)
    const autofill = useAutofillStore.getState();
    expect(autofill.detectionStatus).toBe("idle");
    expect(autofill.autofillData).toBeNull();
    expect(autofill.fields).toEqual([]);
  });

  it("should NOT clear settings store (device preferences)", async () => {
    await resetAllStores();

    const settings = useSettingsStore.getState();
    expect(settings.autoScan).toBe(false);
    expect(settings.autoAnalysis).toBe(false);
    expect(settings.eeoPreferences).toEqual({ gender: "Male" });
  });

  it("should NOT clear theme store (device preference)", async () => {
    await resetAllStores();

    const theme = useThemeStore.getState();
    expect(theme.theme).toBe("dark");
    expect(theme.userOverride).toBe(true);
  });

  it("should remove user-specific chrome.storage keys", async () => {
    await resetAllStores();

    expect(mockChromeStorageLocal.remove).toHaveBeenCalledWith([
      "jobswyft-sidebar",
      "jobswyft-scan",
      "jobswyft-autofill",
      "jobswyft-resumes",
      "jobswyft-credits",
    ]);
  });

  it("should continue resetting even if one store throws", async () => {
    // Make sidebar store throw
    const originalResetJob = useSidebarStore.getState().resetJob;
    useSidebarStore.setState({
      resetJob: () => {
        throw new Error("sidebar boom");
      },
    } as never);

    // Should not throw
    await expect(resetAllStores()).resolves.toBeUndefined();

    // Other stores should still be cleared
    const scan = useScanStore.getState();
    expect(scan.scanStatus).toBe("idle");
    expect(scan.jobData).toBeNull();

    const resume = useResumeStore.getState();
    expect(resume.resumes).toEqual([]);

    // Restore original
    useSidebarStore.setState({ resetJob: originalResetJob } as never);
  });

  it("should handle chrome.storage.local.remove failure gracefully", async () => {
    mockChromeStorageLocal.remove.mockRejectedValueOnce(new Error("storage error"));

    // Should not throw
    await expect(resetAllStores()).resolves.toBeUndefined();

    // Stores should still be cleared despite storage failure
    const scan = useScanStore.getState();
    expect(scan.scanStatus).toBe("idle");
  });
});
