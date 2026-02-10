import { useState, useEffect, useCallback } from "react";
import type { AutofillField } from "@jobswyft/ui";
import type { ResumeProfile } from "@/types/storage";
import { fillActiveTab, buildAutofillData } from "@/services/autofill";
import { injectResumeFile } from "@/services/scraper";

export interface UseAutofillReturn {
  fields: AutofillField[];
  isFilling: boolean;
  showUndoPrompt: boolean;
  filledCount: number | null;
  fillForm: () => Promise<void>;
  injectResume: () => Promise<void>;
  dismissUndo: () => void;
}

function buildFields(profile: ResumeProfile | null): AutofillField[] {
  if (!profile) return [];

  const pi = profile.personal_info || {};
  const exp = profile.experience?.[0];
  const edu = profile.education?.[0];

  const fields: AutofillField[] = [
    {
      id: "name",
      label: "Full Name",
      value: pi.name || undefined,
      status: pi.name ? "ready" : "missing",
      category: "personal",
    },
    {
      id: "email",
      label: "Email",
      value: pi.email || undefined,
      status: pi.email ? "ready" : "missing",
      category: "personal",
    },
    {
      id: "phone",
      label: "Phone",
      value: pi.phone || undefined,
      status: pi.phone ? "ready" : "missing",
      category: "personal",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      value: pi.linkedin || undefined,
      status: pi.linkedin ? "ready" : "missing",
      category: "personal",
    },
  ];

  if (exp) {
    fields.push({
      id: "currentTitle",
      label: "Current Title",
      value: exp.title,
      status: "ready",
      category: "resume",
    });
    fields.push({
      id: "currentCompany",
      label: "Current Company",
      value: exp.company,
      status: "ready",
      category: "resume",
    });
  }

  if (edu) {
    fields.push({
      id: "school",
      label: "School",
      value: edu.school,
      status: "ready",
      category: "resume",
    });
    fields.push({
      id: "degree",
      label: "Degree",
      value: edu.degree?.trim() || undefined,
      status: edu.degree ? "ready" : "missing",
      category: "resume",
    });
  }

  if (profile.skills?.length) {
    fields.push({
      id: "skills",
      label: "Skills",
      value: profile.skills.slice(0, 5).join(", "),
      status: "ready",
      category: "resume",
    });
  }

  return fields;
}

export function useAutofill(): UseAutofillReturn {
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [isFilling, setIsFilling] = useState(false);
  const [showUndoPrompt, setShowUndoPrompt] = useState(false);
  const [filledCount, setFilledCount] = useState<number | null>(null);

  // Sync with storage
  useEffect(() => {
    chrome.storage.local.get(["job_jet_profile"]).then((result) => {
      setProfile(result.job_jet_profile || null);
    });

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes.job_jet_profile) {
        setProfile(changes.job_jet_profile.newValue || null);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const fillForm = useCallback(async () => {
    if (!profile) return;
    setIsFilling(true);
    setFilledCount(null);
    try {
      const count = await fillActiveTab(profile);
      setFilledCount(count);
      if (count > 0) setShowUndoPrompt(true);
    } finally {
      setIsFilling(false);
    }
  }, [profile]);

  const injectResume = useCallback(async () => {
    const result = await chrome.storage.local.get([
      "job_jet_resumes",
      "job_jet_active_resume_id",
    ]);
    const resumes = result.job_jet_resumes || [];
    const activeId = result.job_jet_active_resume_id;
    const active = resumes.find(
      (r: { id: string }) => r.id === activeId
    );

    if (!active?.data) {
      throw new Error("No active resume to inject.");
    }

    await injectResumeFile(active.name, active.data);
  }, []);

  const dismissUndo = useCallback(() => {
    setShowUndoPrompt(false);
  }, []);

  return {
    fields: buildFields(profile),
    isFilling,
    showUndoPrompt,
    filledCount,
    fillForm,
    injectResume,
    dismissUndo,
  };
}
