// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";

// Mock chrome.storage BEFORE import
vi.mock("../lib/chrome-storage-adapter", () => ({
  chromeStorageAdapter: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

describe("useThemeStore", () => {
  let useThemeStore: any;

  beforeAll(async () => {
    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)" ? false : true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Dynamic import to ensure window mock is ready
    const mod = await import("./theme-store");
    useThemeStore = mod.useThemeStore;
  });

  beforeEach(() => {
    if (useThemeStore) {
      // Reset store state before each test
      useThemeStore.setState({
        theme: "light",
        userOverride: false,
      });
    }
    vi.clearAllMocks();
  });

  it("should initialize with system theme", () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe("light");
    expect(state.userOverride).toBe(false);
  });

  it("should toggle theme from light to dark", () => {
    useThemeStore.getState().toggleTheme();
    const state = useThemeStore.getState();
    expect(state.theme).toBe("dark");
    expect(state.userOverride).toBe(true);
  });

  it("should toggle theme from dark to light", () => {
    useThemeStore.setState({ theme: "dark", userOverride: false });
    useThemeStore.getState().toggleTheme();
    const state = useThemeStore.getState();
    expect(state.theme).toBe("light");
    expect(state.userOverride).toBe(true);
  });

  it("should sync to system theme when syncSystemTheme() is called", () => {
    // User manually toggles to dark
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().userOverride).toBe(true);

    // Sync back to system theme (light)
    useThemeStore.getState().syncSystemTheme();
    const state = useThemeStore.getState();
    expect(state.theme).toBe("light");
    expect(state.userOverride).toBe(false);
  });
});
