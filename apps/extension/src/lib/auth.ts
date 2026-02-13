import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { setSession, removeSession } from "./storage";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = import.meta.env.WXT_SUPABASE_URL;
  const key = import.meta.env.WXT_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase config. Set WXT_SUPABASE_URL and WXT_SUPABASE_ANON_KEY in apps/extension/.env"
    );
  }

  _supabase = createClient(url, key, {
    auth: {
      // Chrome extensions manage sessions manually via chrome.storage.local
      // (see storage.ts). Supabase defaults use localStorage + auto-refresh
      // polling, which causes continuous failed `chrome-extension://invalid/`
      // network requests in extension contexts.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return _supabase;
}

/**
 * Initiate Google OAuth sign-in via Chrome identity API.
 *
 * Uses `chrome.identity.launchWebAuthFlow` to open Google consent screen,
 * then exchanges the returned ID token with Supabase via `signInWithIdToken`.
 */
export async function signInWithGoogle(): Promise<void> {
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.oauth2?.client_id;

  if (!clientId || clientId === "PLACEHOLDER.apps.googleusercontent.com") {
    throw new Error(
      "Google OAuth not configured. Set a real client_id in wxt.config.ts → manifest.oauth2"
    );
  }

  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org`;
  const nonce = crypto.randomUUID();

  const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("prompt", "consent");

  const responseUrl = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.href, interactive: true },
      (redirectedTo: string | undefined) => {
        if (chrome.runtime.lastError || !redirectedTo) {
          reject(
            new Error(chrome.runtime.lastError?.message ?? "Auth flow cancelled")
          );
        } else {
          resolve(redirectedTo);
        }
      }
    );
  });

  // Extract ID token from redirect URL hash fragment
  const hash = new URL(responseUrl).hash.substring(1);
  const params = new URLSearchParams(hash);
  const idToken = params.get("id_token");

  if (!idToken) {
    throw new Error("No ID token received from Google");
  }

  // Exchange Google ID token for Supabase session
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    nonce,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error("No session returned from Supabase");
  }

  // Persist session tokens
  await setSession({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? 0,
  });
}

/**
 * Sign out — clear stored session.
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
  await removeSession();
}
