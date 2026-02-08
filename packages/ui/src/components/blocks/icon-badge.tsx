import React from "react"
import { cn } from "@/lib/utils"

type IconBadgeVariant = "primary" | "ai" | "success" | "warning" | "destructive" | "muted"
type IconBadgeSize = "sm" | "md" | "lg"

export interface IconBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: React.ReactNode
    variant?: IconBadgeVariant
    size?: IconBadgeSize
}

const variantStyles: Record<IconBadgeVariant, string> = {
    primary: "bg-primary/15 text-primary",
    ai: "bg-ai-accent/15 text-ai-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/15 text-destructive",
    muted: "bg-muted text-muted-foreground",
}

const sizeStyles: Record<IconBadgeSize, { container: string; icon: string }> = {
    sm: { container: "size-6", icon: "[&>svg]:size-3.5" },
    md: { container: "size-8", icon: "[&>svg]:size-4" },
    lg: { container: "size-10", icon: "[&>svg]:size-5" },
}

/**
 * A colored circular badge containing an icon.
 * Used across headers, feature lists, and status indicators.
 */
export function IconBadge({
    icon,
    variant = "primary",
    size = "md",
    className,
    ...props
}: IconBadgeProps) {
    const sizes = sizeStyles[size]

    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center rounded-full",
                variantStyles[variant],
                sizes.container,
                sizes.icon,
                className
            )}
            {...props}
        >
            {icon}
        </div>
    )
}
