
import React, { useState, useRef, useEffect } from "react"
import { Bot, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JobData } from "./job-card"
// import { ResumeData } from "~/lib/hooks/use-resumes"

export interface ResumeData {
    id: string
    fileName: string
    personalInfo: any
    skills: string[]
    experience: any[]
    education: any[]
    projects?: any[]
}

export interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

export interface CoachProps {
    className?: string
    messages?: Message[]
    onSendMessage?: (message: string) => void
    isLocked?: boolean
    isTyping?: boolean
    job?: JobData | null
    resume?: ResumeData | null
}

export function Coach({
    className,
    messages = [],
    onSendMessage,
    isLocked = false,
    isTyping = false,
    job,
    resume
}: CoachProps) {
    const [inputValue, setInputValue] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isTyping])

    const handleSend = () => {
        if (!inputValue.trim() || isTyping) return

        onSendMessage?.(inputValue)
        setInputValue("")
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <Card className={cn("flex flex-col h-full overflow-hidden dark:bg-card p-0 gap-0 shadow-xl", className)}>
            <CardHeader className="border-b px-4 py-3 bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-8 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                        <Bot className="size-4" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold text-foreground">
                            Career Coach
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground">
                            Ask me anything about this job
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
                {/* Locked State Overlay */}
                {isLocked && (
                    <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="text-center p-6">
                            <Bot className="size-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-medium text-foreground">Coach is locked</p>
                            <p className="text-xs text-muted-foreground">Scan a job to start chatting.</p>
                        </div>
                    </div>
                )}

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-2 opacity-80">
                                <Bot className="size-8 mb-2 opacity-50" />
                                <p className="text-sm font-medium">No messages yet</p>
                                <p className="text-xs max-w-[200px]">
                                    I can help you analyze the job description, suggest interview questions, or improve your resume.
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                        msg.role === "user"
                                            ? "self-end bg-orange-600 text-white rounded-tr-sm dark:bg-orange-600"
                                            : "self-start bg-muted text-foreground rounded-tl-sm border border-border"
                                    )}
                                >
                                    <p className="leading-snug whitespace-pre-wrap break-words">{msg.content}</p>
                                    <span className={cn(
                                        "text-[9px] opacity-70",
                                        msg.role === "user" ? "text-white" : "text-muted-foreground"
                                    )}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                        {isTyping && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground self-start pl-2">
                                <Loader2 className="size-3 animate-spin" />
                                <span>Coach is typing...</span>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-3 border-t bg-background mt-auto">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSend()
                        }}
                        className="flex items-center gap-2"
                    >
                        <Input
                            placeholder={isLocked ? "Locked..." : "Ask a question..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isLocked || isTyping}
                            className="flex-1 min-h-[40px] border-border focus-visible:ring-ring"
                            autoComplete="off"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!inputValue.trim() || isLocked || isTyping}
                            className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 hover:from-orange-700 hover:via-orange-600 hover:to-orange-500 text-white shadow-sm shrink-0 border-t border-white/20 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-300"
                        >
                            <Send className="size-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    )
}
