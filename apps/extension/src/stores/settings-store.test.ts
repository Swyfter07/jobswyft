import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "./settings-store";
import type { EEOPreferences } from "./settings-store";

// Mock chrome.storage adapter
vi.mock("../lib/chrome-storage-adapter", () => ({
  chromeStorageAdapter: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      autoAnalysis: true,
      autoScan: true,
      eeoPreferences: {},
    });
    vi.clearAllMocks();
  });

  // ─── Initial State ─────────────────────────────────────────────────

  describe("initial state", () => {
    it("should have correct defaults", () => {
      const state = useSettingsStore.getState();
      expect(state.autoAnalysis).toBe(true);
      expect(state.autoScan).toBe(true);
      expect(state.eeoPreferences).toEqual({});
    });
  });

  // ─── setAutoAnalysis ───────────────────────────────────────────────

  describe("setAutoAnalysis", () => {
    it("should toggle auto analysis off", () => {
      useSettingsStore.getState().setAutoAnalysis(false);
      expect(useSettingsStore.getState().autoAnalysis).toBe(false);
    });

    it("should toggle auto analysis on", () => {
      useSettingsStore.setState({ autoAnalysis: false });
      useSettingsStore.getState().setAutoAnalysis(true);
      expect(useSettingsStore.getState().autoAnalysis).toBe(true);
    });
  });

  // ─── setAutoScan ───────────────────────────────────────────────────

  describe("setAutoScan", () => {
    it("should toggle auto scan off", () => {
      useSettingsStore.getState().setAutoScan(false);
      expect(useSettingsStore.getState().autoScan).toBe(false);
    });

    it("should toggle auto scan on", () => {
      useSettingsStore.setState({ autoScan: false });
      useSettingsStore.getState().setAutoScan(true);
      expect(useSettingsStore.getState().autoScan).toBe(true);
    });
  });

  // ─── setEEOPreferences ─────────────────────────────────────────────

  describe("setEEOPreferences", () => {
    it("should replace all EEO preferences", () => {
      const newPrefs: EEOPreferences = {
        gender: "Female",
        raceEthnicity: "Asian",
        veteranStatus: "I am not a veteran",
        disabilityStatus: "I prefer not to answer",
        sponsorshipRequired: "No",
        authorizedToWork: "Yes",
      };

      useSettingsStore.getState().setEEOPreferences(newPrefs);

      expect(useSettingsStore.getState().eeoPreferences).toEqual(newPrefs);
    });

    it("should replace entire preferences object (not merge)", () => {
      useSettingsStore.setState({
        eeoPreferences: {
          gender: "Male",
          raceEthnicity: "White",
        },
      });

      useSettingsStore.getState().setEEOPreferences({ gender: "Non-binary" });

      const prefs = useSettingsStore.getState().eeoPreferences;
      expect(prefs.gender).toBe("Non-binary");
      // raceEthnicity should be gone (full replacement)
      expect(prefs.raceEthnicity).toBeUndefined();
    });
  });

  // ─── updateEEOField ────────────────────────────────────────────────

  describe("updateEEOField", () => {
    it("should update a single EEO field without affecting others", () => {
      useSettingsStore.setState({
        eeoPreferences: {
          gender: "Male",
          authorizedToWork: "Yes",
        },
      });

      useSettingsStore.getState().updateEEOField("veteranStatus", "I am a veteran");

      const prefs = useSettingsStore.getState().eeoPreferences;
      expect(prefs.veteranStatus).toBe("I am a veteran");
      // Others preserved
      expect(prefs.gender).toBe("Male");
      expect(prefs.authorizedToWork).toBe("Yes");
    });

    it("should overwrite existing field value", () => {
      useSettingsStore.setState({
        eeoPreferences: { gender: "Male" },
      });

      useSettingsStore.getState().updateEEOField("gender", "Non-binary");

      expect(useSettingsStore.getState().eeoPreferences.gender).toBe("Non-binary");
    });
  });

  // ─── Persist (full state) ──────────────────────────────────────────

  describe("persist", () => {
    it("should persist full state (no fields excluded)", () => {
      const persistOptions = (useSettingsStore as unknown as { persist: { getOptions: () => { partialize: (state: unknown) => unknown } } }).persist.getOptions();
      const mockState = {
        autoAnalysis: false,
        autoScan: false,
        eeoPreferences: { gender: "Male" },
        setAutoAnalysis: vi.fn(),
        setAutoScan: vi.fn(),
        setEEOPreferences: vi.fn(),
        updateEEOField: vi.fn(),
      };

      // Zustand provides a default partialize that returns the full state.
      // For settings store, all data fields should be included.
      const partialized = persistOptions.partialize(mockState) as Record<string, unknown>;
      expect(partialized).toHaveProperty("autoAnalysis", false);
      expect(partialized).toHaveProperty("autoScan", false);
      expect(partialized).toHaveProperty("eeoPreferences");
    });
  });
});
