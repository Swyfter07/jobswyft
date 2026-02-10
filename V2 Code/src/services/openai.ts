import type { OpenAIModel, ResumeProfile } from "@/types/storage";
import { PROMPTS } from "./prompts";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GenerateOptions {
  model: OpenAIModel;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
}

export async function generateCompletion(
  apiKey: string,
  options: GenerateOptions
): Promise<string> {
  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
  };
  if (options.maxTokens) body.max_tokens = options.maxTokens;
  if (options.responseFormat) body.response_format = options.responseFormat;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error("INVALID_KEY");
    }
    throw new Error(
      err.error?.message || `OpenAI API Error (${response.status})`
    );
  }

  const json = await response.json();
  return json.choices[0].message.content.trim();
}

export async function generateMatchAnalysis(
  apiKey: string,
  model: OpenAIModel,
  resumeText: string,
  jobTitle: string,
  jobDesc: string
): Promise<{
  score: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  tips: string[];
}> {
  const content = await generateCompletion(apiKey, {
    model,
    messages: [
      { role: "system", content: PROMPTS.match_analysis.system },
      {
        role: "user",
        content: PROMPTS.match_analysis.user(resumeText, jobTitle, jobDesc),
      },
    ],
    temperature: 0.0,
  });

  return JSON.parse(content);
}

export async function generateCoverLetter(
  apiKey: string,
  model: OpenAIModel,
  resumeData: string,
  jobDesc: string,
  jobTitle: string,
  company: string,
  length: string,
  tone: string
): Promise<string> {
  const maxTokens =
    length === "very_long"
      ? 1200
      : length === "long"
        ? 800
        : length === "short"
          ? 300
          : 500;

  return generateCompletion(apiKey, {
    model,
    messages: [
      { role: "system", content: PROMPTS.cover_letter.system(tone) },
      {
        role: "user",
        content: PROMPTS.cover_letter.user(
          resumeData,
          jobDesc,
          jobTitle,
          company,
          length,
          tone
        ),
      },
    ],
    temperature: 0.7,
    maxTokens,
  });
}

export async function generateAnswer(
  apiKey: string,
  model: OpenAIModel,
  question: string,
  resumeSummary: string,
  jobTitle: string,
  company: string,
  length: string,
  tone: string
): Promise<string> {
  const maxTokens =
    length === "long" ? 800 : length === "short" ? 200 : 500;

  return generateCompletion(apiKey, {
    model,
    messages: [
      { role: "system", content: PROMPTS.answer_question.system(tone) },
      {
        role: "user",
        content: PROMPTS.answer_question.user(
          question,
          resumeSummary,
          jobTitle,
          company,
          length,
          tone
        ),
      },
    ],
    temperature: 0.7,
    maxTokens,
  });
}

export async function generateOutreach(
  apiKey: string,
  model: OpenAIModel,
  resumeData: string,
  jobTitle: string,
  company: string,
  managerName: string,
  type: string,
  tone: string
): Promise<string> {
  return generateCompletion(apiKey, {
    model,
    messages: [
      { role: "system", content: PROMPTS.outreach_message.system },
      {
        role: "user",
        content: PROMPTS.outreach_message.user(
          resumeData,
          jobTitle,
          company,
          managerName,
          type,
          tone
        ),
      },
    ],
    temperature: 0.7,
    maxTokens: 500,
  });
}

export async function regenerateWithFeedback(
  apiKey: string,
  model: OpenAIModel,
  original: string,
  feedback: string,
  contentType: string
): Promise<string> {
  return generateCompletion(apiKey, {
    model,
    messages: [
      { role: "system", content: PROMPTS.regenerate_with_feedback.system },
      {
        role: "user",
        content: PROMPTS.regenerate_with_feedback.user(
          original,
          feedback,
          contentType
        ),
      },
    ],
    temperature: 0.7,
    maxTokens: 800,
  });
}

export async function parseResumeWithAI(
  apiKey: string,
  model: OpenAIModel,
  text: string
): Promise<ResumeProfile> {
  const truncatedText = text.substring(0, 50000);

  const content = await generateCompletion(apiKey, {
    model,
    messages: [
      { role: "system", content: PROMPTS.resume_parsing.system },
      {
        role: "user",
        content: PROMPTS.resume_parsing.user(truncatedText),
      },
    ],
    temperature: 0.2,
    responseFormat: { type: "json_object" },
  });

  return JSON.parse(content);
}

/**
 * Build a text summary of a resume profile for use in AI prompts
 */
export function constructResumeSummary(profile: ResumeProfile): string {
  return [
    profile.summary ? `Summary: ${profile.summary}` : "",
    profile.personal_info
      ? `Contact: ${profile.personal_info.name} | ${profile.personal_info.email || ""} | ${profile.personal_info.linkedin || ""}`
      : "",
    profile.skills?.length ? `Skills: ${profile.skills.join(", ")}` : "",
    profile.experience
      ?.map(
        (e) =>
          `Role: ${e.title} at ${e.company} (${e.dates || "N/A"})\nDetails: ${e.description}`
      )
      .join("\n\n") || "",
    profile.projects
      ?.map(
        (p) =>
          `Project: ${p.name} (${p.technologies || ""})\nDetails: ${p.description}`
      )
      .join("\n\n") || "",
    profile.education
      ?.map(
        (e) => `Education: ${e.degree} at ${e.school} (${e.dates || ""})`
      )
      .join("\n") || "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Strip HTML tags and common artifacts from text
 */
export function stripHTML(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
