
import {
    FileText,
    ChevronRight,
    Check,
    Copy
} from "lucide-react"

import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Card, CardContent } from "../ui/card"
import { Input } from "../ui/input"
import { cn } from "@/lib/utils"

// Types (Defining here for now, should move to shared types later)
export interface ResumeData {
    fileName: string
    lastUpdated: string
    personalInfo: {
        fullName: string
        email: string
        phone: string
        location: string
        linkedin: string
        website?: string
    }
    skills: string[]
    experience: {
        id: string
        title: string
        company: string
        startDate: string
        endDate: string
        highlights: string[]
    }[]
    education?: any[]
}

interface ResumeOverviewCardProps {
    resume: ResumeData
    onOpen: () => void
    className?: string
}

export const ResumeOverviewCard = ({
    resume,
    onOpen,
    className
}: ResumeOverviewCardProps) => {
    return (
        <Card
            className={cn(
                "shadow-sm border-l-4 border-l-green-500 bg-card hover:bg-accent/5 transition-colors cursor-pointer group",
                className
            )}
            onClick={onOpen}
        >
            <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
                    <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{resume.fileName}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-green-50 text-green-700 border-green-200">
                            Verified
                        </Badge>
                        <span>• {resume.lastUpdated}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onOpen(); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
            </CardContent>
        </Card>
    )
}

// Helper Field Component for the Drawer
export const Field = ({ label, value, isEdit, onCopy, copied }: any) => (
    <div className="space-y-1.5 group cursor-pointer" onClick={!isEdit ? onCopy : undefined}>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
        {isEdit ? (
            <Input defaultValue={value} />
        ) : (
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                <span className="text-sm font-medium truncate">{value}</span>
                {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500 animate-in zoom-in" />
                ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
        )}
    </div>
)
