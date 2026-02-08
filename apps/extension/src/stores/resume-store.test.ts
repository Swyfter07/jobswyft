import { describe, it, expect, beforeEach, vi } from "vitest";
import { useResumeStore } from "./resume-store";
import { ApiResponseError } from "@jobswyft/ui";

// Mock dependencies
vi.mock("../lib/chrome-storage-adapter", () => ({
  chromeStorageAdapter: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

vi.mock("../lib/api-client", () => ({
  apiClient: {
    listResumes: vi.fn(),
    getResume: vi.fn(),
    uploadResume: vi.fn(),
    setActiveResume: vi.fn(),
    deleteResume: vi.fn(),
  },
}));

// Mock @jobswyft/ui mapResumeResponse to avoid complex imports if not needed, 
// or just rely on real one if available. 
// Since we used dynamic import in store, we might need to mock the module or ensure it works.
// For testing, let's mock the UI library to control the output of mapResumeResponse.
vi.mock("@jobswyft/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    mapResumeResponse: vi.fn((data) => ({
      id: data.id,
      fileName: data.file_name,
      content: data.parsed_data?.content ?? "",
      // Add other fields minimal for test
    })),
  };
});

// Import mocked apiClient for test setup
import { apiClient } from "../lib/api-client";

const mockApiClient = vi.mocked(apiClient);

const TOKEN = "test-token";

