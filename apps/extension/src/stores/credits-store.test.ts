import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCreditsStore } from "./credits-store";

// Mock chrome.storage adapter
vi.mock("../lib/chrome-storage-adapter", () => ({
  chromeStorageAdapter: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

// Mock api-client
vi.mock("../lib/api-client", () => ({
  apiClient: {
    getUsage: vi.fn(),
  },
}));

describe("useCreditsStore", () => {
  beforeEach(() => {
    useCreditsStore.setState({
      credits: 0,
      maxCredits: 5,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  // ─── Initial State ─────────────────────────────────────────────────

  describe("initial state", () => {
    it("should have correct defaults", () => {
      const state = useCreditsStore.getState();
      expect(state.credits).toBe(0);
      expect(state.maxCredits).toBe(5);
      expect(state.isLoading).toBe(false);
    });
  });

  // ─── fetchCredits ──────────────────────────────────────────────────

  describe("fetchCredits", () => {
    it("should fetch and update credits on success", async () => {
      const { apiClient } = await import("../lib/api-client");
      (apiClient.getUsage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        credits_remaining: 15,
        max_credits: 25,
      });

      await useCreditsStore.getState().fetchCredits("token123");

      const state = useCreditsStore.getState();
      expect(state.credits).toBe(15);
      expect(state.maxCredits).toBe(25);
      expect(state.isLoading).toBe(false);
      expect(apiClient.getUsage).toHaveBeenCalledWith("token123");
    });

    it("should set isLoading during fetch", async () => {
      const { apiClient } = await import("../lib/api-client");
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      (apiClient.getUsage as ReturnType<typeof vi.fn>).mockReturnValueOnce(pendingPromise);

      const fetchPromise = useCreditsStore.getState().fetchCredits("token123");

      // Should be loading while promise is pending
      expect(useCreditsStore.getState().isLoading).toBe(true);

      // Resolve
      resolvePromise!({ credits_remaining: 5, max_credits: 10 });
      await fetchPromise;

      expect(useCreditsStore.getState().isLoading).toBe(false);
    });

    it("should handle fetch error gracefully", async () => {
      const { apiClient } = await import("../lib/api-client");
      (apiClient.getUsage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Network error")
      );

      // Set initial credits to verify they are preserved on error
      useCreditsStore.setState({ credits: 10, maxCredits: 20 });

      await useCreditsStore.getState().fetchCredits("token123");

      const state = useCreditsStore.getState();
      expect(state.isLoading).toBe(false);
      // Credits preserved on error
      expect(state.credits).toBe(10);
      expect(state.maxCredits).toBe(20);
    });
  });

  // ─── setCredits ────────────────────────────────────────────────────

  describe("setCredits", () => {
    it("should update both credits and maxCredits", () => {
      useCreditsStore.getState().setCredits(8, 15);

      const state = useCreditsStore.getState();
      expect(state.credits).toBe(8);
      expect(state.maxCredits).toBe(15);
    });
  });

  // ─── resetCredits ──────────────────────────────────────────────────

  describe("resetCredits", () => {
    it("should reset credits to zero defaults", () => {
      useCreditsStore.setState({
        credits: 10,
        maxCredits: 20,
        isLoading: true,
      });

      useCreditsStore.getState().resetCredits();

      const state = useCreditsStore.getState();
      expect(state.credits).toBe(0);
      expect(state.maxCredits).toBe(0);
      expect(state.isLoading).toBe(false);
    });
  });

  // ─── Persist partialize ────────────────────────────────────────────

  describe("persist partialize", () => {
    it("should exclude isLoading from persisted state", () => {
      const persistOptions = (useCreditsStore as unknown as { persist: { getOptions: () => { partialize: (state: unknown) => unknown } } }).persist.getOptions();
      const mockState = {
        credits: 10,
        maxCredits: 20,
        isLoading: true,
      };

      const partialized = persistOptions.partialize(mockState) as Record<string, unknown>;
      expect(partialized).toHaveProperty("credits", 10);
      expect(partialized).toHaveProperty("maxCredits", 20);
      expect(partialized).not.toHaveProperty("isLoading");
    });
  });
});
