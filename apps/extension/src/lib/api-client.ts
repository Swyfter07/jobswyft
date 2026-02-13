import { API_URL } from "./constants";
import type { UserProfile } from "../stores/auth-store";
import type { AutofillData } from "../features/autofill/field-types";
import { unwrap, type ApiResumeListItem, type ApiResumeResponse, type ApiJobResponse, type ApiPaginatedData, type ApiResponse } from "@jobswyft/ui";

export interface ApiUploadResponse {
  resume: ApiResumeResponse;
  ai_provider_used: string;
}

export interface ApiActiveResponse {
  message: string;
  active_resume_id: string;
}

export interface ApiDeleteResponse {
  message: string;
}

export interface AiExtractResult {
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  salary?: string;
  employment_type?: string;
}

// ─── AI endpoint types ───────────────────────────────────────────

export interface MatchAnalysisResult {
  match_score: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  ai_provider_used: string;
}

export interface AIContentResult {
  content: string;
  ai_provider_used: string;
  tokens_used: number;
}

export interface ChatResult {
  message: string;
  ai_provider_used: string;
  tokens_used: number | null;
}

export interface UsageResult {
  credits_used: number;
  credits_remaining: number;
  max_credits: number;
}

export interface CoverLetterParams {
  tone?: "confident" | "friendly" | "enthusiastic" | "professional" | "executive";
  custom_instructions?: string;
  feedback?: string;
  previous_content?: string;
  resume_id?: string;
}

export interface AnswerParams {
  max_length?: 150 | 300 | 500 | 1000;
  feedback?: string;
  previous_content?: string;
  resume_id?: string;
}

