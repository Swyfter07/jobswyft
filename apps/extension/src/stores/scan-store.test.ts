import { describe, it, expect, beforeEach, vi } from "vitest";
import { useScanStore } from "./scan-store";

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
  },
}));

describe("useScanStore", () => {
  beforeEach(() => {
    useScanStore.setState({
      scanStatus: "idle",
      jobData: null,
      editedJobData: null,
      isEditing: false,
      isSaving: false,
      error: null,
      confidence: null,
      isRefining: false,
      board: null,
    });
    vi.clearAllMocks();
  });

  // ─── startScan ──────────────────────────────────────────────────

  describe("startScan", () => {
    it("transitions to scanning state and clears edit state", () => {
      useScanStore.setState({ isEditing: true, editedJobData: { title: "old" }, error: "stale" });

      useScanStore.getState().startScan();

      const state = useScanStore.getState();
      expect(state.scanStatus).toBe("scanning");
      expect(state.error).toBeNull();
      expect(state.isEditing).toBe(false);
      expect(state.editedJobData).toBeNull();
    });
  });

  // ─── setScanResult ──────────────────────────────────────────────

  describe("setScanResult", () => {
    it("sets job data and transitions to success", () => {
      useScanStore.getState().setScanResult({
        title: "Engineer",
        company: "Acme",
        location: "Remote",
        sourceUrl: "https://example.com/job",
        description: "Build things.",
      });

      const state = useScanStore.getState();
      expect(state.scanStatus).toBe("success");
      expect(state.jobData?.title).toBe("Engineer");
      expect(state.jobData?.company).toBe("Acme");
      expect(state.jobData?.location).toBe("Remote");
      expect(state.jobData?.sourceUrl).toBe("https://example.com/job");
      expect(state.jobData?.description).toBe("Build things.");
      expect(state.error).toBeNull();
    });

    it("fills empty strings for missing required fields", () => {
      useScanStore.getState().setScanResult({ sourceUrl: "https://example.com" });

      const state = useScanStore.getState();
      expect(state.jobData?.title).toBe("");
      expect(state.jobData?.company).toBe("");
      expect(state.jobData?.location).toBe("");
    });
  });

  // ─── setScanError ───────────────────────────────────────────────

  describe("setScanError", () => {
    it("sets error state", () => {
      useScanStore.getState().setScanError("Scan failed");

      const state = useScanStore.getState();
      expect(state.scanStatus).toBe("error");
      expect(state.error).toBe("Scan failed");
    });
  });

  // ─── toggleEdit ─────────────────────────────────────────────────

  describe("toggleEdit", () => {
    it("enters edit mode with a working copy of jobData", () => {
      useScanStore.setState({
        jobData: { title: "Engineer", company: "Acme", location: "Remote" },
        scanStatus: "success",
      });

      useScanStore.getState().toggleEdit();

      const state = useScanStore.getState();
      expect(state.isEditing).toBe(true);
      expect(state.editedJobData).toEqual({
        title: "Engineer",
        company: "Acme",
        location: "Remote",
      });
    });

    it("cancels edit mode and clears editedJobData", () => {
      useScanStore.setState({
        jobData: { title: "Engineer", company: "Acme", location: "Remote" },
        isEditing: true,
        editedJobData: { title: "Changed Title", company: "Acme", location: "Remote" },
        scanStatus: "success",
      });

      useScanStore.getState().toggleEdit();

      const state = useScanStore.getState();
      expect(state.isEditing).toBe(false);
      expect(state.editedJobData).toBeNull();
      // Original jobData unchanged
      expect(state.jobData?.title).toBe("Engineer");
    });
  });

  // ─── updateField ────────────────────────────────────────────────

  describe("updateField", () => {
    it("updates a field on the edited working copy", () => {
      useScanStore.setState({
        jobData: { title: "Engineer", company: "Acme", location: "Remote" },
        editedJobData: { title: "Engineer", company: "Acme", location: "Remote" },
        isEditing: true,
        scanStatus: "success",
      });

      useScanStore.getState().updateField("title", "Senior Engineer");

      expect(useScanStore.getState().editedJobData?.title).toBe("Senior Engineer");
    });

    it("creates editedJobData from jobData if not yet set", () => {
      useScanStore.setState({
        jobData: { title: "Engineer", company: "Acme", location: "Remote" },
        editedJobData: null,
        scanStatus: "success",
      });

      useScanStore.getState().updateField("salary", "$120k");

      expect(useScanStore.getState().editedJobData?.salary).toBe("$120k");
    });
  });

  // ─── resetScan ──────────────────────────────────────────────────

  describe("resetScan", () => {
    it("resets all state to idle defaults", () => {
      useScanStore.setState({
        scanStatus: "success",
        jobData: { title: "Engineer", company: "Acme", location: "Remote" },
        editedJobData: { title: "Changed", company: "Acme", location: "Remote" },
        isEditing: true,
        isSaving: true,
        error: "Some error",
      });

      useScanStore.getState().resetScan();

      const state = useScanStore.getState();
      expect(state.scanStatus).toBe("idle");
      expect(state.jobData).toBeNull();
      expect(state.editedJobData).toBeNull();
      expect(state.isEditing).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // ─── saveJob ────────────────────────────────────────────────────

  describe("saveJob", () => {
    it("calls apiClient.saveJob with correct payload and clears saving state", async () => {
      const { apiClient } = await import("../lib/api-client");
      (apiClient.saveJob as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      useScanStore.setState({
        scanStatus: "success",
        jobData: {
          title: "Engineer",
          company: "Acme",
          location: "Remote",
          description: "Build things.",
          salary: "$120k",
          employmentType: "Full-time",
          sourceUrl: "https://example.com/job",
        },
      });

      await useScanStore.getState().saveJob("token123");

      expect(apiClient.saveJob).toHaveBeenCalledWith("token123", {
        title: "Engineer",
        company: "Acme",
        description: "Build things.",
        location: "Remote",
        salary: "$120k",
        employmentType: "Full-time",
        sourceUrl: "https://example.com/job",
      });
      expect(useScanStore.getState().isSaving).toBe(false);
    });

    it("does not call API when required fields are empty", async () => {
      const { apiClient } = await import("../lib/api-client");

      useScanStore.setState({
        scanStatus: "success",
        jobData: { title: "", company: "", location: "", description: "" },
      });

      await useScanStore.getState().saveJob("token123");

      expect(apiClient.saveJob).not.toHaveBeenCalled();
    });

    it("sets error on save failure", async () => {
      const { apiClient } = await import("../lib/api-client");
      (apiClient.saveJob as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Network error")
      );

      useScanStore.setState({
        scanStatus: "success",
        jobData: {
          title: "Engineer",
          company: "Acme",
          location: "Remote",
          description: "Build things.",
        },
      });

      await useScanStore.getState().saveJob("token123");

      const state = useScanStore.getState();
      expect(state.isSaving).toBe(false);
      expect(state.error).toBe("Network error");
    });

    it("commits edited data as jobData on success when in edit mode", async () => {
      const { apiClient } = await import("../lib/api-client");
      (apiClient.saveJob as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      useScanStore.setState({
        scanStatus: "success",
        jobData: { title: "Engineer", company: "Acme", location: "Remote", description: "Old desc" },
        editedJobData: { title: "Senior Engineer", company: "Acme", location: "NYC", description: "New desc" },
        isEditing: true,
      });

      await useScanStore.getState().saveJob("token123");

      const state = useScanStore.getState();
      expect(state.jobData?.title).toBe("Senior Engineer");
      expect(state.jobData?.location).toBe("NYC");
      expect(state.isEditing).toBe(false);
      expect(state.editedJobData).toBeNull();
    });
  });

  // ─── confidence / isRefining / board (EXT-5.5) ────────────────────

  describe("setScanResult with confidence and board", () => {
    it("accepts optional confidence and board params", () => {
      const confidence = { title: 0.95, company: 0.85, description: 0.60, location: 0.40, salary: 0 };
      useScanStore.getState().setScanResult(
        { title: "Eng", company: "Acme", description: "Desc" },
        confidence,
        "linkedin"
      );

      const state = useScanStore.getState();
      expect(state.confidence).toEqual(confidence);
      expect(state.board).toBe("linkedin");
    });

    it("keeps existing confidence/board when params are undefined", () => {
      useScanStore.setState({ confidence: { title: 0.5, company: 0.5, description: 0.5, location: 0, salary: 0 }, board: "indeed" });
      useScanStore.getState().setScanResult({ title: "New" });

      const state = useScanStore.getState();
      // undefined params should not overwrite
      expect(state.confidence).toEqual({ title: 0.5, company: 0.5, description: 0.5, location: 0, salary: 0 });
      expect(state.board).toBe("indeed");
    });
  });

  describe("setRefining", () => {
    it("sets isRefining to true", () => {
      useScanStore.getState().setRefining(true);
      expect(useScanStore.getState().isRefining).toBe(true);
    });

    it("sets isRefining to false", () => {
      useScanStore.setState({ isRefining: true });
      useScanStore.getState().setRefining(false);
      expect(useScanStore.getState().isRefining).toBe(false);
    });
  });

  describe("setConfidence", () => {
    it("stores confidence data", () => {
      const conf = { title: 0.95, company: 0.85, description: 0.60, location: 0.40, salary: 0 };
      useScanStore.getState().setConfidence(conf);
      expect(useScanStore.getState().confidence).toEqual(conf);
    });

    it("clears confidence with null", () => {
      useScanStore.setState({ confidence: { title: 1, company: 1, description: 1, location: 1, salary: 1 } });
      useScanStore.getState().setConfidence(null);
      expect(useScanStore.getState().confidence).toBeNull();
    });
  });

  describe("setBoard", () => {
    it("stores board name", () => {
      useScanStore.getState().setBoard("greenhouse");
      expect(useScanStore.getState().board).toBe("greenhouse");
    });

    it("clears board with null", () => {
      useScanStore.setState({ board: "linkedin" });
      useScanStore.getState().setBoard(null);
      expect(useScanStore.getState().board).toBeNull();
    });
  });

  describe("resetScan clears new fields", () => {
    it("resets confidence, isRefining, and board", () => {
      useScanStore.setState({
        scanStatus: "success",
        confidence: { title: 0.95, company: 0.85, description: 0.60, location: 0.40, salary: 0 },
        isRefining: true,
        board: "linkedin",
      });

      useScanStore.getState().resetScan();

      const state = useScanStore.getState();
      expect(state.confidence).toBeNull();
      expect(state.isRefining).toBe(false);
      expect(state.board).toBeNull();
    });
  });
});