describe("useResumeStore", () => {
  beforeEach(() => {
    useResumeStore.setState({
      resumes: [],
      activeResumeId: null,
      activeResumeData: null,
      isLoading: false,
      isUploading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("has empty initial state", () => {
      const state = useResumeStore.getState();
      expect(state.resumes).toEqual([]);
      expect(state.activeResumeId).toBeNull();
      expect(state.activeResumeData).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isUploading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("fetchResumes", () => {
    it("loads resumes and sets active from API", async () => {
      mockApiClient.listResumes.mockResolvedValue({
        items: [
          {
            id: "r1",
            file_name: "resume1.pdf",
            is_active: false,
            parse_status: "completed",
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
          {
            id: "r2",
            file_name: "resume2.pdf",
            is_active: true,
            parse_status: "completed",
            created_at: "2026-01-02",
            updated_at: "2026-01-02",
          },
        ],
        total: 2,
        page: 1,
        page_size: 20,
      });

      mockApiClient.getResume.mockResolvedValue({
        id: "r2",
        user_id: "u1",
        file_name: "resume2.pdf",
        file_path: "/path/resume2.pdf",
        parsed_data: {
          contact: { first_name: "Jane", last_name: "Doe", email: "jane@test.com", phone: null, location: null, linkedin_url: null },
          summary: null,
          experience: [],
          education: [],
          skills: ["TypeScript"],
        },
        parse_status: "completed",
        is_active: true,
        created_at: "2026-01-02",
        updated_at: "2026-01-02",
      });

      await useResumeStore.getState().fetchResumes(TOKEN);

      // Wait for async actions
      await vi.waitFor(() => {
        expect(useResumeStore.getState().activeResumeData).not.toBeNull();
      });

      const state = useResumeStore.getState();
      expect(state.resumes).toHaveLength(2);
      expect(state.resumes[0].fileName).toBe("resume1.pdf");
      expect(state.resumes[1].isActive).toBe(true);
      expect(state.activeResumeId).toBe("r2");
      expect(state.isLoading).toBe(false);
    });

    it("sets error on API failure", async () => {
      const error = new ApiResponseError("AUTH_REQUIRED", "Not authenticated", 401);
      mockApiClient.listResumes.mockRejectedValue(error);

      await useResumeStore.getState().fetchResumes(TOKEN);

      const state = useResumeStore.getState();
      expect(state.error).toBe("Not authenticated");
      expect(state.isLoading).toBe(false);
    });

    it("sets network error message on fetch failure", async () => {
      mockApiClient.listResumes.mockRejectedValue(new TypeError("Failed to fetch"));

      await useResumeStore.getState().fetchResumes(TOKEN);

      const state = useResumeStore.getState();
      expect(state.error).toBe("Check your connection and try again");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("uploadResume", () => {
    it("blocks upload when at 5 resumes", async () => {
      useResumeStore.setState({
        resumes: Array.from({ length: 5 }, (_, i) => ({
          id: `r${i}`,
          fileName: `resume${i}.pdf`,
          isActive: i === 0,
          parseStatus: "completed",
        })),
      });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      await useResumeStore.getState().uploadResume(TOKEN, file);

      expect(mockApiClient.uploadResume).not.toHaveBeenCalled();
      expect(useResumeStore.getState().error).toBe(
        "Maximum 5 resumes. Delete one to upload more."
      );
    });

    it("blocks non-PDF files", async () => {
      const file = new File(["content"], "test.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      await useResumeStore.getState().uploadResume(TOKEN, file);

      expect(mockApiClient.uploadResume).not.toHaveBeenCalled();
      expect(useResumeStore.getState().error).toBe("Only PDF files are allowed");
    });

    it("uploads successfully and adds to list", async () => {
      // Setup: Server returns new resume with is_active: false (default)
      mockApiClient.uploadResume.mockResolvedValue({
        resume: {
          id: "r-new",
          user_id: "u1",
          file_name: "new.pdf",
          file_path: "/path/new.pdf",
          parsed_data: null,
          parse_status: "processing",
          is_active: false,
          created_at: "2026-01-03",
          updated_at: "2026-01-03",
        },
        ai_provider_used: "openai",
      });

      // Mock setActiveResume success
      mockApiClient.setActiveResume.mockResolvedValue({
        message: "Active resume updated",
        active_resume_id: "r-new",
      });

      // Mock getResume call after setActiveResume
      mockApiClient.getResume.mockResolvedValue({
        id: "r-new",
        user_id: "u1",
        file_name: "new.pdf",
        file_path: "/path/new.pdf",
        parsed_data: null,
        parse_status: "processing",
        is_active: true, // It became active
        created_at: "2026-01-03",
        updated_at: "2026-01-03",
      });

      const file = new File(["content"], "new.pdf", { type: "application/pdf" });
      await useResumeStore.getState().uploadResume(TOKEN, file);

      // Verify active resume sync was called
      expect(mockApiClient.setActiveResume).toHaveBeenCalledWith(TOKEN, "r-new");
      
      const state = useResumeStore.getState();
      expect(state.resumes).toHaveLength(1);
      expect(state.resumes[0].id).toBe("r-new");
      // Ideally activeResumeId is set after setActiveResume succeeds
      // Wait for it
      await vi.waitFor(() => {
         expect(useResumeStore.getState().activeResumeId).toBe("r-new");
      });
      expect(state.isUploading).toBe(false);
    });
  });

  describe("deleteResume", () => {
    it("removes resume and falls back to first remaining", async () => {
      useResumeStore.setState({
        resumes: [
          { id: "r1", fileName: "a.pdf", isActive: true, parseStatus: "completed" },
          { id: "r2", fileName: "b.pdf", isActive: false, parseStatus: "completed" },
        ],
        activeResumeId: "r1",
        activeResumeData: { id: "r1", fileName: "a.pdf", content: "" } as any,
      });

      mockApiClient.deleteResume.mockResolvedValue({ message: "Deleted" });
      mockApiClient.getResume.mockResolvedValue({
        id: "r2",
        user_id: "u1",
        file_name: "b.pdf",
        file_path: "/path/b.pdf",
        parsed_data: null,
        parse_status: "completed",
        is_active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      });

      await useResumeStore.getState().deleteResume(TOKEN, "r1");

      const state = useResumeStore.getState();
      expect(state.resumes).toHaveLength(1);
      expect(state.resumes[0].id).toBe("r2");
      expect(state.activeResumeId).toBe("r2");
    });
  });

  describe("setActiveResume", () => {
    it("updates active resume and fetches detail", async () => {
      useResumeStore.setState({
        resumes: [
          { id: "r1", fileName: "a.pdf", isActive: true, parseStatus: "completed" },
          { id: "r2", fileName: "b.pdf", isActive: false, parseStatus: "completed" },
        ],
        activeResumeId: "r1",
      });

      mockApiClient.setActiveResume.mockResolvedValue({
        message: "Active resume updated",
        active_resume_id: "r2",
      });

      mockApiClient.getResume.mockResolvedValue({
        id: "r2",
        user_id: "u1",
        file_name: "b.pdf",
        file_path: "/path/b.pdf",
        parsed_data: {
          contact: { first_name: "Bob", last_name: null, email: null, phone: null, location: null, linkedin_url: null },
          summary: null,
          experience: [],
          education: [],
          skills: [],
        },
        parse_status: "completed",
        is_active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      });

      await useResumeStore.getState().setActiveResume(TOKEN, "r2");

      const state = useResumeStore.getState();
      expect(state.activeResumeId).toBe("r2");
      expect(state.resumes[0].isActive).toBe(false);
      expect(state.resumes[1].isActive).toBe(true);
    });
  });

  describe("clearError", () => {
    it("clears error state", () => {
      useResumeStore.setState({ error: "Some error" });
      useResumeStore.getState().clearError();
      expect(useResumeStore.getState().error).toBeNull();
    });
  });
});
