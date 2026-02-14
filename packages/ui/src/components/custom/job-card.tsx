import React, { useEffect } from "react"
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
import { MatchIndicator } from "@/components/blocks/match-indicator"
import { SkillPill, SkillSectionLabel } from "@/components/blocks/skill-pill"
import { IconBadge } from "@/components/blocks/icon-badge"

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

// ─── Main Component ─────────────────────────────────────────────────────────

export function JobCard({
    job,
    match,
    onCoach,
    onDiveDeeper,
    className,
    isEditing: initialIsEditing = false,
    onAnalyze,
    ...props
}: JobCardProps) {
    const [isEditing, setIsEditing] = React.useState(initialIsEditing)
    const [title, setTitle] = React.useState(job.title)
    const [company, setCompany] = React.useState(job.company)
    const [description, setDescription] = React.useState(job.description)

    useEffect(() => {
        if (!isEditing) {
            setTitle(job.title)
            setCompany(job.company)
            setDescription(job.description ?? "")
        }
    }, [job.title, job.company, job.description, isEditing])

    return (
        <Card className={cn("w-full overflow-hidden border-2 border-card-accent-border", className)} {...props}>
            <CardHeader className="space-y-3 bg-card-accent-bg">
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
                        aria-label={isEditing ? "Cancel editing" : "Edit job details"}
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
                            className="w-full font-semibold shadow-md mt-4"
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
                                    <IconBadge icon={<Brain />} variant="ai" size="sm" />
                                    <span>Analysis</span>
                                </div>

                                {match.summary && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {match.summary}
                                    </p>
                                )}

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <SkillSectionLabel label="Your Matches" variant="success" />
                                        <div className="flex flex-wrap gap-2">
                                            {match.matchedSkills.length > 0 ? (
                                                match.matchedSkills.map(skill => <SkillPill key={skill} name={skill} variant="matched" />)
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No direct matches found</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <SkillSectionLabel label="Missing Skills" variant="warning" />
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
                                onClick={onDiveDeeper}
                                className="flex-1 bg-ai-accent text-ai-accent-foreground hover:bg-ai-accent/90 font-semibold shadow-md"
                            >
                                <Sparkles className="mr-2 size-4" />
                                Dive Deeper
                            </Button>
                            <Button onClick={onCoach} className="flex-1 font-semibold shadow-md">
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
