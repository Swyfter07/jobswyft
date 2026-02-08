import { API_URL } from "./constants";
import type { UserProfile } from "../stores/auth-store";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch(
    path: string,
    options: RequestInit & { token?: string } = {}
  ): Promise<Response> {
    const { token, ...fetchOptions } = options;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Note: Using globalThis.fetch from sidepanel context.
    // If CORS issues arise, consider moving API calls to background script
    // via chrome.runtime.sendMessage for CORS-free requests.
    return globalThis.fetch(`${this.baseUrl}${path}`, {
      ...fetchOptions,
      headers,
    });
  }

  /**
   * GET /v1/auth/me — Validate session and get user profile.
   * Returns UserProfile on success, null on auth failure.
   * Throws on network errors (caller should retry, NOT log user out).
   */
  async getMe(token: string): Promise<UserProfile | null> {
    try {
      const res = await this.fetch("/v1/auth/me", { token });

      // Auth failure (invalid/expired token) → return null
      if (res.status === 401) {
        return null;
      }

      // Server error (5xx) or other HTTP errors → return null (treat as auth failure)
      if (!res.ok) {
        return null;
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
      // Network error (fetch failed: offline, DNS, timeout) → throw, don't return null
      // This lets the caller distinguish "auth invalid" from "network down"
      console.error("Network error in getMe():", error);
      throw new Error("NETWORK_ERROR");
    }
  }

  /**
   * POST /v1/auth/logout — Invalidate server session.
   */
  async logout(token: string): Promise<void> {
    await this.fetch("/v1/auth/logout", {
      method: "POST",
      token,
    });
  }
}

export const apiClient = new ApiClient(API_URL);
