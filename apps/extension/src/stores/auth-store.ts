import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chromeStorageAdapter } from "../lib/chrome-storage-adapter";
import { signOut as authSignOut } from "../lib/auth";
import { getSession, removeSession } from "../lib/storage";
import { apiClient } from "../lib/api-client";
import { resetAllStores } from "./reset-stores";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isValidating: boolean;

  setSession: (user: UserProfile, accessToken: string) => void;
  clearSession: () => void;
  validateSession: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isValidating: false,

      setSession: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true, isValidating: false });
      },

      clearSession: () => {
        // Clear both Zustand state AND chrome.storage.local session (EXT.1)
        removeSession().catch(() => {
          // Best-effort cleanup — continue even if storage fails
        });
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isValidating: false,
        });
      },

      signOut: async () => {
        const { accessToken } = get();
        try {
          // Call server logout endpoint
          if (accessToken) {
            await apiClient.logout(accessToken).catch(() => {
              // Best-effort server logout — continue even if it fails
            });
          }
          // Delegate to existing auth.ts signOut (Supabase signout + removeSession)
          await authSignOut();
        } catch {
          // Ensure local state is always cleared even if server call fails
        }
        // Reset all user-specific stores BEFORE clearing auth session
        // to prevent stale data leaking to next session / different user
        await resetAllStores();
        get().clearSession();
      },

      validateSession: async () => {
        set({ isValidating: true });

        try {
          // Check stored session from chrome.storage.local (EXT.1 storage)
          const stored = await getSession();
          if (!stored?.accessToken) {
            // No session → clear user-specific stores to prevent stale data
            // from a previous user leaking if a different user logs in next.
            await resetAllStores();
            get().clearSession();
            return false;
          }

          // Check if token is expired locally first (skip network call)
          const nowSec = Math.floor(Date.now() / 1000);
          if (!stored.expiresAt || stored.expiresAt < nowSec) {
            await removeSession();
            await resetAllStores();
            get().clearSession();
            return false;
          }

          // Validate with server
          const profile = await apiClient.getMe(stored.accessToken);
          if (!profile) {
            // Auth failure (401) — clear user data and session
            await removeSession();
            await resetAllStores();
            get().clearSession();
            return false;
          }

          set({
            user: profile,
            accessToken: stored.accessToken,
            isAuthenticated: true,
            isValidating: false,
          });
          return true;
        } catch (error) {
          // Network error (not auth failure) — preserve session, retry later
          if (error instanceof Error && error.message === "NETWORK_ERROR") {
            console.warn("Network error during session validation — retrying later");
            set({ isValidating: false });
            // Keep existing session state, don't clear
            return false;
          }
          // Other errors — clear user data and session
          await removeSession().catch(() => {});
          await resetAllStores();
          get().clearSession();
          return false;
        }
      },
    }),
    {
      name: "jobswyft-auth",
      storage: createJSONStorage(() => chromeStorageAdapter),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
