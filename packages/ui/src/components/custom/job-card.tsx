import React from "react"
import { cn } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Building, MapPin, Clock, Brain, Sparkles, Pencil, X, ChevronDown, Bookmark } from "lucide-react"

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface JobData {
    id?: string
    title: string
    company: string
    location: string
    salary?: string
    postedAt?: string
    description?: string
    logo?: string
    type?: string
    workspaceType?: string
    url?: string
    status?: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected'
}

export interface MatchData {
    score: number // 0-100
    matchedSkills: string[]
    missingSkills: string[]
    summary?: string
}

interface JobCardProps extends React.HTMLAttributes<HTMLDivElement> {
    job: JobData
    match?: MatchData
    onCoach?: () => void
    onDiveDeeper?: () => void
    isEditing?: boolean
    onAnalyze?: (data: Partial<JobData>) => void
    onSave?: () => void
    isSaved?: boolean
    isScanning?: boolean
    onScan?: () => void
    isAnalyzing?: boolean
    isAutoScanEnabled?: boolean
    onToggleAutoScan?: () => void
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function MatchIndicator({ score, isLoading }: { score?: number, isLoading?: boolean }) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-1.5 animate-tab-content min-w-[60px]">
                {/* Loading state ring */}
                <div className="p-1 rounded-full bg-muted/20 shadow-lg">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted/10 shadow-inner">
                        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight leading-none text-center whitespace-nowrap animate-pulse">
                    Analyzing
                </span>
            </div>
        )
    }

    const safeScore = score ?? 0
    let colorClass = "text-red-600 dark:text-red-400"
    let ringGradient = "from-red-200 via-red-100 to-red-200 dark:from-red-800 dark:via-red-900 dark:to-red-800"
    let bgGradient = "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"

    if (safeScore >= 80) {
        colorClass = "text-green-600 dark:text-green-400"
        ringGradient = "from-green-200 via-green-100 to-green-200 dark:from-green-800 dark:via-green-900 dark:to-green-800"
        bgGradient = "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
    } else if (safeScore >= 50) {
        colorClass = "text-yellow-600 dark:text-yellow-400"
        ringGradient = "from-yellow-200 via-yellow-100 to-yellow-200 dark:from-yellow-800 dark:via-yellow-900 dark:to-yellow-800"
        bgGradient = "from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900"
    }

    return (
        <div className="flex flex-col items-center justify-center gap-1.5 animate-tab-content min-w-[60px]">
            {/* Outer gradient ring */}
            <div className={cn("p-1 rounded-full bg-gradient-to-br shadow-lg", ringGradient)}>
                {/* Inner score circle */}
                <div className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-full font-bold text-lg bg-gradient-to-br shadow-inner",
                    colorClass,
                    bgGradient
                )}>
                    {safeScore}%
                </div>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight leading-none text-center whitespace-nowrap">
                {safeScore >= 80 ? "Strong fit" : safeScore >= 50 ? "Good fit" : "Weak fit"}
            </span>
        </div>
    )
}

