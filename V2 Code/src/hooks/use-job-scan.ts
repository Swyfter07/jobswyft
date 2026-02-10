import { useState, useEffect, useCallback } from "react";
import type { JobData, MatchAnalysis } from "@jobswyft/ui";
import { scrapeActiveTab } from "@/services/scraper";
import { generateMatchAnalysis, constructResumeSummary } from "@/services/openai";
import type { ResumeProfile, OpenAIModel } from "@/types/storage";

export interface UseJobScanReturn {
  jobData: JobData;
  matchData: MatchAnalysis | null;
  isScanning: boolean;
  isAnalyzing: boolean;
  autoScanEnabled: boolean;
  scanPage: () => Promise<void>;
  updateJobField: (field: keyof JobData, value: string) => void;
  analyzeMatch: () => Promise<void>;
  toggleAutoScan: () => void;
  clearJob: () => void;
}

const emptyJob: JobData = {
  title: "",
  company: "",
  location: "",
  salary: "",
  description: "",
};

export function useJobScan(): UseJobScanReturn {
  const [jobData, setJobData] = useState<JobData>(emptyJob);
  const [matchData, setMatchData] = useState<MatchAnalysis | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState(0);

  // Load auto-scan preference and initial job data
  useEffect(() => {
    chrome.storage.local.get(["job_jet_auto_scan_enabled", "job_jet_current_job", "job_jet_current_match"]).then((result) => {
      setAutoScanEnabled(result.job_jet_auto_scan_enabled !== false);
      if (result.job_jet_current_job) {
        setJobData(result.job_jet_current_job);
      }
      if (result.job_jet_current_match) {
        setMatchData(result.job_jet_current_match);
      }
    });
  }, []);

  // Persist job data when it changes
  useEffect(() => {
    if (jobData !== emptyJob) {
      chrome.storage.local.set({ job_jet_current_job: jobData });
    }
  }, [jobData]);

  useEffect(() => {
    if (matchData) {
      chrome.storage.local.set({ job_jet_current_match: matchData });
    }
  }, [matchData]);

  // Listen for auto-scan requests from service worker
  useEffect(() => {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== "local") return;
      if (!changes.job_jet_auto_scan_request) return;

      const request = changes.job_jet_auto_scan_request.newValue;
      if (!request || request.timestamp <= lastProcessedTimestamp) return;

      setLastProcessedTimestamp(request.timestamp);
      handleAutoScan(request.tabId);
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [lastProcessedTimestamp]);

  const handleAutoScan = useCallback(
    async (tabId: number) => {
      // Skip if already has content
      if (jobData.description && jobData.description.length > 100) return;

      setIsScanning(true);
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId, allFrames: true },
          func: () => {
            const clean = (str: string) =>
              str ? str.trim().replace(/\s+/g, " ") : "";
            let title = "";
            const h1 = document.querySelector("h1");
            if (h1) title = clean(h1.innerText);
            if (!title) {
              const ogTitle = document.querySelector('meta[property="og:title"]');
              if (ogTitle) title = clean((ogTitle as HTMLMetaElement).content);
            }
            if (!title) title = clean(document.title);

            let company = "";
            let description = "";
            try {
              const scripts = document.querySelectorAll('script[type="application/ld+json"]');
              for (const script of scripts) {
                const json = JSON.parse(script.textContent || "");
                if (json["@type"] === "JobPosting") {
                  if (json.hiringOrganization) company = json.hiringOrganization.name;
                  if (json.description)
                    description = json.description.replace(/<[^>]*>?/gm, "");
                  break;
                }
              }
            } catch { }
            if (!company) {
              const ogSiteName = document.querySelector('meta[property="og:site_name"]');
              if (ogSiteName) company = clean((ogSiteName as HTMLMetaElement).content);
            }
            if (!description) {
              const selectors = [
                ".jobs-description__content", "#job-details", ".show-more-less-html__markup",
                "#jobDescriptionText", ".jobsearch-jobDescriptionText",
                '[data-automation-id="jobPostingDescription"]',
                "#content", ".job-post-description",
                '[class*="job-description"]', '[class*="jobDescription"]',
                '[class*="description"]', "article", "main",
              ];
              for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && (el as HTMLElement).innerText.length > 100) {
                  description = clean((el as HTMLElement).innerText);
                  break;
                }
              }
            }
            let location = "";
            let salary = "";
            try {
              const scripts = document.querySelectorAll('script[type="application/ld+json"]');
              for (const script of scripts) {
                const json = JSON.parse(script.textContent || "");
                if (json["@type"] === "JobPosting") {
                  if (json.jobLocation?.address) {
                    const addr = json.jobLocation.address;
                    location = [addr.addressLocality, addr.addressRegion].filter(Boolean).join(", ");
                  }
                  if (json.baseSalary?.value) {
                    const val = json.baseSalary.value;
                    salary = (val.minValue ? val.minValue + "-" + val.maxValue : val.value) + " " + (val.currency || "");
                  }
                  break;
                }
              }
            } catch { }
            return { title, company, location, salary, description, url: window.location.href };
          },
        });

        const data = { ...emptyJob };
        for (const result of results || []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fd = (result?.result as any) || {};
          if (fd.title && !data.title) data.title = fd.title;
          if (fd.company && !data.company) data.company = fd.company;
          if (fd.location && !data.location) data.location = fd.location;
          if (fd.salary && !data.salary) data.salary = fd.salary;
          if (fd.description && fd.description.length > (data.description?.length || 0)) {
            data.description = fd.description;
          }
        }
        setJobData(data);
      } catch (err) {
        console.error("[JobSwyft] Auto-scan error:", err);
      } finally {
        setIsScanning(false);
      }
    },
    [jobData.description]
  );

  const scanPage = useCallback(async () => {
    setIsScanning(true);
    try {
      const data = await scrapeActiveTab();
      setJobData({
        title: data.title,
        company: data.company,
        location: data.location,
        salary: data.salary,
        description: data.description
          .replace(/<!DOCTYPE[^>]*>/gi, "")
          .replace(/<[^>]*>/g, "")
          .trim(),
      });
    } catch (err) {
      console.error("[JobSwyft] Scan error:", err);
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const updateJobField = useCallback(
    (field: keyof JobData, value: string) => {
      setJobData((prev: JobData) => ({ ...prev, [field]: value }));
    },
    []
  );

  const analyzeMatch = useCallback(async () => {
    if (!jobData.description || jobData.description.length < 50) {
      throw new Error("Please scan a job description first.");
    }

    setIsAnalyzing(true);
    try {
      const result = await chrome.storage.local.get([
        "job_jet_profile",
        "job_jet_openai_key",
        "job_jet_openai_model",
      ]);
      const profile = result.job_jet_profile as ResumeProfile | null;
      const apiKey = result.job_jet_openai_key as string | undefined;
      const model =
        (result.job_jet_openai_model as OpenAIModel) || "gpt-4o-mini";

      if (!profile) throw new Error("Please upload and parse a resume first.");
      if (!apiKey) throw new Error("Please set your OpenAI API key.");

      const resumeText = constructResumeSummary(profile);
      const analysis = await generateMatchAnalysis(
        apiKey,
        model,
        resumeText,
        jobData.title,
        jobData.description || ""
      );

      setMatchData({
        score: analysis.score,
        matchedSkills: analysis.matchedSkills,
        missingSkills: analysis.missingSkills,
        explanation: analysis.summary,
        tips: analysis.tips || [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [jobData]);

  const toggleAutoScan = useCallback(() => {
    const newValue = !autoScanEnabled;
    setAutoScanEnabled(newValue);
    chrome.storage.local.set({ job_jet_auto_scan_enabled: newValue });
  }, [autoScanEnabled]);

  const clearJob = useCallback(() => {
    setJobData(emptyJob);
    setMatchData(null);
  }, []);

  return {
    jobData,
    matchData,
    isScanning,
    isAnalyzing,
    autoScanEnabled,
    scanPage,
    updateJobField,
    analyzeMatch,
    toggleAutoScan,
    clearJob,
  };
}
