import React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type SkillPillVariant = "matched" | "missing" | "neutral"

export interface SkillPillProps {
    name: string
    variant?: SkillPillVariant
    className?: string
}

const variantStyles: Record<SkillPillVariant, string> = {
    matched: "bg-success/10 text-success border-success/20 hover:bg-success/15",
    missing: "text-muted-foreground border-dashed",
    neutral: "",
}

/**
 * A skill badge with semantic coloring for match analysis.
 * - matched: green — skill the user has
 * - missing: dashed outline — skill gap
 * - neutral: default badge styling
 */
export function SkillPill({ name, variant = "neutral", className }: SkillPillProps) {
    return (
        <Badge
            variant={variant === "missing" ? "outline" : "secondary"}
            className={cn(variantStyles[variant], className)}
        >
            {name}
        </Badge>
    )
}

// ─── Skill Section Label ─────────────────────────────────────────────

type SkillSectionVariant = "success" | "warning"

export interface SkillSectionLabelProps {
    label: string
    variant: SkillSectionVariant
    className?: string
}

const sectionVariantStyles: Record<SkillSectionVariant, { text: string; dot: string }> = {
    success: { text: "text-success", dot: "bg-success" },
    warning: { text: "text-warning", dot: "bg-warning" },
}

/**
 * Label for a skill section with colored dot indicator.
 * Used in both JobCard and AIStudio MatchTab.
 */
export function SkillSectionLabel({ label, variant, className }: SkillSectionLabelProps) {
    const styles = sectionVariantStyles[variant]
    return (
        <span className={cn("text-xs font-medium uppercase tracking-wide flex items-center gap-1", styles.text, className)}>
            <span className={cn("size-1.5 rounded-full", styles.dot)} />
            {label}
        </span>
    )
}
