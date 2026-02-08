import { describe, it, expect } from "vitest"
import {
  unwrap,
  unwrapPaginated,
  ApiResponseError,
  mapResumeList,
  mapResumeResponse,
  mapJobResponse,
  mapMatchAnalysis,
  mapUsageResponse,
  mapProfileResponse,
} from "./mappers"
import type {
  ApiResponse,
  ApiResumeResponse,
  ApiResumeListItem,
  ApiJobResponse,
  ApiMatchAnalysis,
  ApiUsageResponse,
  ApiProfileResponse,
} from "./api-types"

// ─── unwrap ─────────────────────────────────────────────────────────

describe("unwrap", () => {
  it("returns data on success", () => {
    const response: ApiResponse<string> = { success: true, data: "hello" }
    expect(unwrap(response)).toBe("hello")
  })

  it("throws ApiResponseError on failure", () => {
    const response: ApiResponse<string> = {
      success: false,
      data: "" as never,
      error: { code: "AUTH_REQUIRED", message: "No token" },
    }
    expect(() => unwrap(response)).toThrow(ApiResponseError)
    expect(() => unwrap(response)).toThrow("No token")
  })

  it("includes error code on thrown error", () => {
    const response: ApiResponse<string> = {
      success: false,
      data: "" as never,
      error: { code: "CREDIT_EXHAUSTED", message: "No credits" },
    }
    try {
      unwrap(response)
    } catch (e) {
      expect(e).toBeInstanceOf(ApiResponseError)
      expect((e as ApiResponseError).code).toBe("CREDIT_EXHAUSTED")
    }
  })
})

describe("unwrapPaginated", () => {
  it("maps page_size to pageSize", () => {
    const result = unwrapPaginated({
      items: [1, 2, 3],
      total: 10,
      page: 1,
      page_size: 3,
    })
    expect(result).toEqual({
      items: [1, 2, 3],
      total: 10,
      page: 1,
      pageSize: 3,
    })
  })
})

// ─── Resume Mappers ─────────────────────────────────────────────────

const sampleApiResume: ApiResumeResponse = {
  id: "r1",
  user_id: "u1",
  file_name: "resume.pdf",
  file_path: "resumes/u1/r1.pdf",
  parse_status: "completed",
  created_at: "2026-01-15T00:00:00Z",
  updated_at: "2026-01-15T00:00:00Z",
  parsed_data: {
    contact: {
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      phone: "555-1234",
      location: "San Francisco, CA",
      linkedin_url: "https://linkedin.com/in/janedoe",
      website: "https://janedoe.dev",
    },
    summary: "Senior engineer with 10 years experience",
    experience: [
      {
        title: "Senior Engineer",
        company: "Acme Corp",
        start_date: "2020-01",
        end_date: "Present",
        description: "Led frontend team",
        highlights: ["Built design system", "Improved performance 40%"],
      },
    ],
    education: [
      {
        degree: "BS Computer Science",
        institution: "MIT",
        graduation_year: "2014",
      },
    ],
    skills: ["React", "TypeScript", "Node.js"],
    certifications: [{ name: "AWS SAA", issuer: "Amazon", date: "2023" }],
    projects: [
      {
        name: "OpenWidget",
        description: "Open source widget library",
        tech_stack: ["React", "Storybook"],
        url: "https://github.com/janedoe/openwidget",
      },
    ],
  },
}

describe("mapResumeList", () => {
  it("maps list items to ResumeSummary", () => {
    const items: ApiResumeListItem[] = [
      {
        id: "r1",
        file_name: "resume.pdf",
        is_active: true,
        parse_status: "completed",
        created_at: "2026-01-15T00:00:00Z",
        updated_at: "2026-01-15T00:00:00Z",
      },
      {
        id: "r2",
        file_name: "resume-v2.pdf",
        is_active: false,
        parse_status: "completed",
        created_at: "2026-01-16T00:00:00Z",
        updated_at: "2026-01-16T00:00:00Z",
      },
    ]
    expect(mapResumeList(items)).toEqual([
      { id: "r1", fileName: "resume.pdf" },
      { id: "r2", fileName: "resume-v2.pdf" },
    ])
  })
})

describe("mapResumeResponse", () => {
  it("returns null when no parsed_data", () => {
    expect(
      mapResumeResponse({ ...sampleApiResume, parsed_data: null }),
    ).toBeNull()
  })

  it("maps personal info with fullName concatenation", () => {
    const result = mapResumeResponse(sampleApiResume)!
    expect(result.personalInfo.fullName).toBe("Jane Doe")
    expect(result.personalInfo.email).toBe("jane@example.com")
    expect(result.personalInfo.linkedin).toBe(
      "https://linkedin.com/in/janedoe",
    )
    expect(result.personalInfo.website).toBe("https://janedoe.dev")
  })

  it("maps experience with camelCase dates and highlights", () => {
    const result = mapResumeResponse(sampleApiResume)!
    expect(result.experience[0]).toEqual({
      title: "Senior Engineer",
      company: "Acme Corp",
      startDate: "2020-01",
      endDate: "Present",
      description: "Led frontend team",
      highlights: ["Built design system", "Improved performance 40%"],
    })
  })

  it("maps education with institution → school", () => {
    const result = mapResumeResponse(sampleApiResume)!
    expect(result.education[0].school).toBe("MIT")
    expect(result.education[0].degree).toBe("BS Computer Science")
  })

  it("maps certifications", () => {
    const result = mapResumeResponse(sampleApiResume)!
    expect(result.certifications).toEqual([
      { name: "AWS SAA", issuer: "Amazon", date: "2023" },
    ])
  })

  it("maps projects with tech_stack → techStack", () => {
    const result = mapResumeResponse(sampleApiResume)!
    expect(result.projects![0]).toEqual({
      name: "OpenWidget",
      description: "Open source widget library",
      techStack: ["React", "Storybook"],
      url: "https://github.com/janedoe/openwidget",
    })
  })

  it("handles missing optional fields gracefully", () => {
    const minimal: ApiResumeResponse = {
      ...sampleApiResume,
      parsed_data: {
        contact: null,
        summary: null,
        experience: null,
        education: null,
        skills: null,
      },
    }
    const result = mapResumeResponse(minimal)!
    expect(result.personalInfo.fullName).toBe("Unknown")
    expect(result.skills).toEqual([])
    expect(result.experience).toEqual([])
    expect(result.education).toEqual([])
    expect(result.certifications).toBeUndefined()
    expect(result.projects).toBeUndefined()
  })
})

