import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAutofillStore } from "./autofill-store";
import type { DetectionResult, FieldFillResult, AutofillData, UndoState } from "@jobswyft/engine";

// Mock chrome.storage adapter
vi.mock("../lib/chrome-storage-adapter", () => ({
  chromeStorageAdapter: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

// Helper to create a minimal detection result
function makeDetectionResult(overrides?: Partial<DetectionResult>): DetectionResult {
  return {
    fields: [
      {
        stableId: "field-1",
        selector: "#first-name",
        label: "First Name",
        fieldType: "firstName",
        confidence: 0.95,
        category: "personal" as never,
        isRequired: true,
        isVisible: true,
        isDisabled: false,
        currentValue: "",
        inputType: "text",
        signals: [],
      },
      {
        stableId: "field-2",
        selector: "#email",
        label: "Email",
        fieldType: "email",
        confidence: 0.9,
        category: "personal" as never,
        isRequired: true,
        isVisible: true,
        isDisabled: false,
        currentValue: "existing@test.com",
        inputType: "email",
        signals: [],
      },
    ],
    board: "greenhouse",
    url: "https://boards.greenhouse.io/company/jobs/123",
    timestamp: Date.now(),
    durationMs: 150,
    totalElementsScanned: 42,
    ...overrides,
  };
}

function makeAutofillData(overrides?: Partial<AutofillData>): AutofillData {
  return {
    personal: {
      firstName: "John",
      lastName: "Doe",
      fullName: "John Doe",
      email: "john@test.com",
      phone: "+1234567890",
      location: "San Francisco, CA",
      linkedinUrl: "https://linkedin.com/in/johndoe",
      portfolioUrl: null,
    },
    workAuthorization: "Yes",
    salaryExpectation: "$120k",
    ...overrides,
  } as AutofillData;
}

describe("useAutofillStore", () => {
  beforeEach(() => {
    useAutofillStore.setState({
      detectionStatus: "idle",
      detectionResult: null,
      detectionError: null,
      fields: [],
      autofillData: null,
      fillStatus: "idle",
      filledCount: 0,
      fillErrors: [],
      pageUrl: null,
      board: null,
      undoState: null,
    });
    vi.clearAllMocks();
  });

  // ─── Initial State ─────────────────────────────────────────────────

  describe("initial state", () => {
    it("should have correct initial values", () => {
      const state = useAutofillStore.getState();
      expect(state.detectionStatus).toBe("idle");
      expect(state.detectionResult).toBeNull();
      expect(state.detectionError).toBeNull();
      expect(state.fields).toEqual([]);
      expect(state.autofillData).toBeNull();
      expect(state.fillStatus).toBe("idle");
      expect(state.filledCount).toBe(0);
      expect(state.fillErrors).toEqual([]);
      expect(state.pageUrl).toBeNull();
      expect(state.board).toBeNull();
      expect(state.undoState).toBeNull();
    });
  });

  // ─── setDetecting ──────────────────────────────────────────────────

  describe("setDetecting", () => {
    it("should transition to detecting state and clear transient data", () => {
      useAutofillStore.setState({
        detectionStatus: "detected",
        fields: [{ stableId: "f1" }] as never[],
        fillStatus: "done",
        filledCount: 3,
        fillErrors: ["some error"],
      });

      useAutofillStore.getState().setDetecting();

      const state = useAutofillStore.getState();
      expect(state.detectionStatus).toBe("detecting");
      expect(state.detectionError).toBeNull();
      expect(state.fields).toEqual([]);
      expect(state.fillStatus).toBe("idle");
      expect(state.filledCount).toBe(0);
      expect(state.fillErrors).toEqual([]);
    });

    it("should clear expired undo state (>5 min old)", () => {
      const expiredUndo: UndoState = {
        entries: [{ stableId: "f1", selector: "#f1", previousValue: "old", inputType: "text" }],
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        pageUrl: "https://example.com",
      };
      useAutofillStore.setState({ undoState: expiredUndo });

      useAutofillStore.getState().setDetecting();

      expect(useAutofillStore.getState().undoState).toBeNull();
    });

    it("should preserve non-expired undo state", () => {
      const recentUndo: UndoState = {
        entries: [{ stableId: "f1", selector: "#f1", previousValue: "old", inputType: "text" }],
        timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago
        pageUrl: "https://example.com",
      };
      useAutofillStore.setState({ undoState: recentUndo });

      useAutofillStore.getState().setDetecting();

      expect(useAutofillStore.getState().undoState).toEqual(recentUndo);
    });
  });

  // ─── setDetectionResult ────────────────────────────────────────────

  describe("setDetectionResult", () => {
    it("should set detection result and map fields", () => {
      const result = makeDetectionResult();

      useAutofillStore.getState().setDetectionResult(result);

      const state = useAutofillStore.getState();
      expect(state.detectionStatus).toBe("detected");
      expect(state.detectionResult).toEqual(result);
      expect(state.detectionError).toBeNull();
      expect(state.pageUrl).toBe(result.url);
      expect(state.board).toBe("greenhouse");
      expect(state.fields).toHaveLength(2);

      // Field without current value → "missing"
      expect(state.fields[0].status).toBe("missing");
      // Field with current value → "filled"
      expect(state.fields[1].status).toBe("filled");
    });
  });

  // ─── setDetectionError ─────────────────────────────────────────────

  describe("setDetectionError", () => {
    it("should set error state", () => {
      useAutofillStore.getState().setDetectionError("Detection failed");

      const state = useAutofillStore.getState();
      expect(state.detectionStatus).toBe("error");
      expect(state.detectionError).toBe("Detection failed");
    });
  });

  // ─── mapFields ─────────────────────────────────────────────────────

  describe("mapFields", () => {
    it("should map detected fields to autofill data values", () => {
      const result = makeDetectionResult();
      const data = makeAutofillData();

      useAutofillStore.getState().setDetectionResult(result);
      useAutofillStore.getState().setAutofillData(data);
      useAutofillStore.getState().mapFields({});

      const state = useAutofillStore.getState();
      // firstName field should be "ready" (has value from autofill data)
      const firstNameField = state.fields.find((f) => f.fieldType === "firstName");
      expect(firstNameField?.status).toBe("ready");
      expect(firstNameField?.mappedValue).toBe("John");
      expect(firstNameField?.valueSource).toBe("personal");

      // email field should stay "filled" (already has current value)
      const emailField = state.fields.find((f) => f.fieldType === "email");
      expect(emailField?.status).toBe("filled");
    });

    it("should not map if no autofillData is set", () => {
      const result = makeDetectionResult();
      useAutofillStore.getState().setDetectionResult(result);

      useAutofillStore.getState().mapFields({});

      // Fields should remain unmapped
      const state = useAutofillStore.getState();
      expect(state.fields[0].mappedValue).toBeNull();
    });
  });

  // ─── applyFillResults ──────────────────────────────────────────────

  describe("applyFillResults", () => {
    it("should update field statuses and create undo state", () => {
      const result = makeDetectionResult();
      useAutofillStore.getState().setDetectionResult(result);
      useAutofillStore.setState({ pageUrl: "https://example.com" });

      const fillResults: FieldFillResult[] = [
        { stableId: "field-1", success: true, previousValue: "" },
        { stableId: "field-2", success: false, error: "Element not found" },
      ];

      useAutofillStore.getState().applyFillResults(fillResults);

      const state = useAutofillStore.getState();
      expect(state.filledCount).toBe(1);

      const field1 = state.fields.find((f) => f.stableId === "field-1");
      expect(field1?.status).toBe("filled");

      const field2 = state.fields.find((f) => f.stableId === "field-2");
      expect(field2?.status).toBe("error");

      // Undo state should be created for successful fills
      expect(state.undoState).not.toBeNull();
      expect(state.undoState?.entries).toHaveLength(1);
      expect(state.undoState?.entries[0].stableId).toBe("field-1");
    });
  });

  // ─── canUndo ───────────────────────────────────────────────────────

  describe("canUndo", () => {
    it("should return false when no undo state", () => {
      expect(useAutofillStore.getState().canUndo()).toBe(false);
    });

    it("should return true for recent undo on same page", () => {
      useAutofillStore.setState({
        pageUrl: "https://example.com",
        undoState: {
          entries: [{ stableId: "f1", selector: "#f1", previousValue: "", inputType: "text" }],
          timestamp: Date.now(),
          pageUrl: "https://example.com",
        },
      });

      expect(useAutofillStore.getState().canUndo()).toBe(true);
    });

    it("should return false for expired undo (>5 minutes)", () => {
      useAutofillStore.setState({
        pageUrl: "https://example.com",
        undoState: {
          entries: [{ stableId: "f1", selector: "#f1", previousValue: "", inputType: "text" }],
          timestamp: Date.now() - 6 * 60 * 1000,
          pageUrl: "https://example.com",
        },
      });

      expect(useAutofillStore.getState().canUndo()).toBe(false);
    });

    it("should return false when page URL doesn't match", () => {
      useAutofillStore.setState({
        pageUrl: "https://other.com",
        undoState: {
          entries: [{ stableId: "f1", selector: "#f1", previousValue: "", inputType: "text" }],
          timestamp: Date.now(),
          pageUrl: "https://example.com",
        },
      });

      expect(useAutofillStore.getState().canUndo()).toBe(false);
    });
  });

  // ─── clearExpiredUndo ──────────────────────────────────────────────

  describe("clearExpiredUndo", () => {
    it("should clear expired undo state", () => {
      useAutofillStore.setState({
        undoState: {
          entries: [{ stableId: "f1", selector: "#f1", previousValue: "", inputType: "text" }],
          timestamp: Date.now() - 6 * 60 * 1000,
          pageUrl: "https://example.com",
        },
      });

      useAutofillStore.getState().clearExpiredUndo();

      expect(useAutofillStore.getState().undoState).toBeNull();
    });

    it("should not clear non-expired undo state", () => {
      const recentUndo: UndoState = {
        entries: [{ stableId: "f1", selector: "#f1", previousValue: "", inputType: "text" }],
        timestamp: Date.now() - 2 * 60 * 1000,
        pageUrl: "https://example.com",
      };
      useAutofillStore.setState({ undoState: recentUndo });

      useAutofillStore.getState().clearExpiredUndo();

      expect(useAutofillStore.getState().undoState).toEqual(recentUndo);
    });
  });

  // ─── resetAutofill ─────────────────────────────────────────────────

  describe("resetAutofill", () => {
    it("should clear all detection/fill state but preserve autofillData", () => {
      useAutofillStore.setState({
        detectionStatus: "detected",
        detectionResult: makeDetectionResult(),
        detectionError: null,
        fields: [{ stableId: "f1" }] as never[],
        autofillData: makeAutofillData(),
        fillStatus: "done",
        filledCount: 3,
        fillErrors: ["err"],
        pageUrl: "https://example.com",
        board: "greenhouse",
      });

      useAutofillStore.getState().resetAutofill();

      const state = useAutofillStore.getState();
      expect(state.detectionStatus).toBe("idle");
      expect(state.detectionResult).toBeNull();
      expect(state.detectionError).toBeNull();
      expect(state.fields).toEqual([]);
      expect(state.fillStatus).toBe("idle");
      expect(state.filledCount).toBe(0);
      expect(state.fillErrors).toEqual([]);
      expect(state.pageUrl).toBeNull();
      expect(state.board).toBeNull();

      // autofillData is preserved (user-scoped, not page-scoped)
      expect(state.autofillData).not.toBeNull();
    });
  });

  // ─── Persist partialize ────────────────────────────────────────────

  describe("persist partialize", () => {
    it("should exclude signals, registryEntryId, and frameId from persisted fields", () => {
      // Verify partialize config via the store's persist API
      const persistOptions = (useAutofillStore as unknown as { persist: { getOptions: () => { partialize: (state: unknown) => unknown } } }).persist.getOptions();
      const mockState = {
        detectionStatus: "detected",
        pageUrl: "https://example.com",
        board: "greenhouse",
        undoState: null,
        fields: [
          {
            stableId: "f1",
            selector: "#f1",
            label: "Name",
            fieldType: "firstName",
            confidence: 0.9,
            category: "personal",
            isRequired: true,
            isVisible: true,
            isDisabled: false,
            currentValue: "",
            inputType: "text",
            status: "ready",
            mappedValue: "John",
            valueSource: "personal",
            // These should be excluded:
            signals: [{ type: "label", value: "First Name" }],
            registryEntryId: "reg-1",
            frameId: 0,
          },
        ],
      };

      const partialized = persistOptions.partialize(mockState) as Record<string, unknown>;
      const fields = partialized.fields as Array<Record<string, unknown>>;

      expect(fields[0]).not.toHaveProperty("signals");
      expect(fields[0]).not.toHaveProperty("registryEntryId");
      expect(fields[0]).not.toHaveProperty("frameId");
      expect(fields[0]).toHaveProperty("stableId", "f1");
      expect(fields[0]).toHaveProperty("status", "ready");
    });
  });
});
