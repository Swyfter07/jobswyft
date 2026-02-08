import { useEffect, useState, useCallback } from "react";
import { ExtensionSidebar, LoggedOutView } from "@jobswyft/ui";
import { useAuthStore } from "../stores/auth-store";
import { useThemeStore } from "../stores/theme-store";
import { signInWithGoogle } from "../lib/auth";
import { getSession } from "../lib/storage";
import { AuthenticatedLayout } from "./authenticated-layout";
import { SIDE_PANEL_CLASSNAME } from "../lib/constants";

export function SidebarApp() {
  const { isAuthenticated, isValidating, setSession, validateSession } =
    useAuthStore();
  const { initTheme } = useThemeStore();

  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Initialize theme on mount (apply persisted or system preference)
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Validate stored session on mount
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const handleSignIn = useCallback(async () => {
    setSignInLoading(true);
    setSignInError(null);

    try {
      await signInWithGoogle();

      // After successful OAuth, validateSession will fetch profile and hydrate store
      // No need to set minimal profile first — validateSession handles everything
      await validateSession();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Sign-in failed. Please try again.";
      setSignInError(message);
    } finally {
      setSignInLoading(false);
    }
  }, [validateSession]);

  // Loading state — session validation in progress
  if (isValidating && !isAuthenticated) {
    const header = (
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg font-bold text-foreground tracking-tight">
          Jobswyft
        </span>
      </div>
    );

    return (
      <ExtensionSidebar header={header} className={SIDE_PANEL_CLASSNAME}>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Restoring session...
            </p>
          </div>
        </div>
      </ExtensionSidebar>
    );
  }

  // Authenticated — show full layout
  if (isAuthenticated) {
    return <AuthenticatedLayout />;
  }

  // Unauthenticated — show login screen
  const header = (
    <div className="flex items-center gap-2 px-1">
      <span className="text-lg font-bold text-foreground tracking-tight">
        Jobswyft
      </span>
    </div>
  );

  return (
    <ExtensionSidebar header={header} className={SIDE_PANEL_CLASSNAME}>
      <LoggedOutView
        onSignIn={handleSignIn}
        isLoading={signInLoading}
        error={signInError}
      />
    </ExtensionSidebar>
  );
}
