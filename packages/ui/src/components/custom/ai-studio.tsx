import React from "react"
import {
    Lock,
    Wand2,
    FileText,
    MessageSquare,
    Send,
    RotateCcw,
    Sparkles,
    Split,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectionChips } from "@/components/blocks/selection-chips"
import { MatchIndicator } from "@/components/blocks/match-indicator"
import { SkillPill, SkillSectionLabel } from "@/components/blocks/skill-pill"
import { IconBadge } from "@/components/blocks/icon-badge"

// ─── Types ──────────────────────────────────────────────────────────────

export interface AIStudioMatchData {
    score: number
    matchedSkills: string[]
    missingSkills: string[]
}

export interface AIStudioProps {
    isLocked?: boolean
    isGenerating?: boolean
    generatingLabel?: string
    className?: string
    creditBalance?: number
    defaultTab?: string
    activeTab?: string
    onTabChange?: (tab: string) => void
    onUnlock?: () => void
    onGenerate?: (params: {
        tab: string
        tone: string
        length: string
        customInstructions?: string
        question?: string
        recipientRole?: string
        platform?: string
    }) => void
    onReset?: () => void
    matchData?: AIStudioMatchData
}

// ─── Shared options ─────────────────────────────────────────────────────

const TONE_OPTIONS = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "confident", label: "Confident" },
    { value: "friendly", label: "Friendly" },
]

const LENGTH_OPTIONS = [
    { value: "short", label: "Short" },
    { value: "medium", label: "Medium" },
    { value: "long", label: "Long" },
]

const PLATFORM_OPTIONS = [
    { value: "linkedin", label: "LinkedIn" },
    { value: "email", label: "Email" },
]

const DEFAULT_MATCH: AIStudioMatchData = {
    score: 85,
    matchedSkills: ["React", "TypeScript", "Tailwind"],
    missingSkills: ["GraphQL", "AWS"],
}

// ─── Tab Content Components ─────────────────────────────────────────────

