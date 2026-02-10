import { useState, useCallback } from "react";
import { useSidebarStore } from "../stores/sidebar-store";
import { useScanStore } from "../stores/scan-store";
import { useAuthStore } from "../stores/auth-store";
import { useResumeStore } from "../stores/resume-store";
import { useCreditsStore } from "../stores/credits-store";
import { useToast } from "./toast-context";
import { apiClient, type MatchAnalysisResult } from "../lib/api-client";
import type { AIStudioSubTab } from "../stores/sidebar-store";

const SUB_TABS: { key: AIStudioSubTab; label: string }[] = [
  { key: "match", label: "Match" },
  { key: "cover-letter", label: "Cover Letter" },
  { key: "chat", label: "Answer" },
  { key: "outreach", label: "Outreach" },
];

const TONES = ["confident", "friendly", "enthusiastic", "professional", "executive"] as const;
const MAX_LENGTHS = [
  { value: 150, label: "Short" },
  { value: 300, label: "Medium" },
  { value: 500, label: "Standard" },
  { value: 1000, label: "Detailed" },
] as const;
const PLATFORMS = [
  { value: "linkedin", label: "LinkedIn", limit: 300 },
  { value: "email", label: "Email", limit: null },
  { value: "twitter", label: "Twitter", limit: 280 },
] as const;
const RECIPIENT_TYPES = [
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "referral", label: "Referral" },
] as const;

