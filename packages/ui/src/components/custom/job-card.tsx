import React from "react"
import { Building, MapPin, Clock, Brain, Sparkles, Pencil, X } from "lucide-react"
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

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface JobData {
    title: string
    company: string
    location: string
    salary?: string
    postedAt?: string
    description?: string
    logo?: string
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
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function MatchIndicator({ score }: { score: number }) {
    let colorClass = "text-red-600 dark:text-red-400"
    let ringGradient = "from-red-200 via-red-100 to-red-200 dark:from-red-800 dark:via-red-900 dark:to-red-800"
    let bgGradient = "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"

    if (score >= 80) {
        colorClass = "text-green-600 dark:text-green-400"
        ringGradient = "from-green-200 via-green-100 to-green-200 dark:from-green-800 dark:via-green-900 dark:to-green-800"
        bgGradient = "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
    } else if (score >= 50) {
        colorClass = "text-yellow-600 dark:text-yellow-400"
        ringGradient = "from-yellow-200 via-yellow-100 to-yellow-200 dark:from-yellow-800 dark:via-yellow-900 dark:to-yellow-800"
        bgGradient = "from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900"
    }

    return (
        <div className="flex items-center gap-3 animate-tab-content">
            {/* Outer gradient ring */}
            <div className={cn("p-1 rounded-full bg-gradient-to-br shadow-lg", ringGradient)}>
                {/* Inner score circle */}
                <div className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-full font-bold text-lg bg-gradient-to-br shadow-inner",
                    colorClass,
                    bgGradient
                )}>
                    {score}%
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Match Score</span>
                <span className="text-xs text-muted-foreground">{score >= 80 ? "Strong fit!" : score >= 50 ? "Good potential" : "May need upskilling"}</span>
            </div>
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
    className,
    isEditing: initialIsEditing = false,
    onAnalyze,
    ...props
}: JobCardProps) {
    // Local state for edit mode
    const [isEditing, setIsEditing] = React.useState(initialIsEditing)
    const [title, setTitle] = React.useState(job.title)
    const [company, setCompany] = React.useState(job.company)
    const [description, setDescription] = React.useState(job.description)

    return (
        <Card className={cn("w-full overflow-hidden border-2 border-orange-200 dark:border-orange-900 dark:bg-card", className)} {...props}>
            <CardHeader className="space-y-3 bg-muted/20 dark:bg-muted/40">
                {/* Top Row: Header & Match */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        {/* Company Logo Placeholder */}
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                            {job.logo ? <img src={job.logo} alt={job.company} className="size-full rounded-lg object-cover" /> : <Building className="size-6" />}
                        </div>
                        <div className="space-y-1.5 w-full">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Job Title"
                                        className="text-lg font-bold h-9"
                                    />
                                    <Input
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder="Company Name"
                                        className="h-8 text-sm"
                                    />
                                </div>
                            ) : (
                                <>
                                    <CardTitle className="text-xl font-bold tracking-tight text-primary">{job.title}</CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="font-medium">{job.company}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {match && !isEditing && <MatchIndicator score={match.score} />}

                    {/* Edit Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? <X className="size-4" /> : <Pencil className="size-4" />}
                    </Button>
                </div>

                {/* Metadata Badges */}
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1 font-normal">
                        <MapPin className="size-3" /> {job.location}
                    </Badge>
                    {job.salary && (
                        <Badge variant="outline" className="gap-1 font-normal">
                            <span className="font-semibold text-primary">$</span> {job.salary}
                        </Badge>
                    )}
                    {job.postedAt && (
                        <Badge variant="secondary" className="gap-1 font-normal text-muted-foreground">
                            <Clock className="size-3" /> {job.postedAt}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="space-y-4 pt-3">
                {isEditing ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Sparkles className="size-4 text-primary" />
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
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md mt-4"
                        >
                            <Sparkles className="mr-2 size-4" />
                            Analyze Job
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Match Details */}
                        {match && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Brain className="size-4 text-purple-500" />
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
                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                onClick={props.onDiveDeeper}
                                className="flex-1 bg-purple-600 text-white hover:bg-purple-700 font-semibold shadow-md dark:bg-purple-700 dark:hover:bg-purple-600"
                            >
                                <Sparkles className="mr-2 size-4" />
                                Dive Deeper
                            </Button>
                            <Button onClick={onCoach} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md">
                                <Brain className="mr-2 size-4" />
                                Talk to Coach
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
