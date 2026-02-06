const SESSION_KEY = "jobswyft_session";

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Store the Supabase session in chrome.storage.local.
 */
export async function setSession(session: StoredSession): Promise<void> {
  await chrome.storage.local.set({ [SESSION_KEY]: session });
}

/**
 * Retrieve the stored session, or null if none exists.
 */
export async function getSession(): Promise<StoredSession | null> {
  const result = await chrome.storage.local.get(SESSION_KEY);
  return (result[SESSION_KEY] as StoredSession) ?? null;
}

/**
 * Remove the stored session (sign-out).
 */
export async function removeSession(): Promise<void> {
  await chrome.storage.local.remove(SESSION_KEY);
}
