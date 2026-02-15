/**
 * Tests for content-engine.content.ts
 *
 * Integration tests that exercise the WXT content script by mocking
 * defineContentScript, chrome APIs, and the @jobswyft/engine module.
 * The returned config's main() is called to register the message listener,
 * then test messages are dispatched through the listener.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mock fns (available before any module evaluation) ──────────────
const {
  mockDetectFormFields,
  mockClassifyFields,
  mockExecuteFillInstructions,
  mockCaptureUndoSnapshot,
  mockExecuteUndo,
  listeners,
  mockChrome,
} = vi.hoisted(() => {
  const listeners: Array<
    (msg: any, sender: any, sendResponse: (r: unknown) => void) => boolean | undefined
  > = [];

  const mockChrome = {
    runtime: {
      onMessage: {
        addListener: vi.fn((fn: any) => listeners.push(fn)),
      },
    },
    dom: {
      openOrClosedShadowRoot: vi.fn(() => null),
    },
  };

  // Set globals BEFORE any module evaluation
  (globalThis as any).defineContentScript = vi.fn((config: any) => config);
  (globalThis as any).chrome = mockChrome;

  return {
    mockDetectFormFields: vi.fn(() => []),
    mockClassifyFields: vi.fn((fields: any[]) => fields),
    mockExecuteFillInstructions: vi.fn(() => ({
      filled: 0,
      failed: 0,
      results: [],
    })),
    mockCaptureUndoSnapshot: vi.fn(() => []),
    mockExecuteUndo: vi.fn(() => ({ undone: 0, failed: 0 })),
    listeners,
    mockChrome,
  };
});

// ─── Mock @jobswyft/engine ──────────────────────────────────────────────────
vi.mock("@jobswyft/engine", () => ({
  detectFormFields: (...args: any[]) => mockDetectFormFields(...args),
  classifyFields: (...args: any[]) => mockClassifyFields(...args),
  executeFillInstructions: (...args: any[]) =>
    mockExecuteFillInstructions(...args),
  captureUndoSnapshot: (...args: any[]) => mockCaptureUndoSnapshot(...args),
  executeUndo: (...args: any[]) => mockExecuteUndo(...args),
}));

// ─── Import the content script (triggers defineContentScript call) ──────────
import contentConfig from "../content-engine.content";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Reset all mocks and re-register the listener by calling main() */
function setupListener(): void {
  listeners.length = 0;
  mockChrome.runtime.onMessage.addListener.mockClear();
  (contentConfig as any).main();
}

