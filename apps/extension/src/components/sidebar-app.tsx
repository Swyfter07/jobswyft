import { useState, useCallback } from "react";
import { ExtensionSidebar, LoggedOutView } from "@jobswyft/ui";
import { signInWithGoogle } from "../lib/auth";

type AuthState = "unauthenticated" | "authenticated";

export function SidebarApp() {
  const [authState, setAuthState] = useState<AuthState>("unauthenticated");
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setSignInLoading(true);
    setSignInError(null);

    try {
      await signInWithGoogle();
      setAuthState("authenticated");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign-in failed. Please try again.";
      setSignInError(message);
    } finally {
      setSignInLoading(false);
    }
  }, []);

  const header = (
    <div className="flex items-center gap-2 px-1">
      <span className="text-lg font-bold text-foreground tracking-tight">
        Jobswyft
      </span>
    </div>
  );

  // Side panel overrides: browser manages dimensions, so remove fixed positioning
  const panelClassName =
    "relative inset-auto h-screen w-full border-l-0 shadow-none z-auto";

  // Unauthenticated state — show login screen
  if (authState === "unauthenticated") {
    return (
      <ExtensionSidebar header={header} className={panelClassName}>
        <LoggedOutView
          onSignIn={handleSignIn}
          isLoading={signInLoading}
          error={signInError}
        />
      </ExtensionSidebar>
    );
  }

  // Authenticated state — placeholder for future stories
  return (
    <ExtensionSidebar
      header={header}
      className={panelClassName}
      scanContent={
        <div className="text-center text-muted-foreground text-sm py-8">
          Authenticated! Next stories will build this view.
        </div>
      }
    />
  );
}
