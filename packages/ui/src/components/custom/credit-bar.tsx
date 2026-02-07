"use client"

import React from "react"
import { Zap, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface CreditBarProps extends React.HTMLAttributes<HTMLDivElement> {
    credits: number
    maxCredits?: number
    onBuyMore?: () => void
}

/**
 * A compact credit bar for displaying AI credits at the bottom of the sidebar.
 * Shows current credits and a buy more button.
 */
export function CreditBar({
    credits,
    maxCredits = 10,
    onBuyMore,
    className,
    ...props
}: CreditBarProps) {
    const percentage = Math.min(100, Math.max(0, (credits / maxCredits) * 100))
    const isLow = percentage <= 20

    return (
        <div
            className={cn(
                "flex items-center justify-between px-4 py-2.5 border-t bg-background/95 backdrop-blur-sm",
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-2">
                <div className={cn(
                    "flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md",
                    isLow && "from-red-400 to-red-600"
                )}>
                    <Zap className="size-4 text-white fill-white/20" />
                </div>
                <div className="flex items-baseline gap-1">
                    <span className={cn(
                        "text-sm font-bold",
                        isLow && "text-red-600 dark:text-red-400"
                    )}>
                        {credits}
                    </span>
                    <span className="text-xs text-muted-foreground">credits</span>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                onClick={onBuyMore}
            >
                <Plus className="size-3" />
                Buy more
            </Button>
        </div>
    )
}
