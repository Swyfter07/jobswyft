import { describe, it, expect } from "vitest";
import { computeFieldConfidence, resolveFieldType, SIGNAL_WEIGHTS } from "../signal-weights";
import type { SignalEvaluation } from "../field-types";

describe("SIGNAL_WEIGHTS", () => {
  it("has autocomplete as highest weight", () => {
    expect(SIGNAL_WEIGHTS["autocomplete"]).toBe(0.95);
  });

  it("has section-context as lowest weight", () => {
    expect(SIGNAL_WEIGHTS["section-context"]).toBe(0.30);
  });

  it("has all 12 signal types", () => {
    expect(Object.keys(SIGNAL_WEIGHTS)).toHaveLength(12);
  });
});

describe("computeFieldConfidence", () => {
  it("returns 0 for no matched signals", () => {
    const signals: SignalEvaluation[] = [
      { signal: "autocomplete", rawValue: "off", suggestedType: "unknown", weight: 0.95, matched: false, reason: "off" },
    ];
    expect(computeFieldConfidence(signals)).toBe(0);
  });

  it("returns base weight for single matched signal", () => {
    const signals: SignalEvaluation[] = [
      { signal: "autocomplete", rawValue: "given-name", suggestedType: "firstName", weight: 0.95, matched: true, reason: "match" },
    ];
    expect(computeFieldConfidence(signals)).toBe(0.95);
  });

  it("adds diminishing bonus for multiple matched signals", () => {
    const signals: SignalEvaluation[] = [
      { signal: "autocomplete", rawValue: "given-name", suggestedType: "firstName", weight: 0.95, matched: true, reason: "match" },
      { signal: "name-id-regex", rawValue: "first_name", suggestedType: "firstName", weight: 0.85, matched: true, reason: "match" },
    ];
    const conf = computeFieldConfidence(signals);
    // 0.95 + 0.85 * 0.1 * 0.5^0 = 0.95 + 0.085 = 1.035 → capped at 0.99
    expect(conf).toBeCloseTo(0.99);
  });

  it("caps confidence at 0.99", () => {
    const signals: SignalEvaluation[] = [
      { signal: "autocomplete", rawValue: "email", suggestedType: "email", weight: 0.95, matched: true, reason: "match" },
      { signal: "name-id-regex", rawValue: "email", suggestedType: "email", weight: 0.85, matched: true, reason: "match" },
      { signal: "input-type", rawValue: "email", suggestedType: "email", weight: 0.80, matched: true, reason: "match" },
      { signal: "label-for", rawValue: "Email", suggestedType: "email", weight: 0.75, matched: true, reason: "match" },
    ];
    expect(computeFieldConfidence(signals)).toBeLessThanOrEqual(0.99);
  });

  it("ignores unmatched signals", () => {
    const signals: SignalEvaluation[] = [
      { signal: "autocomplete", rawValue: "off", suggestedType: "unknown", weight: 0.95, matched: false, reason: "no match" },
      { signal: "name-id-regex", rawValue: "email", suggestedType: "email", weight: 0.85, matched: true, reason: "match" },
    ];
    expect(computeFieldConfidence(signals)).toBe(0.85);
  });
});

describe("resolveFieldType", () => {
  it("returns unknown for no matched signals", () => {
    const signals: SignalEvaluation[] = [
      { signal: "autocomplete", rawValue: "off", suggestedType: "unknown", weight: 0.95, matched: false, reason: "no match" },
    ];
    const result = resolveFieldType(signals);
    expect(result.fieldType).toBe("unknown");
    expect(result.confidence).toBe(0);
  });

  it("resolves single signal to its type", () => {
    const signals: SignalEvaluation[] = [
      { signal: "autocomplete", rawValue: "given-name", suggestedType: "firstName", weight: 0.95, matched: true, reason: "match" },
    ];
    const result = resolveFieldType(signals);
    expect(result.fieldType).toBe("firstName");
    expect(result.confidence).toBe(0.95);
  });

  it("resolves via weighted voting when signals agree", () => {
    const signals: SignalEvaluation[] = [
      { signal: "autocomplete", rawValue: "email", suggestedType: "email", weight: 0.95, matched: true, reason: "match" },
      { signal: "input-type", rawValue: "email", suggestedType: "email", weight: 0.80, matched: true, reason: "match" },
    ];
    const result = resolveFieldType(signals);
    expect(result.fieldType).toBe("email");
  });

  it("resolves via weighted voting when signals disagree — highest total wins", () => {
    const signals: SignalEvaluation[] = [
      { signal: "autocomplete", rawValue: "given-name", suggestedType: "firstName", weight: 0.95, matched: true, reason: "autocomplete" },
      { signal: "placeholder", rawValue: "Full Name", suggestedType: "fullName", weight: 0.65, matched: true, reason: "placeholder" },
    ];
    const result = resolveFieldType(signals);
    // firstName (0.95) > fullName (0.65) → firstName wins
    expect(result.fieldType).toBe("firstName");
  });

  it("corroborating signals can override a single high-weight signal", () => {
    const signals: SignalEvaluation[] = [
      { signal: "autocomplete", rawValue: "given-name", suggestedType: "firstName", weight: 0.95, matched: true, reason: "auto" },
      { signal: "name-id-regex", rawValue: "fullName", suggestedType: "fullName", weight: 0.85, matched: true, reason: "regex" },
      { signal: "label-for", rawValue: "Full Name", suggestedType: "fullName", weight: 0.75, matched: true, reason: "label" },
      { signal: "placeholder", rawValue: "Full Name", suggestedType: "fullName", weight: 0.65, matched: true, reason: "ph" },
    ];
    const result = resolveFieldType(signals);
    // fullName (0.85 + 0.75 + 0.65 = 2.25) > firstName (0.95) → fullName wins
    expect(result.fieldType).toBe("fullName");
  });
});
