import { API_URL } from "./constants";
import type { UserProfile } from "../stores/auth-store";
import { unwrap, type ApiResumeListItem, type ApiResumeResponse, type ApiPaginatedData, type ApiResponse } from "@jobswyft/ui";

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
}

export const apiClient = new ApiClient(API_URL);
