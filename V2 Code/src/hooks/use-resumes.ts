import { useState, useEffect, useCallback } from "react";
import type {
  ResumeEntry,
  ResumeProfile,
  OpenAIModel,
} from "@/types/storage";
import type {
  ResumeData,
  ResumeSummary,
} from "@jobswyft/ui";
import { extractTextFromPDF, parseResumeToProfile, extractPersonalInfo } from "@/services/pdf-parser";
import { parseResumeWithAI } from "@/services/openai";

export interface UseResumesReturn {
  resumes: ResumeSummary[];
  activeResumeId: string | null;
  activeResumeData: ResumeData | null;
  isLoading: boolean;
  isParsing: boolean;
  selectResume: (id: string) => void;
  uploadResume: (file: File) => Promise<void>;
  deleteResume: (id: string) => void;
  reparseResume: () => Promise<void>;
}

/**
 * Transform V1 profile shape to @jobswyft/ui ResumeData shape
 */
function toResumeData(
  entry: ResumeEntry
): ResumeData | null {
  if (!entry.profile) return null;
  const p = entry.profile;

  return {
    id: entry.id,
    fileName: entry.name,
    personalInfo: {
      fullName: p.personal_info?.name || "",
      email: p.personal_info?.email || "",
      phone: p.personal_info?.phone || "",
      location: p.personal_info?.location || "",
      linkedin: p.personal_info?.linkedin,
      website: p.personal_info?.portfolio,
    },
    skills: p.skills || [],
    experience: (p.experience || []).map((e) => ({
      title: e.title,
      company: e.company,
      startDate: e.dates?.split(/[-–]|to/i)[0]?.trim() || "",
      endDate: e.dates?.split(/[-–]|to/i)[1]?.trim() || "",
      description: e.description,
      highlights: e.description
        ? e.description
          .split("\n")
          .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•"))
          .map((l) => l.replace(/^[-•]\s*/, "").trim())
        : [],
    })),
    education: (p.education || []).map((e) => ({
      institution: e.school,
      degree: e.degree?.trim() || "",
      startDate: e.dates?.split(/[-–]|to/i)[0]?.trim() || "",
      endDate: e.dates?.split(/[-–]|to/i)[1]?.trim() || "",
      highlights: [],
    })),
    certifications: (p.certifications || []).map((c: any) => ({
      name: c.name,
      issuer: c.issuer || "",
      date: c.date || "",
    })),
    projects: (p.projects || []).map((pr) => ({
      name: pr.name,
      description: pr.description,
      techStack: typeof pr.technologies === "string"
        ? pr.technologies.split(",").map((t) => t.trim())
        : Array.isArray(pr.technologies)
          ? pr.technologies
          : [],
      highlights: [],
    })),
  };
}

