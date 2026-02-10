import { useState, useCallback } from "react";
import type { OpenAIModel, ResumeProfile } from "@/types/storage";
import { useStorage } from "./use-storage";
import {
  generateCoverLetter,
  generateAnswer,
  generateOutreach,
  regenerateWithFeedback,
  constructResumeSummary,
  stripHTML,
} from "@/services/openai";

export interface UseOpenAIReturn {
  apiKey: string;
  model: OpenAIModel;
  hasKey: boolean;
  isGenerating: boolean;
  saveApiKey: (key: string) => boolean;
  removeApiKey: () => void;
  setModel: (model: OpenAIModel) => void;
  genCoverLetter: (options: {
    length: string;
    tone: string;
  }) => Promise<string>;
  genAnswer: (options: {
    question: string;
    length: string;
    tone: string;
  }) => Promise<string>;
  genOutreach: (options: {
    managerName: string;
    type: string;
    tone: string;
  }) => Promise<string>;
  regenerate: (
    original: string,
    feedback: string,
    contentType: string
  ) => Promise<string>;
}

export function useOpenAI(): UseOpenAIReturn {
  const [apiKey, setApiKey] = useStorage("job_jet_openai_key", "");
  const [model, setModelStorage] = useStorage(
    "job_jet_openai_model",
    "gpt-4o-mini" as OpenAIModel
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const hasKey = !!apiKey && apiKey.startsWith("sk-");

  const saveApiKey = useCallback(
    (key: string): boolean => {
      if (!key.startsWith("sk-")) return false;
      setApiKey(key);
      return true;
    },
    [setApiKey]
  );

  const removeApiKey = useCallback(() => {
    setApiKey("");
    chrome.storage.local.remove(["job_jet_openai_key"]);
  }, [setApiKey]);

  const setModel = useCallback(
    (m: OpenAIModel) => {
      setModelStorage(m);
    },
    [setModelStorage]
  );

  /**
   * Get current job + profile context from storage
   */
  async function getContext(): Promise<{
    profile: ResumeProfile;
    jobTitle: string;
    jobCompany: string;
    jobDesc: string;
  }> {
    const result = await chrome.storage.local.get(["job_jet_profile"]);
    const profile = result.job_jet_profile as ResumeProfile | null;
    if (!profile) throw new Error("No resume found. Upload and parse one first.");

    // Get job data from the DOM-level (pass via component state instead)
    // For now, we read from the singleton pattern. Components should pass this.
    return {
      profile,
      jobTitle: "",
      jobCompany: "",
      jobDesc: "",
    };
  }

  const genCoverLetter = useCallback(
    async (options: { length: string; tone: string }): Promise<string> => {
      if (!hasKey) throw new Error("No API key set.");
      setIsGenerating(true);
      try {
        const ctx = await getContext();
        const resumeData = stripHTML(constructResumeSummary(ctx.profile));
        return await generateCoverLetter(
          apiKey,
          model,
          resumeData,
          ctx.jobDesc,
          ctx.jobTitle,
          ctx.jobCompany,
          options.length,
          options.tone
        );
      } catch (err: any) {
        if (err.message === "INVALID_KEY") removeApiKey();
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiKey, model, hasKey, removeApiKey]
  );

  const genAnswer = useCallback(
    async (options: {
      question: string;
      length: string;
      tone: string;
    }): Promise<string> => {
      if (!hasKey) throw new Error("No API key set.");
      setIsGenerating(true);
      try {
        const ctx = await getContext();
        const resumeSummary = constructResumeSummary(ctx.profile);
        return await generateAnswer(
          apiKey,
          model,
          options.question,
          resumeSummary,
          ctx.jobTitle,
          ctx.jobCompany,
          options.length,
          options.tone
        );
      } catch (err: any) {
        if (err.message === "INVALID_KEY") removeApiKey();
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiKey, model, hasKey, removeApiKey]
  );

  const genOutreach = useCallback(
    async (options: {
      managerName: string;
      type: string;
      tone: string;
    }): Promise<string> => {
      if (!hasKey) throw new Error("No API key set.");
      setIsGenerating(true);
      try {
        const ctx = await getContext();
        const resumeData = constructResumeSummary(ctx.profile);
        return await generateOutreach(
          apiKey,
          model,
          resumeData,
          ctx.jobTitle,
          ctx.jobCompany,
          options.managerName,
          options.type,
          options.tone
        );
      } catch (err: any) {
        if (err.message === "INVALID_KEY") removeApiKey();
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiKey, model, hasKey, removeApiKey]
  );

  const regenerate = useCallback(
    async (
      original: string,
      feedback: string,
      contentType: string
    ): Promise<string> => {
      if (!hasKey) throw new Error("No API key set.");
      setIsGenerating(true);
      try {
        return await regenerateWithFeedback(
          apiKey,
          model,
          original,
          feedback,
          contentType
        );
      } catch (err: any) {
        if (err.message === "INVALID_KEY") removeApiKey();
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiKey, model, hasKey, removeApiKey]
  );

  return {
    apiKey,
    model,
    hasKey,
    isGenerating,
    saveApiKey,
    removeApiKey,
    setModel,
    genCoverLetter,
    genAnswer,
    genOutreach,
    regenerate,
  };
}
