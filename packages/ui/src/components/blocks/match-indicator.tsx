import React from "react"
import { cn } from "@/lib/utils"

export interface MatchIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
    score: number
    showLabel?: boolean
}

function getScoreConfig(score: number) {
    if (score >= 80) {
        return {
            color: "text-success",
            ring: "from-success/30 via-success/15 to-success/30",
            bg: "from-success/5 to-success/10",
            label: "Strong fit!",
        }
    }
    if (score >= 50) {
        return {
            color: "text-warning",
            ring: "from-warning/30 via-warning/15 to-warning/30",
            bg: "from-warning/5 to-warning/10",
            label: "Good potential",
        }
    }
    return {
        color: "text-destructive",
        ring: "from-destructive/30 via-destructive/15 to-destructive/30",
        bg: "from-destructive/5 to-destructive/10",
        label: "May need upskilling",
    }
}

/**
 * A circular match score indicator with color-coded thresholds.
 * Green >= 80, Yellow 50-79, Red < 50.
 */
export function MatchIndicator({
    score,
    showLabel = true,
    className,
    ...props
}: MatchIndicatorProps) {
    const config = getScoreConfig(score)

    return (
        <div className={cn("flex items-center gap-3", className)} {...props}>
            {/* Outer gradient ring */}
            <div className={cn("p-1 rounded-full bg-gradient-to-br shadow-lg", config.ring)}>
                {/* Inner score circle */}
                <div className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-full font-bold text-lg bg-gradient-to-br shadow-inner",
                    config.color,
                    config.bg
                )}>
                    {score}%
                </div>
            </div>
            {showLabel && (
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">Match Score</span>
                    <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
            )}
        </div>
    )
}