export function useResumes(): UseResumesReturn {
  const [rawResumes, setRawResumes] = useState<ResumeEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    console.log("[JobSwyft] useResumes hook initialized");
  }, []);

  // Load initial state
  useEffect(() => {
    chrome.storage.local
      .get(["job_jet_resumes", "job_jet_active_resume_id"])
      .then((result) => {
        let resumes: ResumeEntry[] = result.job_jet_resumes || [];
        let activeResumeId: string | null =
          result.job_jet_active_resume_id || null;

        // Ensure activeId is valid
        if (
          resumes.length > 0 &&
          (!activeResumeId || !resumes.find((r) => r.id === activeResumeId))
        ) {
          activeResumeId = resumes[0].id;
          chrome.storage.local.set({
            job_jet_active_resume_id: activeResumeId,
          });
        }

        setRawResumes(resumes);
        setActiveId(activeResumeId);
        setIsLoading(false);

        // Sync active profile
        const active = resumes.find((r) => r.id === activeResumeId);
        if (active?.profile) {
          chrome.storage.local.set({ job_jet_profile: active.profile });
        }
      });
  }, []);

  const selectResume = useCallback(
    (id: string) => {
      setActiveId(id);
      const selected = rawResumes.find((r) => r.id === id);
      chrome.storage.local.set({
        job_jet_active_resume_id: id,
        job_jet_profile: selected?.profile || null,
      });
    },
    [rawResumes]
  );

  const uploadResume = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        throw new Error("Only PDF files are supported");
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const newResume: ResumeEntry = {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        name: file.name,
        data: base64,
      };

      const updated = [...rawResumes, newResume];
      setRawResumes(updated);
      setActiveId(newResume.id);

      await chrome.storage.local.set({
        job_jet_resumes: updated,
        job_jet_active_resume_id: newResume.id,
      });

      // Auto-parse
      await parseResume(newResume, updated);
    },
    [rawResumes]
  );

  const parseResume = useCallback(
    async (resume: ResumeEntry, currentResumes: ResumeEntry[]) => {
      setIsParsing(true);
      try {
        const fullText = await extractTextFromPDF(resume.data);
        const personalInfo = extractPersonalInfo(fullText);

        console.log(`[JobSwyft] Extracted text length: ${fullText.length} chars`);
        if (fullText.length < 50) {
          console.warn("[JobSwyft] Warning: Extracted text is very short/empty.");
        }

        // Check for API key for AI parsing
        const result = await chrome.storage.local.get([
          "job_jet_openai_key",
          "job_jet_openai_model",
        ]);
        const apiKey = result.job_jet_openai_key as string | undefined;
        const model = (result.job_jet_openai_model as OpenAIModel) || "gpt-4o-mini";

        let profile: ResumeProfile;
        if (apiKey) {
          console.log("[JobSwyft] Using AI parsing with model:", model);
          try {
            profile = await parseResumeWithAI(apiKey, model, fullText);
            console.log("[JobSwyft] AI Parsing success");
          } catch (aiError) {
            console.error("[JobSwyft] AI Parsing failed, falling back to regex. Error:", aiError);
            profile = parseResumeToProfile(fullText);
          }
          // Merge regex-extracted personal info
          if (!profile.personal_info) profile.personal_info = {};
          Object.assign(profile.personal_info, personalInfo);
        } else {
          console.log("[JobSwyft] No API key found, using Regex parsing.");
          profile = parseResumeToProfile(fullText);
          profile.personal_info = {
            ...profile.personal_info,
            ...personalInfo,
          };
        }

        // Update resume with profile
        resume.profile = profile;
        const updatedResumes = currentResumes.map((r) =>
          r.id === resume.id ? resume : r
        );
        setRawResumes(updatedResumes);

        await chrome.storage.local.set({
          job_jet_resumes: updatedResumes,
          job_jet_profile: profile,
          job_jet_info: profile.personal_info || {},
        });
      } catch (error) {
        console.error("[JobSwyft] Resume parsing error:", error);
      } finally {
        setIsParsing(false);
      }
    },
    []
  );

  const deleteResume = useCallback(
    (id: string) => {
      const updated = rawResumes.filter((r) => r.id !== id);
      const newActiveId =
        updated.length > 0 ? updated[0].id : null;

      setRawResumes(updated);
      setActiveId(newActiveId);

      chrome.storage.local.set({
        job_jet_resumes: updated,
        job_jet_active_resume_id: newActiveId,
        job_jet_profile: newActiveId
          ? updated.find((r) => r.id === newActiveId)?.profile || null
          : null,
      });
    },
    [rawResumes]
  );

  const reparseResume = useCallback(async () => {
    const active = rawResumes.find((r) => r.id === activeId);
    if (!active) return;
    await parseResume(active, rawResumes);
  }, [rawResumes, activeId, parseResume]);

  // Derived data
  const resumes: ResumeSummary[] = rawResumes.map((r) => ({
    id: r.id,
    fileName: r.name,
  }));

  const activeEntry = rawResumes.find((r) => r.id === activeId);
  const activeResumeData = activeEntry ? toResumeData(activeEntry) : null;

  return {
    resumes,
    activeResumeId: activeId,
    activeResumeData,
    isLoading,
    isParsing,
    selectResume,
    uploadResume,
    deleteResume,
    reparseResume,
  };
}