function MatchTab({ matchData }: { matchData: AIStudioMatchData }) {
    return (
        <div className="space-y-4">
            <MatchIndicator score={matchData.score} />

            <div className="space-y-2">
                <SkillSectionLabel label="Strengths" variant="success" />
                <div className="flex flex-wrap gap-2">
                    {matchData.matchedSkills.map(skill => (
                        <SkillPill key={skill} name={skill} variant="matched" />
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <SkillSectionLabel label="Gaps" variant="warning" />
                <div className="flex flex-wrap gap-2">
                    {matchData.missingSkills.map(skill => (
                        <SkillPill key={skill} name={skill} variant="missing" />
                    ))}
                </div>
            </div>
        </div>
    )
}

function GeneratingState({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="flex items-center gap-2 text-primary">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-primary animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">This may take a few seconds...</p>
        </div>
    )
}

function GenerateButton({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode
    label: string
    onClick?: () => void
}) {
    return (
        <Button className="w-full font-semibold shadow-sm" onClick={onClick}>
            {icon}
            {label}
        </Button>
    )
}

function CoverLetterTab({
    tone,
    length,
    onToneChange,
    onLengthChange,
    isGenerating,
    generatingLabel,
    onGenerate,
}: {
    tone: string
    length: string
    onToneChange: (v: string) => void
    onLengthChange: (v: string) => void
    isGenerating: boolean
    generatingLabel: string
    onGenerate?: () => void
}) {
    return (
        <div className="space-y-4">
            <SelectionChips label="Tone" options={TONE_OPTIONS} value={tone} onChange={onToneChange} />
            <SelectionChips label="Length" options={LENGTH_OPTIONS} value={length} onChange={onLengthChange} />

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Custom Instructions</label>
                <Textarea
                    className="min-h-[60px]"
                    placeholder="e.g. Highlight my leadership experience..."
                />
            </div>

            {isGenerating ? (
                <GeneratingState label={generatingLabel} />
            ) : (
                <GenerateButton
                    icon={<Wand2 className="mr-2 size-3.5" />}
                    label="Generate Draft (1 Credit)"
                    onClick={onGenerate}
                />
            )}
        </div>
    )
}

function ChatTab({
    tone,
    length,
    onToneChange,
    onLengthChange,
    isGenerating,
    generatingLabel,
    onGenerate,
}: {
    tone: string
    length: string
    onToneChange: (v: string) => void
    onLengthChange: (v: string) => void
    isGenerating: boolean
    generatingLabel: string
    onGenerate?: () => void
}) {
    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Application Question</label>
                <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Textarea
                        className="min-h-[80px] pl-9"
                        placeholder="Paste the question here..."
                    />
                </div>
            </div>

            <SelectionChips label="Tone" options={TONE_OPTIONS} value={tone} onChange={onToneChange} />
            <SelectionChips label="Length" options={LENGTH_OPTIONS} value={length} onChange={onLengthChange} />

            {isGenerating ? (
                <GeneratingState label={generatingLabel} />
            ) : (
                <GenerateButton
                    icon={<Split className="mr-2 size-3.5" />}
                    label="Generate Answer (1 Credit)"
                    onClick={onGenerate}
                />
            )}
        </div>
    )
}

function OutreachTab({
    tone,
    length,
    platform,
    onToneChange,
    onLengthChange,
    onPlatformChange,
    isGenerating,
    generatingLabel,
    onGenerate,
}: {
    tone: string
    length: string
    platform: string
    onToneChange: (v: string) => void
    onLengthChange: (v: string) => void
    onPlatformChange: (v: string) => void
    isGenerating: boolean
    generatingLabel: string
    onGenerate?: () => void
}) {
    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Recipient Role</label>
                <Input className="h-9" placeholder="e.g. Hiring Manager" />
            </div>

            <SelectionChips label="Platform" options={PLATFORM_OPTIONS} value={platform} onChange={onPlatformChange} />
            <SelectionChips label="Tone" options={TONE_OPTIONS} value={tone} onChange={onToneChange} />
            <SelectionChips label="Length" options={LENGTH_OPTIONS} value={length} onChange={onLengthChange} />

            {isGenerating ? (
                <GeneratingState label={generatingLabel} />
            ) : (
                <GenerateButton
                    icon={<Send className="mr-2 size-3.5" />}
                    label="Draft Message (1 Credit)"
                    onClick={onGenerate}
                />
            )}
        </div>
    )
}

// ─── Main Component ─────────────────────────────────────────────────────

export function AIStudio({
    isLocked = true,
    isGenerating = false,
    generatingLabel = "Generating...",
    className,
    creditBalance = 5,
    defaultTab = "match",
    activeTab,
    onTabChange,
    onUnlock,
    onGenerate,
    onReset,
    matchData = DEFAULT_MATCH,
}: AIStudioProps) {
    const [tone, setTone] = React.useState("professional")
    const [length, setLength] = React.useState("medium")
    const [platform, setPlatform] = React.useState("linkedin")

    const [internalTab, setInternalTab] = React.useState(defaultTab)
    const currentTab = activeTab ?? internalTab
    const handleTabChange = (val: string) => {
        setInternalTab(val)
        onTabChange?.(val)
    }

    const triggerClass = "flex-1 flex gap-1.5 items-center justify-center text-xs data-[state=active]:border-2 data-[state=active]:border-card-accent-border"

    return (
        <Card className={cn("w-full overflow-hidden border-2 border-card-accent-border transition-all duration-300", className)}>
            <CardHeader className="border-b px-4 py-3 space-y-0 flex flex-row items-center justify-between bg-gradient-to-r from-card-accent-bg to-transparent">
                <div className="flex items-center gap-2">
                    <IconBadge icon={<Wand2 />} variant="ai" size="sm" />
                    <CardTitle className="text-base font-bold text-foreground">
                        AI Studio
                    </CardTitle>
                    {!isLocked && (
                        <Badge
                            variant="secondary"
                            className="ml-2 h-5 px-1.5 text-micro font-normal text-muted-foreground"
                        >
                            Powered by Gemini
                        </Badge>
                    )}
                </div>
                {!isLocked && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        title="Reset All"
                        aria-label="Reset All"
                        onClick={() => onReset?.()}
                    >
                        <RotateCcw className="size-3.5" />
                    </Button>
                )}
            </CardHeader>

            <CardContent className="p-0">
                <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                    <div className="shrink-0 px-4 py-3">
                        <TabsList className="flex w-full items-center gap-1 rounded-lg bg-secondary/50 p-1 text-muted-foreground h-auto">
                            <TabsTrigger value="match" className={triggerClass}>
                                <Sparkles className="size-3.5" />
                                <span>Match</span>
                            </TabsTrigger>
                            <TabsTrigger value="cover-letter" className={triggerClass}>
                                <FileText className="size-3.5" />
                                <span>Cover</span>
                            </TabsTrigger>
                            <TabsTrigger value="outreach" className={triggerClass}>
                                <Send className="size-3.5" />
                                <span>Outreach</span>
                            </TabsTrigger>
                            <TabsTrigger value="chat" className={triggerClass}>
                                <MessageSquare className="size-3.5" />
                                <span>Chat</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="relative h-[360px]">
                        {isLocked && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background p-6 text-center">
                                <div className="rounded-full bg-muted p-3 mb-3">
                                    <Lock className="size-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground mb-1">
                                    AI Studio Locked
                                </h3>
                                <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                                    Scan a job post to unlock tailored AI tools.
                                </p>
                                <Button size="sm" className="shadow-sm" onClick={onUnlock}>
                                    <Sparkles className="mr-2 size-3.5" />
                                    Scan Job to Unlock
                                </Button>
                            </div>
                        )}

                        <ScrollArea className={cn("h-[360px]", isLocked && "opacity-20 pointer-events-none")}>
                            <div className="p-4 space-y-4">
                                <TabsContent value="match" className="mt-0">
                                    <MatchTab matchData={matchData} />
                                </TabsContent>

                                <TabsContent value="cover-letter" className="mt-0">
                                    <CoverLetterTab
                                        tone={tone}
                                        length={length}
                                        onToneChange={setTone}
                                        onLengthChange={setLength}
                                        isGenerating={isGenerating}
                                        generatingLabel={generatingLabel}
                                        onGenerate={() => onGenerate?.({ tab: "cover-letter", tone, length })}
                                    />
                                </TabsContent>

                                <TabsContent value="outreach" className="mt-0">
                                    <OutreachTab
                                        tone={tone}
                                        length={length}
                                        platform={platform}
                                        onToneChange={setTone}
                                        onLengthChange={setLength}
                                        onPlatformChange={setPlatform}
                                        isGenerating={isGenerating}
                                        generatingLabel={generatingLabel}
                                        onGenerate={() => onGenerate?.({ tab: "outreach", tone, length, platform })}
                                    />
                                </TabsContent>

                                <TabsContent value="chat" className="mt-0">
                                    <ChatTab
                                        tone={tone}
                                        length={length}
                                        onToneChange={setTone}
                                        onLengthChange={setLength}
                                        isGenerating={isGenerating}
                                        generatingLabel={generatingLabel}
                                        onGenerate={() => onGenerate?.({ tab: "chat", tone, length })}
                                    />
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    )
}
