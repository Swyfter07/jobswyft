import { useState, useRef, useEffect, useCallback } from "react";
import { useSidebarStore } from "../stores/sidebar-store";
import { useScanStore } from "../stores/scan-store";
import { useAuthStore } from "../stores/auth-store";
import { useResumeStore } from "../stores/resume-store";
import { useCreditsStore } from "../stores/credits-store";
import { useToast } from "./toast-context";
import { apiClient, type ChatMessage } from "../lib/api-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function CoachTab() {
  const { toast } = useToast();
  const token = useAuthStore((s) => s.accessToken);
  const jobData = useScanStore((s) => s.jobData);
  const activeResumeData = useResumeStore((s) => s.activeResumeData);
  const { aiStudioOutputs } = useSidebarStore();
  const fetchCredits = useCreditsStore((s) => s.fetchCredits);

  const [messages, setMessages] = useState<Message[]>(() => {
    // Restore from sidebar store chatHistory
    return (aiStudioOutputs.chatHistory || []).map((m, i) => ({
      id: `restored-${i}`,
      role: m.role,
      content: m.content,
      timestamp: Date.now() - (aiStudioOutputs.chatHistory.length - i) * 1000,
    }));
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLocked = !jobData?.title;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    if (!token || !input.trim() || isTyping) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Build context
    const jobContext = jobData
      ? { title: jobData.title, company: jobData.company, description: jobData.description?.slice(0, 2000) }
      : undefined;

    const resumeContext = activeResumeData
      ? [
          activeResumeData.personalInfo?.fullName,
          activeResumeData.skills?.slice(0, 15).join(", "),
          activeResumeData.experience
            ?.slice(0, 3)
            .map((e: { title: string; company: string }) => `${e.title} at ${e.company}`)
            .join("; "),
        ]
          .filter(Boolean)
          .join(" | ")
      : undefined;

    // Build history (last 10 messages)
    const history: ChatMessage[] = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const result = await apiClient.sendCoachMessage(
        token,
        userMessage.content,
        jobContext,
        resumeContext,
        history
      );

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (token) fetchCredits(token);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to get response";
      if (errMsg.includes("CREDIT_EXHAUSTED")) {
        toast({ title: "No credits remaining", variant: "error" });
      }
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${errMsg}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [token, input, isTyping, jobData, activeResumeData, messages, toast, fetchCredits]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLocked) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Scan a job to unlock Coach</p>
          <p className="text-xs text-muted-foreground">
            The career coach uses your job context to give personalized advice.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8">
            Ask your career coach anything about this job, interview prep, or your application strategy.
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your career coach..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-10 max-h-24"
            maxLength={5000}
            disabled={isTyping}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
