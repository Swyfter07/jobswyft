/**
 * Autofill Data Service — Fetches user data from GET /v1/autofill/data.
 *
 * In-memory cache with 5-minute TTL to avoid redundant API calls.
 * Cache is invalidated when the active resume changes.
 */

import { apiClient } from "../../lib/api-client";
import type { AutofillData } from "./field-types";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedData: AutofillData | null = null;
let cacheTimestamp = 0;

/**
 * Fetch autofill data from backend API with caching.
 * Returns null on error (does not throw).
 */
export async function fetchAutofillData(
  token: string
): Promise<AutofillData | null> {
  // Check cache
  if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedData;
  }

  try {
    const data = await apiClient.getAutofillData(token);
    cachedData = data;
    cacheTimestamp = Date.now();
    return data;
  } catch (err) {
    console.error("[autofill-data-service] Failed to fetch autofill data:", err);
    return null;
  }
}

/**
 * Invalidate the autofill data cache.
 * Call when active resume changes or user profile is updated.
 */
export function invalidateAutofillCache(): void {
  cachedData = null;
  cacheTimestamp = 0;
}