function SkillPill({ name, variant = "default" }: { name: string, variant?: "default" | "missing" }) {
    if (variant === "missing") {
        return <Badge variant="outline" className="text-muted-foreground border-dashed dark:border-muted">{name}</Badge>
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200 shadow-none dark:bg-green-950 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900">{name}</Badge>
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function JobCard({
    job,
    match,
    onCoach,
    onDiveDeeper,
    className,
    isEditing: initialIsEditing = false,
    onAnalyze,
    onSave,
    isSaved = false,
    isScanning = false,
    onScan,
    isAnalyzing = false,
    isAutoScanEnabled = true,
    onToggleAutoScan,
    ...props
}: JobCardProps) {
    // Local state for edit mode
    const [isEditing, setIsEditing] = React.useState(initialIsEditing)
    const [title, setTitle] = React.useState(job.title)
    const [company, setCompany] = React.useState(job.company)
    const [description, setDescription] = React.useState(job.description)
    const [showDescription, setShowDescription] = React.useState(false)

    // Sync props to state if job changes
    React.useEffect(() => {
        setTitle(job.title)
        setCompany(job.company)
        setDescription(job.description)
    }, [job])

    // Sync isEditing state with prop
    React.useEffect(() => {
        setIsEditing(initialIsEditing)
    }, [initialIsEditing])

    return (
        <Card className={cn("w-full overflow-hidden dark:bg-card p-0 gap-0 shadow-xl relative", className)} {...props}>
            {isScanning && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}
            <CardHeader className="border-b px-4 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 flex-shrink-0">
                {/* Top Row: Header & Match */}
                {/* Top Row: Header & Match */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 w-full">
                        {isEditing ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Job Title"
                                        className="text-lg font-bold h-9 flex-1"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                                <Input
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder="Company Name"
                                    className="h-8 text-sm"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
                                                {job.title}
                                            </CardTitle>
                                            <div className="flex items-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6 shrink-0 text-muted-foreground/50 hover:text-foreground"
                                                    onClick={() => setIsEditing(true)}
                                                    title="Edit Job Details"
                                                >
                                                    <Pencil className="size-3" />
                                                </Button>
                                                {onScan && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-6 shrink-0 text-muted-foreground/50 hover:text-foreground ml-1"
                                                        onClick={onScan}
                                                        title="Re-scan Job"
                                                        disabled={isScanning}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className={cn("lucide lucide-refresh-cw", isScanning && "animate-spin")}
                                                        >
                                                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                                            <path d="M21 3v5h-5" />
                                                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                                            <path d="M8 16H3v5" />
                                                        </svg>
                                                    </Button>
                                                )}
                                                {/* Auto-Scan Toggle */}
                                                {onToggleAutoScan && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "size-6 shrink-0 ml-1 transition-colors",
                                                            isAutoScanEnabled
                                                                ? "text-primary hover:text-primary/80"
                                                                : "text-muted-foreground/30 hover:text-muted-foreground"
                                                        )}
                                                        onClick={onToggleAutoScan}
                                                        title={isAutoScanEnabled ? "Auto-scan enabled" : "Auto-scan disabled"}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="lucide lucide-zap"
                                                        >
                                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                                        </svg>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="font-medium">{job.company}</span>
                                        </div>
                                    </div>
                                    {(match || isAnalyzing) && <MatchIndicator score={match?.score} isLoading={isAnalyzing} />}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Metadata Badges Removed */}

                {/* Description Toggle */}
                {!isEditing && job.description && (
                    <div
                        role="button"
                        onClick={() => setShowDescription(!showDescription)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-4 select-none w-fit group/toggle"
                    >
                        <ChevronDown className={cn("size-3.5 transition-transform duration-300 group-hover/toggle:text-foreground", showDescription && "rotate-180")} />
                        <span className="group-hover/toggle:underline decoration-border/50 underline-offset-4">{showDescription ? "Hide Job Description" : "Show Full Description"}</span>
                    </div>
                )}
            </CardHeader>

            <Separator />

            <CardContent className="p-4">
                {isEditing ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
                            <span>Paste Job Description</span>
                        </div>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Paste the full job description here..."
                            className="min-h-[200px] resize-none font-mono text-sm"
                        />
                        <Button
                            onClick={() => onAnalyze?.({ title, company, description })}
                            className="w-full bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 font-semibold shadow-md mt-4 border-t border-white/20 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300"
                        >
                            <Sparkles className="mr-2 size-4" />
                            Analyze Job
                        </Button>
                    </div>
                ) : (
                    <>
                        <Collapsible open={showDescription}>
                            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                <div className="space-y-3 pt-2">
                                    <Textarea
                                        value={description || ""}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="min-h-[300px] text-xs resize-y bg-background"
                                        placeholder="Paste or edit the job description..."
                                    />
                                    <Button
                                        onClick={() => onAnalyze?.({ title, company, description })}
                                        className="w-full bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 font-semibold shadow-md border-t border-white/20 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300"
                                        size="sm"
                                    >
                                        <Sparkles className="mr-2 size-3.5" />
                                        Update Analysis
                                    </Button>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        <Collapsible open={!showDescription}>
                            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                <div className="space-y-4 pt-2">
                                    {/* Match Details */}
                                    {isAnalyzing ? (
                                        <div className="space-y-4 animate-pulse">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                                    <div className="size-4 bg-muted rounded-full" />
                                                    <div className="h-4 w-24 bg-muted rounded" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-3 w-full bg-muted/60 rounded" />
                                                    <div className="h-3 w-3/4 bg-muted/60 rounded" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-3 w-20 bg-muted rounded" />
                                                <div className="flex gap-2">
                                                    <div className="h-5 w-16 bg-muted/40 rounded-full" />
                                                    <div className="h-5 w-20 bg-muted/40 rounded-full" />
                                                    <div className="h-5 w-14 bg-muted/40 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : match && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                <Brain className="size-4 text-blue-600 dark:text-blue-400" />
                                                <span>Analysis</span>
                                            </div>

                                            {match.summary && (
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {match.summary}
                                                </p>
                                            )}

                                            {/* Skills - Stacked Layout */}
                                            <div className="space-y-4 pt-2">
                                                {/* Matches */}
                                                <div className="space-y-2">
                                                    <span className="text-xs font-medium text-green-700 uppercase tracking-wide flex items-center gap-1">
                                                        <span className="size-1.5 rounded-full bg-green-500" />
                                                        Your Matches
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {match.matchedSkills.length > 0 ? (
                                                            match.matchedSkills.map(skill => <SkillPill key={skill} name={skill} />)
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">No direct matches found</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Gaps */}
                                                <div className="space-y-2">
                                                    <span className="text-xs font-medium text-amber-700 uppercase tracking-wide flex items-center gap-1">
                                                        <span className="size-1.5 rounded-full bg-amber-500" />
                                                        Missing Skills
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {match.missingSkills.length > 0 ? (
                                                            match.missingSkills.map(skill => <SkillPill key={skill} name={skill} variant="missing" />)
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">No major gaps detected</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2 pb-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={onSave}
                                            className={cn(
                                                "size-10 shrink-0 transition-colors duration-300 border-2",
                                                isSaved
                                                    ? "bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            )}
                                            title={isSaved ? "Saved" : "Save Job"}
                                        >
                                            <Bookmark className={cn("size-5", isSaved && "fill-current")} />
                                        </Button>

                                        <Button
                                            onClick={onDiveDeeper}
                                            className="flex-1 bg-gradient-to-br from-violet-600 via-violet-500 to-violet-400 text-white hover:from-violet-700 hover:via-violet-600 hover:to-violet-500 font-semibold shadow-md border-t border-white/20 hover:shadow-lg hover:shadow-violet-500/40 transition-all duration-300"
                                        >
                                            <Sparkles className="mr-2 size-4" />
                                            Dive Deeper
                                        </Button>

                                        <Button
                                            onClick={onCoach}
                                            className="flex-1 bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 text-white hover:from-orange-700 hover:via-orange-600 hover:to-orange-500 font-semibold shadow-md border-t border-white/20 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-300"
                                        >
                                            <Brain className="mr-2 size-4" />
                                            Talk to Coach
                                        </Button>
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