/** Send a message through the registered listener and collect the response */
function sendMessage(
  msg: any,
): Promise<{ returnValue: boolean | undefined; response: any }> {
  return new Promise((resolve) => {
    const listener = listeners[0];
    if (!listener) {
      throw new Error("No listener registered — did you call setupListener()?");
    }

    let response: any;
    const sendResponse = (r: unknown) => {
      response = r;
    };

    const returnValue = listener(msg, {} as any, sendResponse);

    // For async handlers (return true), wait a tick for the promise to resolve
    if (returnValue === true) {
      setTimeout(() => resolve({ returnValue, response }), 50);
    } else {
      resolve({ returnValue, response });
    }
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("content-engine.content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupListener();
  });

  // ── Test 1: Unknown message types ──────────────────────────────────────────

  it("returns false for unknown message types", async () => {
    const { returnValue } = await sendMessage({
      type: "some.unknown.type",
      payload: {},
    });

    expect(returnValue).toBe(false);
  });

  // ── Test 2: Messages without a type string ─────────────────────────────────

  it("returns false for messages without a type string", async () => {
    const { returnValue: noType } = await sendMessage({ payload: {} });
    expect(noType).toBe(false);

    const { returnValue: numericType } = await sendMessage({
      type: 123,
      payload: {},
    });
    expect(numericType).toBe(false);

    const { returnValue: boolType } = await sendMessage({
      type: true,
      payload: {},
    });
    expect(boolType).toBe(false);
  });

  // ── Test 3: Null / undefined messages ──────────────────────────────────────

  it("returns false for null and undefined messages", async () => {
    const { returnValue: nullResult } = await sendMessage(null);
    expect(nullResult).toBe(false);

    const { returnValue: undefinedResult } = await sendMessage(undefined);
    expect(undefinedResult).toBe(false);
  });

  // ── Test 4: autofill.detect — calls engine and returns serialized fields ──

  it("autofill.detect calls detectFormFields and classifyFields, returns serialized fields", async () => {
    const fakeField = {
      stableId: "jf-field-0",
      selector: "[data-jf-opid='jf-field-0']",
      label: "First Name",
      fieldType: "firstName",
      confidence: 0.95,
      category: "personal",
      isRequired: true,
      isVisible: true,
      isDisabled: false,
      currentValue: "",
      inputType: "text",
      signals: [
        {
          signal: "name-id-regex",
          rawValue: "firstName",
          suggestedType: "firstName",
          weight: 0.6,
          matched: true,
          reason: "Matched pattern",
        },
      ],
      registryEntryId: null,
      board: null,
      frameId: 0,
      // Non-serializable properties that should be stripped
      element: { tagName: "INPUT" } as unknown as Element,
    };

    mockDetectFormFields.mockReturnValue([fakeField]);
    mockClassifyFields.mockReturnValue([fakeField]);

    const { returnValue, response } = await sendMessage({
      type: "autofill.detect",
      payload: { board: "greenhouse" },
    });

    expect(returnValue).toBe(true);
    expect(mockDetectFormFields).toHaveBeenCalledWith(document, {
      board: "greenhouse",
    });
    expect(mockClassifyFields).toHaveBeenCalled();

    expect(response).toBeDefined();
    expect(response.type).toBe("autofill.detect.result");
    expect(response.payload.fields).toHaveLength(1);
    expect(response.payload.board).toBe("greenhouse");
    expect(response.payload.url).toBe(location.href);

    // Verify serialization stripped the Element ref
    const serialized = response.payload.fields[0];
    expect(serialized.stableId).toBe("jf-field-0");
    expect(serialized.opid).toBe("jf-field-0");
    expect(serialized.fieldType).toBe("firstName");
    expect(serialized).not.toHaveProperty("element");
  });

  // ── Test 5: autofill.fill — captures undo snapshot and fills ──────────────

  it("autofill.fill calls captureUndoSnapshot and executeFillInstructions", async () => {
    const undoEntries = [
      {
        stableId: "jf-field-0",
        selector: "[data-jf-opid='jf-field-0']",
        previousValue: "",
        inputType: "text",
      },
    ];
    const fillResult = {
      filled: 1,
      failed: 0,
      results: [
        {
          stableId: "jf-field-0",
          selector: "[data-jf-opid='jf-field-0']",
          success: true,
          previousValue: "",
          error: null,
        },
      ],
    };

    mockCaptureUndoSnapshot.mockReturnValue(undoEntries);
    mockExecuteFillInstructions.mockReturnValue(fillResult);

    const instructions = [
      {
        selector: "[data-jf-opid='jf-field-0']",
        value: "John",
        inputType: "text",
        stableId: "jf-field-0",
      },
    ];

    const { returnValue, response } = await sendMessage({
      type: "autofill.fill",
      payload: { instructions },
    });

    expect(returnValue).toBe(true);
    expect(mockCaptureUndoSnapshot).toHaveBeenCalledWith(
      document,
      instructions,
    );
    expect(mockExecuteFillInstructions).toHaveBeenCalledWith(
      document,
      instructions,
    );

    expect(response).toBeDefined();
    expect(response.type).toBe("autofill.fill.result");
    expect(response.payload.filled).toBe(1);
    expect(response.payload.failed).toBe(0);
    expect(response.payload.results).toHaveLength(1);
    expect(response.payload.undoEntries).toEqual(undoEntries);
  });

  // ── Test 6: autofill.undo — calls executeUndo ─────────────────────────────

  it("autofill.undo calls executeUndo and returns result", async () => {
    mockExecuteUndo.mockReturnValue({ undone: 2, failed: 0 });

    const entries = [
      {
        stableId: "jf-field-0",
        selector: "[data-jf-opid='jf-field-0']",
        previousValue: "",
        inputType: "text",
      },
      {
        stableId: "jf-field-1",
        selector: "[data-jf-opid='jf-field-1']",
        previousValue: "old@example.com",
        inputType: "email",
      },
    ];

    const { returnValue, response } = await sendMessage({
      type: "autofill.undo",
      payload: { entries },
    });

    expect(returnValue).toBe(true);
    expect(mockExecuteUndo).toHaveBeenCalledWith(document, entries);

    expect(response).toBeDefined();
    expect(response.type).toBe("autofill.undo.result");
    expect(response.payload.undone).toBe(2);
    expect(response.payload.failed).toBe(0);
  });

  // ── Test 7: autofill.detect — handles errors gracefully ───────────────────

  it("autofill.detect handles engine errors gracefully", async () => {
    mockDetectFormFields.mockImplementation(() => {
      throw new Error("Engine detection failed");
    });

    const { returnValue, response } = await sendMessage({
      type: "autofill.detect",
      payload: { board: null },
    });

    expect(returnValue).toBe(true);
    expect(response).toBeDefined();
    expect(response.type).toBe("autofill.detect.result");
    expect(response.payload.fields).toEqual([]);
    expect(response.payload.error).toBe("Engine detection failed");
    expect(response.payload.url).toBe(location.href);
  });

  // ── Test 8: autofill.fill — handles errors gracefully ─────────────────────

  it("autofill.fill handles engine errors gracefully", async () => {
    mockCaptureUndoSnapshot.mockImplementation(() => {
      throw new Error("Snapshot capture failed");
    });

    const instructions = [
      {
        selector: "[data-jf-opid='jf-field-0']",
        value: "Test",
        inputType: "text",
        stableId: "jf-field-0",
      },
      {
        selector: "[data-jf-opid='jf-field-1']",
        value: "test@example.com",
        inputType: "email",
        stableId: "jf-field-1",
      },
    ];

    const { returnValue, response } = await sendMessage({
      type: "autofill.fill",
      payload: { instructions },
    });

    expect(returnValue).toBe(true);
    expect(response).toBeDefined();
    expect(response.type).toBe("autofill.fill.result");
    expect(response.payload.filled).toBe(0);
    expect(response.payload.failed).toBe(2);
    expect(response.payload.results).toEqual([]);
    expect(response.payload.undoEntries).toEqual([]);
    expect(response.payload.error).toBe("Snapshot capture failed");
  });

  // ── Test 9: autofill.undo — handles errors gracefully ─────────────────────

  it("autofill.undo handles engine errors gracefully", async () => {
    mockExecuteUndo.mockImplementation(() => {
      throw new Error("Undo failed");
    });

    const entries = [
      {
        stableId: "jf-field-0",
        selector: "[data-jf-opid='jf-field-0']",
        previousValue: "",
        inputType: "text",
      },
    ];

    const { returnValue, response } = await sendMessage({
      type: "autofill.undo",
      payload: { entries },
    });

    expect(returnValue).toBe(true);
    expect(response).toBeDefined();
    expect(response.type).toBe("autofill.undo.result");
    expect(response.payload.undone).toBe(0);
    expect(response.payload.failed).toBe(1);
    expect(response.payload.error).toBe("Undo failed");
  });

  // ── Test 10: autofill.detect — non-Error thrown is stringified ─────────────

  it("autofill.detect stringifies non-Error thrown values", async () => {
    mockDetectFormFields.mockImplementation(() => {
      throw "raw string error"; // eslint-disable-line no-throw-literal
    });

    const { response } = await sendMessage({
      type: "autofill.detect",
      payload: { board: null },
    });

    expect(response.type).toBe("autofill.detect.result");
    expect(response.payload.error).toBe("raw string error");
  });

  // ── Test 11: Listener registration ─────────────────────────────────────────

  it("registers exactly one message listener when main() is called", () => {
    expect(listeners).toHaveLength(1);
    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
  });

  // ── Test 12: autofill.detect with empty field list ────────────────────────

  it("autofill.detect returns empty fields array when no form fields found", async () => {
    mockDetectFormFields.mockReturnValue([]);
    mockClassifyFields.mockReturnValue([]);

    const { response } = await sendMessage({
      type: "autofill.detect",
      payload: { board: null },
    });

    expect(response.type).toBe("autofill.detect.result");
    expect(response.payload.fields).toEqual([]);
    expect(response.payload.board).toBeNull();
    expect(response.payload.frameId).toBe(0);
    expect(response.payload).not.toHaveProperty("error");
  });
});
