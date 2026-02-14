import { describe, it, expect } from "vitest";
import { getFieldCategory } from "../../src/types/field-types";

describe("getFieldCategory", () => {
  it("categorizes personal fields", () => {
    expect(getFieldCategory("firstName")).toBe("personal");
    expect(getFieldCategory("lastName")).toBe("personal");
    expect(getFieldCategory("fullName")).toBe("personal");
    expect(getFieldCategory("email")).toBe("personal");
    expect(getFieldCategory("phone")).toBe("personal");
    expect(getFieldCategory("location")).toBe("personal");
    expect(getFieldCategory("address")).toBe("personal");
    expect(getFieldCategory("city")).toBe("personal");
    expect(getFieldCategory("state")).toBe("personal");
    expect(getFieldCategory("zipCode")).toBe("personal");
    expect(getFieldCategory("country")).toBe("personal");
    expect(getFieldCategory("linkedinUrl")).toBe("personal");
    expect(getFieldCategory("portfolioUrl")).toBe("personal");
    expect(getFieldCategory("websiteUrl")).toBe("personal");
  });

  it("categorizes resume fields", () => {
    expect(getFieldCategory("resumeUpload")).toBe("resume");
    expect(getFieldCategory("coverLetterUpload")).toBe("resume");
    expect(getFieldCategory("coverLetterText")).toBe("resume");
  });

  it("categorizes professional fields", () => {
    expect(getFieldCategory("yearsExperience")).toBe("professional");
    expect(getFieldCategory("education")).toBe("professional");
    expect(getFieldCategory("salary")).toBe("professional");
    expect(getFieldCategory("startDate")).toBe("professional");
    expect(getFieldCategory("currentCompany")).toBe("professional");
    expect(getFieldCategory("currentTitle")).toBe("professional");
  });

  it("categorizes authorization fields", () => {
    expect(getFieldCategory("workAuthorization")).toBe("authorization");
    expect(getFieldCategory("sponsorshipRequired")).toBe("authorization");
  });

  it("categorizes EEO fields", () => {
    expect(getFieldCategory("eeoGender")).toBe("eeo");
    expect(getFieldCategory("eeoRaceEthnicity")).toBe("eeo");
    expect(getFieldCategory("eeoVeteranStatus")).toBe("eeo");
    expect(getFieldCategory("eeoDisabilityStatus")).toBe("eeo");
  });

  it("categorizes custom/unknown fields", () => {
    expect(getFieldCategory("customQuestion")).toBe("custom");
    expect(getFieldCategory("unknown")).toBe("custom");
  });
});
