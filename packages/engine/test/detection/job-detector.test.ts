import { describe, it, expect } from "vitest";
import { detectJobPage, getJobBoard } from "../../src/detection/job-detector";

describe("detectJobPage", () => {
  // ─── Major Job Boards ─────────────────────────────────────────────

  it("detects LinkedIn job view URLs", () => {
    expect(detectJobPage("https://www.linkedin.com/jobs/view/123456")).toBe(true);
  });

  it("detects LinkedIn jobs collections", () => {
    expect(detectJobPage("https://www.linkedin.com/jobs/collections/recommended/")).toBe(true);
  });

  it("detects LinkedIn jobs search", () => {
    expect(detectJobPage("https://www.linkedin.com/jobs/search/?keywords=engineer")).toBe(true);
  });

  it("detects LinkedIn SPA modal with currentJobId param", () => {
    expect(detectJobPage("https://www.linkedin.com/jobs/search/?currentJobId=3912345")).toBe(true);
  });

  it("detects Indeed viewjob URLs", () => {
    expect(detectJobPage("https://www.indeed.com/viewjob?jk=abc123&from=search")).toBe(true);
  });

  it("detects Indeed jobs with query params", () => {
    expect(detectJobPage("https://www.indeed.com/jobs?q=engineer&l=remote")).toBe(true);
  });

  it("detects Greenhouse hosted board URLs", () => {
    expect(detectJobPage("https://boards.greenhouse.io/acmecorp/jobs/12345")).toBe(true);
  });

  it("detects Lever job URLs", () => {
    expect(detectJobPage("https://jobs.lever.co/company/abc-123-def")).toBe(true);
  });

  it("detects Workday job URLs", () => {
    expect(detectJobPage("https://company.myworkdayjobs.com/en-US/job/location/title/JR-12345")).toBe(true);
  });

  it("detects Glassdoor job listing URLs", () => {
    expect(detectJobPage("https://www.glassdoor.com/job-listing/senior-engineer-acme-JV_12345.htm")).toBe(true);
  });

  it("detects ZipRecruiter job URLs", () => {
    expect(detectJobPage("https://www.ziprecruiter.com/c/Acme/job/Engineer/abc123")).toBe(true);
  });

  it("detects Monster job URLs", () => {
    expect(detectJobPage("https://www.monster.com/job-openings/senior-engineer-sf-ca/abc123")).toBe(true);
  });

  it("detects Wellfound (AngelList) job URLs", () => {
    expect(detectJobPage("https://wellfound.com/jobs")).toBe(true);
  });

  it("detects Dice job URLs", () => {
    expect(detectJobPage("https://www.dice.com/job-detail/abc-123")).toBe(true);
  });

  // ─── Generic Career Page Patterns ─────────────────────────────────

  it("detects generic career page URLs", () => {
    expect(detectJobPage("https://careers.acme.com/some-job")).toBe(true);
  });

  it("detects generic /jobs/ID URLs", () => {
    expect(detectJobPage("https://company.com/jobs/12345")).toBe(true);
  });

  // ─── Non-Job URLs ─────────────────────────────────────────────────

  it("returns false for Google homepage", () => {
    expect(detectJobPage("https://www.google.com")).toBe(false);
  });

  it("returns false for Gmail", () => {
    expect(detectJobPage("https://mail.google.com/mail/u/0")).toBe(false);
  });

  it("returns false for LinkedIn feed", () => {
    expect(detectJobPage("https://www.linkedin.com/feed")).toBe(false);
  });

  it("returns false for LinkedIn profile", () => {
    expect(detectJobPage("https://www.linkedin.com/in/username")).toBe(false);
  });

  it("returns false for YouTube", () => {
    expect(detectJobPage("https://www.youtube.com/watch?v=abc")).toBe(false);
  });

  // ─── Case Insensitivity ───────────────────────────────────────────

  it("is case-insensitive", () => {
    expect(detectJobPage("https://WWW.LINKEDIN.COM/JOBS/VIEW/123")).toBe(true);
    expect(detectJobPage("https://WWW.INDEED.COM/VIEWJOB?jk=abc")).toBe(true);
  });
});

describe("getJobBoard", () => {
  it("returns 'linkedin' for LinkedIn job URLs", () => {
    expect(getJobBoard("https://www.linkedin.com/jobs/view/123")).toBe("linkedin");
  });

  it("returns 'linkedin' for currentJobId SPA modal", () => {
    expect(getJobBoard("https://www.linkedin.com/jobs/search/?currentJobId=123")).toBe("linkedin");
  });

  it("returns 'indeed' for Indeed URLs", () => {
    expect(getJobBoard("https://www.indeed.com/viewjob?jk=abc")).toBe("indeed");
  });

  it("returns 'greenhouse' for Greenhouse URLs", () => {
    expect(getJobBoard("https://boards.greenhouse.io/acme/jobs/12345")).toBe("greenhouse");
  });

  it("returns 'lever' for Lever URLs", () => {
    expect(getJobBoard("https://jobs.lever.co/company/id")).toBe("lever");
  });

  it("returns 'workday' for Workday URLs", () => {
    expect(getJobBoard("https://company.myworkdayjobs.com/en-US/job/title/JR-123")).toBe("workday");
  });

  it("returns 'glassdoor' for Glassdoor URLs", () => {
    expect(getJobBoard("https://www.glassdoor.com/job-listing/title-JV_123.htm")).toBe("glassdoor");
  });

  it("returns 'generic' for generic career page URLs", () => {
    expect(getJobBoard("https://careers.acme.com/some-job")).toBe("generic");
  });

  it("returns null for non-job URLs", () => {
    expect(getJobBoard("https://www.google.com")).toBeNull();
    expect(getJobBoard("https://www.linkedin.com/feed")).toBeNull();
  });
});
