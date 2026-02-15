import { describe, it, expect } from "vitest";
import { isExtensionMessage } from "../message-types";

describe("isExtensionMessage", () => {
  // ─── Valid messages ──────────────────────────────────────────────────────────

  it("accepts scan.trigger message", () => {
    const msg = { type: "scan.trigger", payload: { tabId: 42 } };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  it("accepts scan.collect message", () => {
    const msg = { type: "scan.collect", payload: { board: "greenhouse" } };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  it("accepts scan.collect.result message", () => {
    const msg = {
      type: "scan.collect.result",
      payload: {
        html: "<div>job</div>",
        url: "https://example.com/job",
        jsonLd: [],
        ogMeta: {},
        hasShowMore: false,
        frameId: 0,
      },
    };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  it("accepts scan.result message", () => {
    const msg = {
      type: "scan.result",
      payload: {
        jobData: { title: "Engineer" },
        confidence: { title: 0.95 },
        board: null,
        completeness: 0.8,
        trace: null,
      },
    };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  it("accepts autofill.detect message", () => {
    const msg = { type: "autofill.detect", payload: { board: null } };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  it("accepts autofill.detect.result message", () => {
    const msg = {
      type: "autofill.detect.result",
      payload: { fields: [], board: null, url: "https://example.com", frameId: 0 },
    };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  it("accepts autofill.fill message", () => {
    const msg = { type: "autofill.fill", payload: { instructions: [] } };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  it("accepts autofill.fill.result message", () => {
    const msg = {
      type: "autofill.fill.result",
      payload: { filled: 3, failed: 0, results: [], undoEntries: [] },
    };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  it("accepts autofill.undo message", () => {
    const msg = { type: "autofill.undo", payload: { entries: [] } };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  it("accepts autofill.undo.result message", () => {
    const msg = { type: "autofill.undo.result", payload: { undone: 2, failed: 0 } };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  // ─── All valid types exhaustive check ────────────────────────────────────────

  it("accepts every valid message type string", () => {
    const validTypes = [
      "scan.trigger",
      "scan.collect",
      "scan.collect.result",
      "scan.result",
      "autofill.detect",
      "autofill.detect.result",
      "autofill.fill",
      "autofill.fill.result",
      "autofill.undo",
      "autofill.undo.result",
    ];
    for (const type of validTypes) {
      expect(isExtensionMessage({ type, payload: {} })).toBe(true);
    }
  });

  // ─── Rejection cases ────────────────────────────────────────────────────────

  it("rejects null", () => {
    expect(isExtensionMessage(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isExtensionMessage(undefined)).toBe(false);
  });

  it("rejects primitive string", () => {
    expect(isExtensionMessage("scan.trigger")).toBe(false);
  });

  it("rejects primitive number", () => {
    expect(isExtensionMessage(42)).toBe(false);
  });

  it("rejects boolean", () => {
    expect(isExtensionMessage(true)).toBe(false);
  });

  it("rejects an empty object (no type, no payload)", () => {
    expect(isExtensionMessage({})).toBe(false);
  });

  it("rejects object with type but no payload", () => {
    expect(isExtensionMessage({ type: "scan.trigger" })).toBe(false);
  });

  it("rejects object with valid type and null payload", () => {
    expect(isExtensionMessage({ type: "scan.trigger", payload: null })).toBe(false);
  });

  it("rejects object with valid type and non-object payload", () => {
    expect(isExtensionMessage({ type: "scan.trigger", payload: "not-object" })).toBe(false);
    expect(isExtensionMessage({ type: "scan.trigger", payload: 123 })).toBe(false);
    expect(isExtensionMessage({ type: "scan.trigger", payload: true })).toBe(false);
  });

  it("rejects object with invalid type string", () => {
    expect(isExtensionMessage({ type: "invalid.type", payload: {} })).toBe(false);
  });

  it("rejects object with numeric type", () => {
    expect(isExtensionMessage({ type: 123, payload: {} })).toBe(false);
  });

  it("rejects object with payload but no type", () => {
    expect(isExtensionMessage({ payload: { tabId: 1 } })).toBe(false);
  });

  it("rejects array values", () => {
    expect(isExtensionMessage([])).toBe(false);
    expect(isExtensionMessage([{ type: "scan.trigger", payload: {} }])).toBe(false);
  });

  // ─── Edge cases ─────────────────────────────────────────────────────────────

  it("accepts message with extra properties beyond type and payload", () => {
    const msg = { type: "scan.trigger", payload: { tabId: 1 }, extra: "ignored" };
    expect(isExtensionMessage(msg)).toBe(true);
  });

  it("rejects type strings that are substrings of valid types", () => {
    expect(isExtensionMessage({ type: "scan", payload: {} })).toBe(false);
    expect(isExtensionMessage({ type: "autofill", payload: {} })).toBe(false);
    expect(isExtensionMessage({ type: "scan.trigger.extra", payload: {} })).toBe(false);
  });

  it("rejects type with wrong casing", () => {
    expect(isExtensionMessage({ type: "Scan.Trigger", payload: {} })).toBe(false);
    expect(isExtensionMessage({ type: "SCAN.TRIGGER", payload: {} })).toBe(false);
  });
});
