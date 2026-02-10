import { useState, useCallback } from "react";
import { CoachTab as UICoachTab } from "@jobswyft/ui";
// We need to import the Message type. Since it's not exported as CoachMessage anymore, 
// we might need to check what is exported from @jobswyft/ui regarding coach types
// or redefine if necessary, but ideally we use the exported one.
// The UI build just succeeded, so types should be available.
// However, the UI package exports `Coach` and `CoachTab`. 
// Let's check if `Message` type is exported from index.ts. 
// It wasn't explicitly exported in my previous `index.ts` edit.
// But `Coach` component export might carry it if it's in the signature.
// Let's look at `index.ts` of UI again or just assume it's compatible.
// Actually, I should probably just import `CoachTab` and pass props.

import type { UseOpenAIReturn } from "@/hooks/use-openai";
import { generateCompletion } from "@/services/openai";

// Define locally if not exported, or use `any` temporarily if types are hard to reach without direct export
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CoachTabProps {
  isLocked: boolean;
  openai: UseOpenAIReturn;
}

export function CoachTab({ isLocked, openai }: CoachTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your career coach. Ask me anything about job applications, interview prep, resume tips, or career strategy.",
      timestamp: new Date(),
    },
  ]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!openai.hasKey) return;

      // Add user message
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // Get profile context
        const result = await chrome.storage.local.get(["job_jet_profile"]);
        const profile = result.job_jet_profile;
        const profileContext = profile
          ? `The user has a resume on file. Their background: ${profile.summary || "N/A"}. Skills: ${(profile.skills || []).join(", ")}.`
          : "The user has not uploaded a resume yet.";

        const response = await generateCompletion(openai.apiKey, {
          model: openai.model,
          messages: [
            {
              role: "system",
              content: `You are a helpful, encouraging career coach embedded in a job application assistant Chrome extension called JobSwyft. You help with resume advice, interview preparation, job search strategy, and career guidance. Be concise but thorough. ${profileContext}`,
            },
            ...messages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
            { role: "user", content },
          ],
          temperature: 0.7,
          maxTokens: 500,
        });

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [openai.apiKey, openai.model, openai.hasKey, messages]
  );

  return (
    <UICoachTab
      isLocked={isLocked}
      hasKey={openai.hasKey}
      messages={messages}
      onSendMessage={handleSend}
    />
  );
}
