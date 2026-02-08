import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chromeStorageAdapter } from "../lib/chrome-storage-adapter";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  userOverride: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
  syncSystemTheme: () => void;
}

function applyThemeClass(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

function getSystemTheme(): Theme {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

// Apply theme immediately on module load (before React renders)
const initialTheme = getSystemTheme();
applyThemeClass(initialTheme);

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: initialTheme,
      userOverride: false,

      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        applyThemeClass(next);
        set({ theme: next, userOverride: true });
      },

      initTheme: () => {
        const { userOverride } = get();

        // Apply persisted theme (or system default) to DOM on startup
        applyThemeClass(get().theme);

        // Listen to system theme changes only if user hasn't manually toggled
        if (typeof window !== "undefined" && !userOverride) {
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          const handleChange = (e: MediaQueryListEvent) => {
            if (!get().userOverride) {
              const newTheme = e.matches ? "dark" : "light";
              applyThemeClass(newTheme);
              set({ theme: newTheme });
            }
          };
          mediaQuery.addEventListener("change", handleChange);
        }
      },

      syncSystemTheme: () => {
        // Reset to system preference (removes user override)
        const systemTheme = getSystemTheme();
        applyThemeClass(systemTheme);
        set({ theme: systemTheme, userOverride: false });
      },
    }),
    {
      name: "jobswyft-theme",
      storage: createJSONStorage(() => chromeStorageAdapter),
    }
  )
);
