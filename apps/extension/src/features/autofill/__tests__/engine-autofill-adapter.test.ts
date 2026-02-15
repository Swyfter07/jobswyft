/**
 * Engine Autofill Adapter Tests — Verifies the orchestration layer that
 * bridges the side panel with content scripts via Chrome message passing.
 *
 * Mocks chrome.webNavigation and chrome.tabs APIs, plus the pure
 * @jobswyft/engine functions (mapFieldsToData, buildFillInstructions).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Chrome API Mock ─────────────────────────────────────────────────────────

const mockChrome = {
  webNavigation: {
    getAllFrames: vi.fn(),
  },
  tabs: {
    sendMessage: vi.fn(),
  },
};
vi.stubGlobal("chrome", mockChrome);

// ─── Engine Mock ─────────────────────────────────────────────────────────────

vi.mock("@jobswyft/engine", () => ({
  mapFieldsToData: vi.fn((fields: any[]) =>
    fields.map((f: any) => ({
      ...f,
      status: "ready",
      mappedValue: "test",
      valueSource: "personal",
    })),
  ),
  buildFillInstructions: vi.fn((mapped: any[]) =>
    mapped
      .filter((f: any) => f.status === "ready")
      .map((f: any) => ({
        selector: f.selector,
        value: f.mappedValue,
        inputType: f.inputType,
        stableId: f.stableId,
      })),
  ),
}));

import {
  detectAndClassifyFields,
  mapAndBuildInstructions,
  executeFill,
  executeUndoFill,
} from "../engine-autofill-adapter";

import { mapFieldsToData, buildFillInstructions } from "@jobswyft/engine";

import type { SerializedDetectedField } from "@/lib/message-types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeField(
  overrides: Partial<SerializedDetectedField> = {},
): SerializedDetectedField {
  return {
    stableId: "af-0-firstName",
    opid: "opid-1",
    inputType: "text",
    label: "First Name",
    fieldType: "firstName" as any,
    confidence: 0.95,
    category: "personal" as any,
    signals: [],
    selector: "#first-name",
    currentValue: "",
    isVisible: true,
    isDisabled: false,
    isRequired: true,
    registryEntryId: null,
    board: null,
    frameId: 0,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("detectAndClassifyFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1
  it("returns empty array when getAllFrames returns no frames", async () => {
    mockChrome.webNavigation.getAllFrames.mockResolvedValue([]);

    const result = await detectAndClassifyFields(1, null);

    expect(result).toEqual([]);
    expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  // Test 2
  it("returns empty array when getAllFrames returns null", async () => {
    mockChrome.webNavigation.getAllFrames.mockResolvedValue(null);

    const result = await detectAndClassifyFields(1, null);

    expect(result).toEqual([]);
  });

  // Test 3
  it("sends autofill.detect message with correct board to each frame", async () => {
    mockChrome.webNavigation.getAllFrames.mockResolvedValue([
      { frameId: 0 },
      { frameId: 1 },
    ]);
    mockChrome.tabs.sendMessage.mockResolvedValue({
      type: "autofill.detect.result",
      payload: { fields: [], board: "greenhouse", url: "https://example.com", frameId: 0 },
    });

    await detectAndClassifyFields(42, "greenhouse");

    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledTimes(2);

    // Verify first frame call
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
      42,
      { type: "autofill.detect", payload: { board: "greenhouse" } },
      { frameId: 0 },
    );

    // Verify second frame call
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
      42,
      { type: "autofill.detect", payload: { board: "greenhouse" } },
      { frameId: 1 },
    );
  });

  // Test 4
  it("aggregates fields from multiple frames with de-duplication by stableId", async () => {
    const fieldA = makeField({ stableId: "af-0-firstName", selector: "#first" });
    const fieldB = makeField({ stableId: "af-1-lastName", selector: "#last" });
    const fieldDuplicate = makeField({ stableId: "af-0-firstName", selector: "#first" });

    mockChrome.webNavigation.getAllFrames.mockResolvedValue([
      { frameId: 0 },
      { frameId: 1 },
    ]);

    // Frame 0 returns fieldA and fieldB
    mockChrome.tabs.sendMessage.mockImplementation(
      (_tabId: number, _msg: any, opts: { frameId: number }) => {
        if (opts.frameId === 0) {
          return Promise.resolve({
            type: "autofill.detect.result",
            payload: {
              fields: [fieldA, fieldB],
              board: null,
              url: "https://example.com",
              frameId: 0,
            },
          });
        }
        // Frame 1 returns fieldDuplicate (same stableId as fieldA)
        return Promise.resolve({
          type: "autofill.detect.result",
          payload: {
            fields: [fieldDuplicate],
            board: null,
            url: "https://example.com",
            frameId: 1,
          },
        });
      },
    );

    const result = await detectAndClassifyFields(1, null);

    // Should have 2 unique fields, not 3
    expect(result).toHaveLength(2);
    expect(result[0].stableId).toBe("af-0-firstName");
    expect(result[0].frameId).toBe(0); // First occurrence wins
    expect(result[1].stableId).toBe("af-1-lastName");
    expect(result[1].frameId).toBe(0);
  });

  // Test 5
  it("handles frame communication errors gracefully (rejected promises)", async () => {
    const fieldA = makeField({ stableId: "af-0-email", selector: "#email" });

    mockChrome.webNavigation.getAllFrames.mockResolvedValue([
      { frameId: 0 },
      { frameId: 1 },
      { frameId: 2 },
    ]);

    mockChrome.tabs.sendMessage.mockImplementation(
      (_tabId: number, _msg: any, opts: { frameId: number }) => {
        if (opts.frameId === 0) {
          // Frame 0 succeeds
          return Promise.resolve({
            type: "autofill.detect.result",
            payload: {
              fields: [fieldA],
              board: null,
              url: "https://example.com",
              frameId: 0,
            },
          });
        }
        if (opts.frameId === 1) {
          // Frame 1 fails (e.g., content script not injected)
          return Promise.reject(new Error("Could not establish connection"));
        }
        // Frame 2 returns undefined (no content script listening)
        return Promise.resolve(undefined);
      },
    );

    const result = await detectAndClassifyFields(1, null);

    // Should still return the successful frame's field
    expect(result).toHaveLength(1);
    expect(result[0].stableId).toBe("af-0-email");
    expect(result[0].frameId).toBe(0);
  });

  // Test 6
  it("sets correct frameId on fields from their originating frame", async () => {
    const fieldA = makeField({ stableId: "af-0-firstName", selector: "#first" });
    const fieldB = makeField({ stableId: "af-1-lastName", selector: "#last" });

    mockChrome.webNavigation.getAllFrames.mockResolvedValue([
      { frameId: 0 },
      { frameId: 5 },
    ]);

    mockChrome.tabs.sendMessage.mockImplementation(
      (_tabId: number, _msg: any, opts: { frameId: number }) => {
        if (opts.frameId === 0) {
          return Promise.resolve({
            type: "autofill.detect.result",
            payload: {
              fields: [fieldA],
              board: null,
              url: "https://example.com",
              frameId: 0,
            },
          });
        }
        return Promise.resolve({
          type: "autofill.detect.result",
          payload: {
            fields: [fieldB],
            board: null,
            url: "https://example.com",
            frameId: 5,
          },
        });
      },
    );

    const result = await detectAndClassifyFields(1, null);

    expect(result).toHaveLength(2);
    expect(result[0].frameId).toBe(0);
    expect(result[1].frameId).toBe(5);
  });
});

// ─── mapAndBuildInstructions ─────────────────────────────────────────────────

describe("mapAndBuildInstructions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 7
  it("delegates to engine mapFieldsToData and buildFillInstructions", () => {
    const fields: SerializedDetectedField[] = [
      makeField({ stableId: "af-0-firstName", selector: "#first" }),
      makeField({ stableId: "af-1-email", selector: "#email", fieldType: "email" as any }),
    ];
    const data = { firstName: "Jane", email: "jane@example.com" } as any;

    const result = mapAndBuildInstructions(fields, data);

    // mapFieldsToData was called with the fields (cast) and data
    expect(mapFieldsToData).toHaveBeenCalledTimes(1);
    expect(mapFieldsToData).toHaveBeenCalledWith(expect.any(Array), data);

    // buildFillInstructions was called with the mapped result
    expect(buildFillInstructions).toHaveBeenCalledTimes(1);
    expect(buildFillInstructions).toHaveBeenCalledWith(result.mapped);

    // Verify structure
    expect(result.mapped).toHaveLength(2);
    expect(result.instructions).toHaveLength(2);
    expect(result.mapped[0]).toHaveProperty("status", "ready");
    expect(result.mapped[0]).toHaveProperty("mappedValue", "test");
    expect(result.instructions[0]).toHaveProperty("selector", "#first");
    expect(result.instructions[0]).toHaveProperty("value", "test");
  });

  // Test 8
  it("returns empty instructions when fields array is empty", () => {
    const result = mapAndBuildInstructions([], {} as any);

    expect(result.mapped).toEqual([]);
    expect(result.instructions).toEqual([]);
    expect(mapFieldsToData).toHaveBeenCalledWith([], expect.anything());
  });
});

// ─── executeFill ─────────────────────────────────────────────────────────────

describe("executeFill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 9
  it("returns empty result for empty instructions array", async () => {
    const result = await executeFill(1, []);

    expect(result).toEqual({
      filled: 0,
      failed: 0,
      results: [],
      undoEntries: [],
    });
    // Should not call any chrome APIs
    expect(mockChrome.webNavigation.getAllFrames).not.toHaveBeenCalled();
    expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  // Test 10
  it("returns all-failed result when no frames available", async () => {
    mockChrome.webNavigation.getAllFrames.mockResolvedValue(null);

    const instructions = [
      { selector: "#first", value: "Jane", inputType: "text", stableId: "af-0-first" },
      { selector: "#last", value: "Doe", inputType: "text", stableId: "af-1-last" },
    ];

    const result = await executeFill(1, instructions as any);

    expect(result.filled).toBe(0);
    expect(result.failed).toBe(2); // instructions.length
    expect(result.results).toEqual([]);
    expect(result.undoEntries).toEqual([]);
  });

  // Test 11
  it("sends fill message and aggregates results from multiple frames", async () => {
    mockChrome.webNavigation.getAllFrames.mockResolvedValue([
      { frameId: 0 },
      { frameId: 1 },
    ]);

    const instructions = [
      { selector: "#first", value: "Jane", inputType: "text", stableId: "af-0-first" },
      { selector: "#last", value: "Doe", inputType: "text", stableId: "af-1-last" },
    ];

    mockChrome.tabs.sendMessage.mockImplementation(
      (_tabId: number, _msg: any, opts: { frameId: number }) => {
        if (opts.frameId === 0) {
          return Promise.resolve({
            type: "autofill.fill.result",
            payload: {
              filled: 1,
              failed: 0,
              results: [
                { stableId: "af-0-first", success: true, previousValue: "", error: null },
              ],
              undoEntries: [
                { selector: "#first", previousValue: "", inputType: "text", stableId: "af-0-first" },
              ],
            },
          });
        }
        return Promise.resolve({
          type: "autofill.fill.result",
          payload: {
            filled: 1,
            failed: 0,
            results: [
              { stableId: "af-1-last", success: true, previousValue: "", error: null },
            ],
            undoEntries: [
              { selector: "#last", previousValue: "", inputType: "text", stableId: "af-1-last" },
            ],
          },
        });
      },
    );

    const result = await executeFill(1, instructions as any);

    expect(result.filled).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(2);
    expect(result.undoEntries).toHaveLength(2);

    // Verify message sent to both frames
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      { type: "autofill.fill", payload: { instructions } },
      { frameId: 0 },
    );
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      { type: "autofill.fill", payload: { instructions } },
      { frameId: 1 },
    );
  });

  // Test 12
  it("de-duplicates fill results by stableId across frames", async () => {
    mockChrome.webNavigation.getAllFrames.mockResolvedValue([
      { frameId: 0 },
      { frameId: 1 },
    ]);

    const instructions = [
      { selector: "#first", value: "Jane", inputType: "text", stableId: "af-0-first" },
    ];

    // Both frames report filling the same stableId
    const fillResponse = {
      type: "autofill.fill.result",
      payload: {
        filled: 1,
        failed: 0,
        results: [
          { stableId: "af-0-first", success: true, previousValue: "", error: null },
        ],
        undoEntries: [
          { selector: "#first", previousValue: "", inputType: "text", stableId: "af-0-first" },
        ],
      },
    };

    mockChrome.tabs.sendMessage.mockResolvedValue(fillResponse);

    const result = await executeFill(1, instructions as any);

    // Results de-duplicated by stableId, but undoEntries are not de-duped
    expect(result.results).toHaveLength(1);
    expect(result.filled).toBe(1);
    expect(result.undoEntries).toHaveLength(2); // Both frames' undo entries collected
  });

  // Test 13
  it("handles mixed success/failure results correctly", async () => {
    mockChrome.webNavigation.getAllFrames.mockResolvedValue([
      { frameId: 0 },
    ]);

    const instructions = [
      { selector: "#first", value: "Jane", inputType: "text", stableId: "af-0-first" },
      { selector: "#missing", value: "val", inputType: "text", stableId: "af-1-missing" },
    ];

    mockChrome.tabs.sendMessage.mockResolvedValue({
      type: "autofill.fill.result",
      payload: {
        filled: 1,
        failed: 1,
        results: [
          { stableId: "af-0-first", success: true, previousValue: "", error: null },
          { stableId: "af-1-missing", success: false, previousValue: null, error: "Element not found" },
        ],
        undoEntries: [
          { selector: "#first", previousValue: "", inputType: "text", stableId: "af-0-first" },
        ],
      },
    });

    const result = await executeFill(1, instructions as any);

    expect(result.filled).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results).toHaveLength(2);
    expect(result.undoEntries).toHaveLength(1);
  });
});

// ─── executeUndoFill ─────────────────────────────────────────────────────────

describe("executeUndoFill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 14
  it("returns zeros for empty entries array", async () => {
    const result = await executeUndoFill(1, []);

    expect(result).toEqual({ undone: 0, failed: 0 });
    expect(mockChrome.webNavigation.getAllFrames).not.toHaveBeenCalled();
  });

  // Test 15
  it("returns all-failed when no frames available", async () => {
    mockChrome.webNavigation.getAllFrames.mockResolvedValue(null);

    const entries = [
      { selector: "#first", previousValue: "", inputType: "text", stableId: "af-0-first" },
      { selector: "#last", previousValue: "", inputType: "text", stableId: "af-1-last" },
    ];

    const result = await executeUndoFill(1, entries as any);

    expect(result.undone).toBe(0);
    expect(result.failed).toBe(2); // entries.length
  });

  // Test 16
  it("sends undo message and returns aggregated counts from frames", async () => {
    mockChrome.webNavigation.getAllFrames.mockResolvedValue([
      { frameId: 0 },
      { frameId: 1 },
    ]);

    const entries = [
      { selector: "#first", previousValue: "old-first", inputType: "text", stableId: "af-0-first" },
      { selector: "#last", previousValue: "old-last", inputType: "text", stableId: "af-1-last" },
    ];

    mockChrome.tabs.sendMessage.mockImplementation(
      (_tabId: number, _msg: any, opts: { frameId: number }) => {
        if (opts.frameId === 0) {
          return Promise.resolve({
            type: "autofill.undo.result",
            payload: { undone: 1, failed: 0 },
          });
        }
        return Promise.resolve({
          type: "autofill.undo.result",
          payload: { undone: 1, failed: 0 },
          });
      },
    );

    const result = await executeUndoFill(1, entries as any);

    expect(result.undone).toBe(2);
    expect(result.failed).toBe(0);

    // Verify message sent to both frames
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      { type: "autofill.undo", payload: { entries } },
      { frameId: 0 },
    );
    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      { type: "autofill.undo", payload: { entries } },
      { frameId: 1 },
    );
  });

  // Test 17
  it("ignores rejected frame promises and aggregates only fulfilled results", async () => {
    mockChrome.webNavigation.getAllFrames.mockResolvedValue([
      { frameId: 0 },
      { frameId: 1 },
      { frameId: 2 },
    ]);

    const entries = [
      { selector: "#first", previousValue: "", inputType: "text", stableId: "af-0-first" },
    ];

    mockChrome.tabs.sendMessage.mockImplementation(
      (_tabId: number, _msg: any, opts: { frameId: number }) => {
        if (opts.frameId === 0) {
          return Promise.resolve({
            type: "autofill.undo.result",
            payload: { undone: 1, failed: 0 },
          });
        }
        if (opts.frameId === 1) {
          return Promise.reject(new Error("Frame disconnected"));
        }
        // Frame 2 returns undefined (no response)
        return Promise.resolve(undefined);
      },
    );

    const result = await executeUndoFill(1, entries as any);

    // Only frame 0's results should be counted
    expect(result.undone).toBe(1);
    expect(result.failed).toBe(0);
  });
});
