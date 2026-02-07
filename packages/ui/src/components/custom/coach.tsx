import React, { useState, useRef, useEffect } from "react"
import { Bot, Send, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

export interface CoachProps {
    className?: string
    initialMessages?: Message[]
    onSendMessage?: (message: string) => void
    isLocked?: boolean
}

export function Coach({
    className,
    initialMessages = [],
    onSendMessage,
    isLocked = false,
}: CoachProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [inputValue, setInputValue] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = () => {
        if (!inputValue.trim()) return

        const newMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue,
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, newMessage])
        setInputValue("")
        onSendMessage?.(inputValue)

        // Mock AI response for demo purposes if not provided
        if (!onSendMessage) {
            setTimeout(() => {
                const aiResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "I'm a simulated AI coach. In the real app, I'll connect to the backend to answer your questions!",
                    timestamp: new Date(),
                }
                setMessages((prev) => [...prev, aiResponse])
            }, 1000)
        }
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
                            <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground space-y-2 opacity-80">
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
                            disabled={isLocked}
                            className="flex-1 min-h-[40px] border-border focus-visible:ring-ring"
                            autoComplete="off"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!inputValue.trim() || isLocked}
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
