import React from "react"
import { Wand2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface EmptyJobStateProps {
    title?: string
    description?: string
    supportedSites?: string[]
}

export function EmptyJobState({
    title = "Waiting for Job Post",
    description = "Navigate to a job posting on LinkedIn or Indeed to activate JobSwyft.",
    supportedSites = ["LinkedIn", "Indeed", "Glassdoor"]
}: EmptyJobStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 p-6">
            <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-violet-400/20 duration-3000" />
                <div className="relative flex items-center justify-center size-20 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800 shadow-lg">
                    <Wand2 className="size-8 text-violet-600 dark:text-violet-400" />
                </div>
            </div>
            <div className="space-y-2 max-w-[240px]">
                <h3 className="font-bold text-lg text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed text-center px-4">
                    {description}
                </p>
            </div>
            <div className="flex gap-2">
                {supportedSites.map((site) => (
                    <Badge
                        key={site}
                        variant="outline"
                        className="text-[10px] text-muted-foreground bg-muted/50 font-normal"
                    >
                        {site}
                    </Badge>
                ))}
            </div>
        </div>
    )
}