export interface OutreachParams {
  recipient_type: "recruiter" | "hiring_manager" | "referral";
  platform: "linkedin" | "email" | "twitter";
  recipient_name?: string;
  feedback?: string;
  previous_content?: string;
  resume_id?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface JobContext {
  title: string;
  company: string;
  description?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit & { token?: string; skipContentType?: boolean } = {}
  ): Promise<T> {
    const { token, skipContentType, ...fetchOptions } = options;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Don't set Content-Type for FormData or if explicitly skipped
    if (!skipContentType && !(fetchOptions.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      // Note: Using globalThis.fetch from sidepanel context.
      const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
        ...fetchOptions,
        headers,
      });

      // For auth endpoints that might return 401/etc without standard wrapper, handle appropriately
      // But for our standard API, we expect ApiResponse wrapper
      const body = await response.json();
      return unwrap(body as ApiResponse<T>);
    } catch (error) {
      // If it's already an ApiResponseError (from unwrap), rethrow
      // If it's a network error (TypeError), rethrow
      // Otherwise wrap/rethrow
      throw error;
    }
  }

  /**
   * GET /v1/auth/me — Validate session and get user profile.
   * Returns UserProfile on success, null on auth failure.
   * Throws on network errors (caller should retry, NOT log user out).
   */
  async getMe(token: string): Promise<UserProfile | null> {
    try {
      // Special handling for getMe to avoid unwrap logic if we want to handle 401 gracefully
      const res = await globalThis.fetch(`${this.baseUrl}/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Auth failure (invalid/expired token) → return null
      if (res.status === 401) {
        return null;
      }

      // Server error (5xx) or other HTTP errors → throw so caller can distinguish
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const body = await res.json();
      if (!body.success || !body.data) {
        return null;
      }

      const d = body.data;
      return {
        id: d.id,
        email: d.email,
        name: d.full_name ?? d.name ?? null,
        avatarUrl: d.avatar_url ?? null,
      };
    } catch (error) {
      console.error("Network error in getMe():", error);
      throw new Error("NETWORK_ERROR");
    }
  }

  /**
   * POST /v1/auth/logout — Invalidate server session.
   */
  async logout(token: string): Promise<void> {
    await globalThis.fetch(`${this.baseUrl}/v1/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // ─── Resume endpoints ──────────────────────────────────────────────

  /** GET /v1/resumes — List user's resumes. */
  async listResumes(token: string): Promise<ApiPaginatedData<ApiResumeListItem>> {
    return this.fetch<ApiPaginatedData<ApiResumeListItem>>("/v1/resumes", { token });
  }

  /** GET /v1/resumes/:id — Get resume detail with parsed data. */
  async getResume(token: string, id: string): Promise<ApiResumeResponse> {
    return this.fetch<ApiResumeResponse>(`/v1/resumes/${id}`, { token });
  }

  /** POST /v1/resumes — Upload a resume PDF. */
  async uploadResume(token: string, file: File): Promise<ApiUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return this.fetch<ApiUploadResponse>("/v1/resumes", {
      method: "POST",
      body: formData,
      token,
      skipContentType: true,
    });
  }

  /** PUT /v1/resumes/:id/active — Set a resume as active. */
  async setActiveResume(token: string, id: string): Promise<ApiActiveResponse> {
    return this.fetch<ApiActiveResponse>(`/v1/resumes/${id}/active`, {
      method: "PUT",
      token,
    });
  }

  /** DELETE /v1/resumes/:id — Delete a resume. */
  async deleteResume(token: string, id: string): Promise<ApiDeleteResponse> {
    return this.fetch<ApiDeleteResponse>(`/v1/resumes/${id}`, {
      method: "DELETE",
      token,
    });
  }

  /** PATCH /v1/resumes/:id/parsed-data — Update resume parsed data. */
  async updateParsedData(
    token: string,
    resumeId: string,
    parsedData: Record<string, unknown>
  ): Promise<ApiResumeResponse> {
    return this.fetch<ApiResumeResponse>(`/v1/resumes/${resumeId}/parsed-data`, {
      method: "PATCH",
      body: JSON.stringify(parsedData),
      token,
    });
  }

  // ─── AI extraction endpoint ────────────────────────────────────────

  /**
   * POST /v1/ai/extract-job — LLM-based extraction fallback.
   * 5-second timeout via AbortController. Free (no credit cost).
   */
  async extractJobWithAI(
    token: string,
    htmlContent: string,
    sourceUrl: string,
    partialData?: Record<string, string | undefined>
  ): Promise<AiExtractResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    try {
      return await this.fetch<AiExtractResult>("/v1/ai/extract-job", {
        method: "POST",
        body: JSON.stringify({
          html_content: htmlContent,
          source_url: sourceUrl,
          partial_data: partialData ?? {},
        }),
        token,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── Job endpoints ────────────────────────────────────────────────

  // ─── AI endpoints ──────────────────────────────────────────────────

  /** POST /v1/ai/match — Analyze resume-job match. */
  async analyzeMatch(token: string, jobId: string, resumeId?: string): Promise<MatchAnalysisResult> {
    return this.fetch<MatchAnalysisResult>("/v1/ai/match", {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        ...(resumeId && { resume_id: resumeId }),
      }),
      token,
    });
  }

  /** POST /v1/ai/cover-letter — Generate cover letter. */
  async generateCoverLetter(token: string, jobId: string, params: CoverLetterParams = {}): Promise<AIContentResult> {
    return this.fetch<AIContentResult>("/v1/ai/cover-letter", {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        tone: params.tone ?? "professional",
        custom_instructions: params.custom_instructions ?? null,
        feedback: params.feedback ?? null,
        previous_content: params.previous_content ?? null,
        ...(params.resume_id && { resume_id: params.resume_id }),
      }),
      token,
    });
  }

  /** POST /v1/ai/answer — Answer an application question. */
  async answerQuestion(token: string, jobId: string, question: string, params: AnswerParams = {}): Promise<AIContentResult> {
    return this.fetch<AIContentResult>("/v1/ai/answer", {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        question,
        max_length: params.max_length ?? 500,
        feedback: params.feedback ?? null,
        previous_content: params.previous_content ?? null,
        ...(params.resume_id && { resume_id: params.resume_id }),
      }),
      token,
    });
  }

  /** POST /v1/ai/outreach — Generate outreach message. */
  async generateOutreach(token: string, jobId: string, params: OutreachParams): Promise<AIContentResult> {
    return this.fetch<AIContentResult>("/v1/ai/outreach", {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        recipient_type: params.recipient_type,
        platform: params.platform,
        recipient_name: params.recipient_name ?? null,
        feedback: params.feedback ?? null,
        previous_content: params.previous_content ?? null,
        ...(params.resume_id && { resume_id: params.resume_id }),
      }),
      token,
    });
  }

  /** POST /v1/ai/chat — Send message to career coach. */
  async sendCoachMessage(
    token: string,
    message: string,
    jobContext?: JobContext,
    resumeContext?: string,
    history?: ChatMessage[]
  ): Promise<ChatResult> {
    return this.fetch<ChatResult>("/v1/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        job_context: jobContext ?? null,
        resume_context: resumeContext ?? null,
        history: history ?? null,
      }),
      token,
    });
  }

  // ─── Autofill endpoint ─────────────────────────────────────────────

  /** GET /v1/autofill/data — Get autofill data for form completion. */
  async getAutofillData(token: string): Promise<AutofillData> {
    const raw = await this.fetch<{
      personal: {
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        location: string | null;
        linkedin_url: string | null;
        portfolio_url: string | null;
      };
      resume: {
        id: string;
        file_name: string | null;
        download_url: string | null;
        parsed_summary: string | null;
      } | null;
      work_authorization: string | null;
      salary_expectation: string | null;
    }>("/v1/autofill/data", { token });

    return {
      personal: {
        firstName: raw.personal.first_name,
        lastName: raw.personal.last_name,
        fullName: raw.personal.full_name,
        email: raw.personal.email,
        phone: raw.personal.phone,
        location: raw.personal.location,
        linkedinUrl: raw.personal.linkedin_url,
        portfolioUrl: raw.personal.portfolio_url,
      },
      resume: raw.resume
        ? {
            id: raw.resume.id,
            fileName: raw.resume.file_name,
            downloadUrl: raw.resume.download_url,
            parsedSummary: raw.resume.parsed_summary,
          }
        : null,
      workAuthorization: raw.work_authorization,
      salaryExpectation: raw.salary_expectation,
    };
  }

  /** GET /v1/usage — Get credit usage info. */
  async getUsage(token: string): Promise<UsageResult> {
    return this.fetch<UsageResult>("/v1/usage", { token });
  }

  // ─── Job endpoints ────────────────────────────────────────────────

  /** POST /v1/jobs/scan — Save a scanned job. */
  async saveJob(
    token: string,
    jobData: {
      title: string;
      company: string;
      description: string;
      location?: string;
      salary?: string;
      employmentType?: string;
      sourceUrl?: string;
    }
  ): Promise<ApiJobResponse> {
    return this.fetch<ApiJobResponse>("/v1/jobs/scan", {
      method: "POST",
      body: JSON.stringify({
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
        location: jobData.location ?? null,
        salary_range: jobData.salary ?? null,
        employment_type: jobData.employmentType ?? null,
        source_url: jobData.sourceUrl ?? null,
        status: "applied", // FR49: auto "Applied" — overrides API default "saved"
      }),
      token,
    });
  }
}

export const apiClient = new ApiClient(API_URL);
