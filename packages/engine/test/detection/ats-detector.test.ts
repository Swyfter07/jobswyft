import { describe, it, expect } from "vitest";
import { detectATSForm } from "../../src/detection/ats-detector";

describe("detectATSForm", () => {
  // ─── Greenhouse ───────────────────────────────────────────────────

  it("detects Greenhouse application pages", () => {
    const result = detectATSForm("https://boards.greenhouse.io/acmecorp/jobs/12345");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("greenhouse");
  });

  it("detects Greenhouse job-boards variant", () => {
    const result = detectATSForm("https://job-boards.greenhouse.io/acmecorp/jobs/12345");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("greenhouse");
  });

  // ─── Lever ────────────────────────────────────────────────────────

  it("detects Lever application pages", () => {
    const result = detectATSForm("https://jobs.lever.co/company/abc-123-def");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("lever");
  });

  it("detects Lever /apply pages", () => {
    const result = detectATSForm("https://jobs.lever.co/company/abc-123-def/apply");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("lever");
  });

  // ─── Workday ──────────────────────────────────────────────────────

  it("detects Workday job pages", () => {
    const result = detectATSForm("https://company.myworkdayjobs.com/en-US/job/location/title");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("workday");
  });

  it("detects Workday apply pages", () => {
    const result = detectATSForm("https://company.myworkdayjobs.com/en-US/job/title/apply");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("workday");
  });

  it("detects Workday site variant", () => {
    const result = detectATSForm("https://wd5.myworkdaysite.com/recruiting/company/jobs");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("workday");
  });

  // ─── Ashby ────────────────────────────────────────────────────────

  it("detects Ashby application pages", () => {
    const result = detectATSForm("https://jobs.ashbyhq.com/company/abc-123-def");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("ashby");
  });

  it("detects Ashby /application pages", () => {
    const result = detectATSForm("https://jobs.ashbyhq.com/company/abc-123-def/application");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("ashby");
  });

  // ─── SmartRecruiters ──────────────────────────────────────────────

  it("detects SmartRecruiters pages", () => {
    const result = detectATSForm("https://jobs.smartrecruiters.com/AcmeCorp/12345");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("smartrecruiters");
  });

  // ─── iCIMS ────────────────────────────────────────────────────────

  it("detects iCIMS pages", () => {
    const result = detectATSForm("https://careers-acme.icims.com/jobs/12345/job");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("icims");
  });

  // ─── Workable ─────────────────────────────────────────────────────

  it("detects Workable pages", () => {
    const result = detectATSForm("https://apply.workable.com/acme/j/abc123/");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("workable");
  });

  // ─── Generic patterns ─────────────────────────────────────────────

  it("detects generic /apply URLs", () => {
    const result = detectATSForm("https://company.com/careers/engineer/apply");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("generic");
  });

  it("detects generic /application/ URLs", () => {
    const result = detectATSForm("https://company.com/application/12345");
    expect(result.isATS).toBe(true);
    expect(result.board).toBe("generic");
  });

  // ─── Non-ATS URLs ─────────────────────────────────────────────────

  it("returns false for Google homepage", () => {
    const result = detectATSForm("https://www.google.com");
    expect(result.isATS).toBe(false);
    expect(result.board).toBe("");
  });

  it("returns false for LinkedIn feed", () => {
    const result = detectATSForm("https://www.linkedin.com/feed");
    expect(result.isATS).toBe(false);
  });

  it("returns false for random URLs", () => {
    const result = detectATSForm("https://www.example.com/about");
    expect(result.isATS).toBe(false);
  });
});