export function AIStudioTab() {
  const { toast } = useToast();
  const token = useAuthStore((s) => s.accessToken);
  const savedJobId = useScanStore((s) => s.savedJobId);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const { aiStudioSubTab, setAIStudioSubTab, matchData, setMatchData, aiStudioOutputs } = useSidebarStore();
  const fetchCredits = useCreditsStore((s) => s.fetchCredits);

  // Local state for each sub-tab
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchAnalysisResult | null>(null);
  const [coverLetter, setCoverLetter] = useState(aiStudioOutputs.coverLetter ?? "");
  const [answerText, setAnswerText] = useState("");
  const [outreachText, setOutreachText] = useState(aiStudioOutputs.outreach ?? "");

  // Cover Letter controls
  const [tone, setTone] = useState<(typeof TONES)[number]>("professional");
  const [customInstructions, setCustomInstructions] = useState("");

  // Answer controls
  const [question, setQuestion] = useState("");
  const [maxLength, setMaxLength] = useState<150 | 300 | 500 | 1000>(500);

  // Outreach controls
  const [platform, setPlatform] = useState<"linkedin" | "email" | "twitter">("linkedin");
  const [recipientType, setRecipientType] = useState<"recruiter" | "hiring_manager" | "referral">("recruiter");
  const [recipientName, setRecipientName] = useState("");

  const isLocked = !savedJobId || !activeResumeId;

  const handleError = useCallback(
    (err: unknown) => {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      if (msg.includes("CREDIT_EXHAUSTED")) {
        toast({ title: "No credits remaining", description: "Upgrade your plan to continue.", variant: "error" });
      }
    },
    [toast]
  );

  const refreshCredits = useCallback(() => {
    if (token) fetchCredits(token);
  }, [token, fetchCredits]);

  const copyToClipboard = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", variant: "success" });
    },
    [toast]
  );

  // ─── Match Analysis ──────────────────────────────────────────────
  const handleAnalyzeMatch = useCallback(async () => {
    if (!token || !savedJobId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await apiClient.analyzeMatch(token, savedJobId);
      setMatchResult(result);
      setMatchData({
        score: result.match_score,
        matchedSkills: result.strengths,
        missingSkills: result.gaps,
        summary: result.recommendations.join("; "),
      });
      refreshCredits();
    } catch (err) {
      handleError(err);
    } finally {
      setIsGenerating(false);
    }
  }, [token, savedJobId, setMatchData, handleError, refreshCredits]);

  // ─── Cover Letter ────────────────────────────────────────────────
  const handleGenerateCoverLetter = useCallback(async () => {
    if (!token || !savedJobId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await apiClient.generateCoverLetter(token, savedJobId, {
        tone,
        custom_instructions: customInstructions || undefined,
      });
      setCoverLetter(result.content);
      refreshCredits();
    } catch (err) {
      handleError(err);
    } finally {
      setIsGenerating(false);
    }
  }, [token, savedJobId, tone, customInstructions, handleError, refreshCredits]);

  // ─── Answer ──────────────────────────────────────────────────────
  const handleGenerateAnswer = useCallback(async () => {
    if (!token || !savedJobId || !question.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await apiClient.answerQuestion(token, savedJobId, question.trim(), {
        max_length: maxLength,
      });
      setAnswerText(result.content);
      refreshCredits();
    } catch (err) {
      handleError(err);
    } finally {
      setIsGenerating(false);
    }
  }, [token, savedJobId, question, maxLength, handleError, refreshCredits]);

  // ─── Outreach ────────────────────────────────────────────────────
  const handleGenerateOutreach = useCallback(async () => {
    if (!token || !savedJobId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await apiClient.generateOutreach(token, savedJobId, {
        platform,
        recipient_type: recipientType,
        recipient_name: recipientName || undefined,
      });
      setOutreachText(result.content);
      refreshCredits();
    } catch (err) {
      handleError(err);
    } finally {
      setIsGenerating(false);
    }
  }, [token, savedJobId, platform, recipientType, recipientName, handleError, refreshCredits]);

  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab navigation */}
      <div className="flex border-b border-border bg-muted/30">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAIStudioSubTab(tab.key)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              aiStudioSubTab === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lock overlay */}
      {isLocked && (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {!savedJobId ? "Scan and save a job first" : "Select a resume first"}
            </p>
            <p className="text-xs text-muted-foreground">
              AI features require both a saved job and an active resume.
            </p>
          </div>
        </div>
      )}

      {/* Content area */}
      {!isLocked && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ─── Match Sub-tab ──────────────────────────────────── */}
          {aiStudioSubTab === "match" && (
            <div className="space-y-3">
              <button
                onClick={handleAnalyzeMatch}
                disabled={isGenerating}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isGenerating ? "Analyzing..." : matchResult || matchData ? "Re-analyze Match" : "Analyze Match"}
              </button>

              {(matchResult || matchData) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {matchResult?.match_score ?? matchData?.score ?? 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Match Score</div>
                    </div>
                  </div>

                  {matchResult && (
                    <>
                      <Section title="Strengths" items={matchResult.strengths} color="text-green-600 dark:text-green-400" />
                      <Section title="Gaps" items={matchResult.gaps} color="text-amber-600 dark:text-amber-400" />
                      <Section title="Recommendations" items={matchResult.recommendations} color="text-blue-600 dark:text-blue-400" />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Cover Letter Sub-tab ──────────────────────────── */}
          {aiStudioSubTab === "cover-letter" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Tone</label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`rounded-full px-3 py-1 text-xs capitalize ${
                        tone === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Custom Instructions (optional)</label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., Emphasize my leadership experience..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-16"
                  maxLength={500}
                />
              </div>

              <button
                onClick={handleGenerateCoverLetter}
                disabled={isGenerating}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : coverLetter ? "Regenerate" : "Generate Cover Letter"}
              </button>

              {coverLetter && (
                <div className="space-y-2">
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {coverLetter}
                  </div>
                  <button
                    onClick={() => copyToClipboard(coverLetter)}
                    className="w-full rounded-md border border-input bg-background px-4 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── Answer Sub-tab ─────────────────────────────────── */}
          {aiStudioSubTab === "chat" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Application Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Paste the application question here..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20"
                  maxLength={2000}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Answer Length</label>
                <div className="flex gap-1.5">
                  {MAX_LENGTHS.map((ml) => (
                    <button
                      key={ml.value}
                      onClick={() => setMaxLength(ml.value)}
                      className={`flex-1 rounded-md px-2 py-1 text-xs ${
                        maxLength === ml.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {ml.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateAnswer}
                disabled={isGenerating || !question.trim()}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Answer"}
              </button>

              {answerText && (
                <div className="space-y-2">
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {answerText}
                  </div>
                  <button
                    onClick={() => copyToClipboard(answerText)}
                    className="w-full rounded-md border border-input bg-background px-4 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── Outreach Sub-tab ──────────────────────────────── */}
          {aiStudioSubTab === "outreach" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Platform</label>
                <div className="flex gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className={`flex-1 rounded-md px-2 py-1 text-xs ${
                        platform === p.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {selectedPlatform?.limit && (
                  <p className="text-micro text-muted-foreground">Max {selectedPlatform.limit} characters</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Recipient Type</label>
                <div className="flex gap-1.5">
                  {RECIPIENT_TYPES.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => setRecipientType(rt.value)}
                      className={`flex-1 rounded-md px-2 py-1 text-xs ${
                        recipientType === rt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Recipient Name (optional)</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g., Sarah"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  maxLength={100}
                />
              </div>

              <button
                onClick={handleGenerateOutreach}
                disabled={isGenerating}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : outreachText ? "Regenerate" : "Generate Outreach"}
              </button>

              {outreachText && (
                <div className="space-y-2">
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {outreachText}
                  </div>
                  <button
                    onClick={() => copyToClipboard(outreachText)}
                    className="w-full rounded-md border border-input bg-background px-4 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="space-y-1.5">
      <h4 className={`text-xs font-semibold ${color}`}>{title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