// ─── Job Mappers ────────────────────────────────────────────────────

describe("mapJobResponse", () => {
  it("maps snake_case to camelCase", () => {
    const job: ApiJobResponse = {
      id: "j1",
      user_id: "u1",
      title: "Frontend Engineer",
      company: "Acme",
      description: "Build UIs",
      location: "Remote",
      salary_range: "$120k-$160k",
      employment_type: "full-time",
      source_url: "https://example.com/job",
      status: "saved",
      notes: null,
      posted_at: "2026-01-10",
      logo_url: "https://logo.clearbit.com/acme.com",
      created_at: "2026-01-15T00:00:00Z",
      updated_at: "2026-01-15T00:00:00Z",
    }
    expect(mapJobResponse(job)).toEqual({
      title: "Frontend Engineer",
      company: "Acme",
      location: "Remote",
      salary: "$120k-$160k",
      employmentType: "full-time",
      sourceUrl: "https://example.com/job",
      status: "saved",
      postedAt: "2026-01-10",
      description: "Build UIs",
      logo: "https://logo.clearbit.com/acme.com",
    })
  })

  it("handles null optional fields", () => {
    const job: ApiJobResponse = {
      id: "j2",
      user_id: "u1",
      title: "Engineer",
      company: "Co",
      description: null,
      location: null,
      salary_range: null,
      employment_type: null,
      source_url: null,
      status: "saved",
      notes: null,
      created_at: "2026-01-15T00:00:00Z",
      updated_at: "2026-01-15T00:00:00Z",
    }
    const result = mapJobResponse(job)
    expect(result.location).toBe("")
    expect(result.salary).toBeUndefined()
    expect(result.employmentType).toBeUndefined()
    expect(result.sourceUrl).toBeUndefined()
    expect(result.status).toBe("saved")
    expect(result.postedAt).toBeUndefined()
    expect(result.logo).toBeUndefined()
  })
})

describe("mapMatchAnalysis", () => {
  it("maps matched_skills to matchedSkills", () => {
    const analysis: ApiMatchAnalysis = {
      score: 85,
      matched_skills: ["React", "TypeScript"],
      missing_skills: ["GraphQL"],
      summary: "Strong match",
    }
    expect(mapMatchAnalysis(analysis)).toEqual({
      score: 85,
      matchedSkills: ["React", "TypeScript"],
      missingSkills: ["GraphQL"],
      summary: "Strong match",
    })
  })
})

// ─── Credit Mappers ─────────────────────────────────────────────────

describe("mapUsageResponse", () => {
  it("maps credits for CreditBar and CreditBalance", () => {
    const usage: ApiUsageResponse = {
      subscription_tier: "free",
      period_type: "monthly",
      period_key: "2026-02",
      credits_used: 3,
      credits_limit: 10,
      credits_remaining: 7,
      usage_by_type: {
        match: 1,
        cover_letter: 1,
        answer: 1,
        outreach: 0,
        resume_parse: 0,
        referral_bonus: 0,
      },
      subscription_status: "active",
      current_period_end: "2026-03-01",
      pending_deletion_expires: null,
    }
    const result = mapUsageResponse(usage)
    expect(result.credits).toBe(7) // for CreditBar
    expect(result.maxCredits).toBe(10) // for CreditBar
    expect(result.total).toBe(10) // for CreditBalance
    expect(result.used).toBe(3) // for CreditBalance
  })

  it("handles unlimited credits (-1)", () => {
    const usage: ApiUsageResponse = {
      subscription_tier: "enterprise",
      period_type: "monthly",
      period_key: "2026-02",
      credits_used: 50,
      credits_limit: -1,
      credits_remaining: -1,
      usage_by_type: {
        match: 10,
        cover_letter: 20,
        answer: 15,
        outreach: 5,
        resume_parse: 0,
        referral_bonus: 0,
      },
      subscription_status: "active",
      current_period_end: null,
      pending_deletion_expires: null,
    }
    const result = mapUsageResponse(usage)
    expect(result.credits).toBe(Infinity)
    expect(result.maxCredits).toBe(Infinity)
  })
})

// ─── Profile Mapper ─────────────────────────────────────────────────

describe("mapProfileResponse", () => {
  it("maps snake_case to camelCase", () => {
    const profile: ApiProfileResponse = {
      id: "u1",
      email: "jane@example.com",
      full_name: "Jane Doe",
      subscription_tier: "free",
      subscription_status: "active",
      active_resume_id: "r1",
      preferred_ai_provider: "claude",
      created_at: "2026-01-01T00:00:00Z",
    }
    expect(mapProfileResponse(profile)).toEqual({
      id: "u1",
      email: "jane@example.com",
      fullName: "Jane Doe",
      subscriptionTier: "free",
      activeResumeId: "r1",
    })
  })
})
