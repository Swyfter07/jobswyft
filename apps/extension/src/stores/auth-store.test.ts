import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "./auth-store";
import type { UserProfile } from "./auth-store";

// Mock dependencies
vi.mock("../lib/chrome-storage-adapter", () => ({
  chromeStorageAdapter: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

vi.mock("../lib/auth", () => ({
  signOut: vi.fn(async () => {}),
}));

vi.mock("../lib/storage", () => ({
  getSession: vi.fn(async () => null),
  removeSession: vi.fn(async () => {}),
}));

vi.mock("../lib/api-client", () => ({
  apiClient: {
    getMe: vi.fn(async () => null),
    logout: vi.fn(async () => {}),
  },
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isValidating: false,
    });
    vi.clearAllMocks();
  });

  it("should initialize with unauthenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it("should set session with user and token", () => {
    const mockUser: UserProfile = {
      id: "123",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: null,
    };
    const mockToken = "test-token";

    useAuthStore.getState().setSession(mockUser, mockToken);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe(mockToken);
  });

  it("should clear session on clearSession()", async () => {
    const { removeSession } = await import("../lib/storage");

    // Set initial session
    useAuthStore.getState().setSession(
      {
        id: "123",
        email: "test@example.com",
        name: "Test User",
        avatarUrl: null,
      },
      "test-token"
    );

    // Clear session
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(removeSession).toHaveBeenCalled();
  });

  it("should call server logout and clear session on signOut()", async () => {
    const { signOut: authSignOut } = await import("../lib/auth");
    const { apiClient } = await import("../lib/api-client");

    // Set initial session
    useAuthStore.getState().setSession(
      {
        id: "123",
        email: "test@example.com",
        name: "Test User",
        avatarUrl: null,
      },
      "test-token"
    );

    await useAuthStore.getState().signOut();

    expect(apiClient.logout).toHaveBeenCalledWith("test-token");
    expect(authSignOut).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
