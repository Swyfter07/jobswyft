import React from "react"
import { Zap, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export interface CreditBalanceProps extends React.HTMLAttributes<HTMLDivElement> {
    total: number
    used: number
    onBuyMore?: () => void
}

export function CreditBalance({
    total,
    used,
    onBuyMore,
    className,
    ...props
}: CreditBalanceProps) {
    const remaining = total - used
    const percentage = Math.min(100, Math.max(0, (remaining / total) * 100))

    const indicatorColor =
        percentage <= 20
            ? "bg-destructive"
            : percentage <= 50
              ? "bg-warning"
              : undefined

    const trackColor =
        percentage <= 20
            ? "bg-destructive/20"
            : percentage <= 50
              ? "bg-warning/20"
              : undefined

    return (
        <Card className={cn("w-full overflow-hidden border-2 border-card-accent-border", className)} {...props}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <Zap className="size-4 text-primary" />
                    <CardTitle className="text-sm font-medium">AI Credits</CardTitle>
                </div>
                <Button
                    onClick={onBuyMore}
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-primary"
                    title="Buy more credits"
                >
                    <Plus className="size-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold">{remaining}</span>
                    <span className="text-sm text-muted-foreground">/ {total}</span>
                </div>

                <div className="mt-2">
                    <Progress
                        value={percentage}
                        className={cn("h-2", trackColor)}
                        indicatorClassName={indicatorColor}
                    />
                    <p className="mt-1 text-xs text-muted-foreground text-right">
                        {Math.round(percentage)}% remaining
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
