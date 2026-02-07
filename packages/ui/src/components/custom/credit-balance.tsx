import React from "react"
import { Battery, Zap, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface CreditBalanceProps extends React.HTMLAttributes<HTMLDivElement> {
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

    // Determine color based on usage
    let progressColorClass = "bg-primary"
    if (percentage <= 20) progressColorClass = "bg-red-500"
    else if (percentage <= 50) progressColorClass = "bg-yellow-500"

    return (
        <Card className={cn("w-full overflow-hidden dark:bg-card", className)} {...props}>
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
                    <Progress value={percentage} className="h-2" />
                    <p className="mt-1 text-xs text-muted-foreground text-right">
                        {Math.round(percentage)}% remaining
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
