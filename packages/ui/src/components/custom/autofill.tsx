import React from "react"
import {
    FormInput,
    CheckCircle2,
    AlertCircle,
    Circle,
    Zap,
    RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export interface AutofillField {
    id: string
    label: string
    value?: string
    status: "ready" | "missing" | "filled"
    category: "personal" | "resume" | "questions"
}

export interface AutofillProps {
    fields?: AutofillField[]
    isFilling?: boolean
    showUndoPrompt?: boolean
    onFill?: () => void
    onUndo?: () => void
    onUndoDismiss?: () => void
    className?: string
}

const DEFAULT_FIELDS: AutofillField[] = [
    { id: "1", label: "Full Name", value: "Alex Chen", status: "ready", category: "personal" },
    { id: "2", label: "Email", value: "alex@example.com", status: "ready", category: "personal" },
    { id: "3", label: "Phone", value: "+1 (555) 123-4567", status: "ready", category: "personal" },
    { id: "4", label: "Resume", value: "Senior_Product_Designer.pdf", status: "ready", category: "resume" },
    { id: "5", label: "Cover Letter", status: "missing", category: "resume" },
    { id: "6", label: "LinkedIn URL", value: "linkedin.com/in/alex", status: "filled", category: "questions" },
    { id: "7", label: "Portfolio", value: "alex.design", status: "ready", category: "questions" },
]

function StatusIcon({ status }: { status: AutofillField["status"] }) {
    switch (status) {
        case "ready":
            return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
        case "missing":
            return <AlertCircle className="size-4 text-destructive" />
        case "filled":
            return <CheckCircle2 className="size-4 text-muted-foreground opacity-50" />
        default:
            return <Circle className="size-4 text-muted-foreground" />
    }
}

export function Autofill({
    fields = DEFAULT_FIELDS,
    isFilling = false,
    showUndoPrompt = false,
    onFill,
    onUndo,
    onUndoDismiss,
    className
}: AutofillProps) {
    const personalFields = fields.filter(f => f.category === "personal")
    const resumeFields = fields.filter(f => f.category === "resume")
    const questionFields = fields.filter(f => f.category === "questions")

    // Calculate progress
    const readyCount = fields.filter(f => f.status === "ready" || f.status === "filled").length
    const totalCount = fields.length
    const progress = Math.round((readyCount / totalCount) * 100)

    const FieldGroup = ({ title, items }: { title: string, items: AutofillField[] }) => {
        if (items.length === 0) return null
        return (
            <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground px-1">{title}</h4>
                <div className="flex flex-wrap gap-2">
                    {items.map((field) => (
                        <div
                            key={field.id}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-default",
                                field.status === "missing"
                                    ? "bg-destructive/10 border-destructive/20 text-destructive dark:bg-destructive/20 dark:border-destructive/30 dark:text-destructive-foreground"
                                    : "bg-card border-border text-foreground hover:border-muted-foreground/50",
                                field.status === "filled" && "bg-muted text-muted-foreground border-transparent"
                            )}
                            title={field.value}
                        >
                            <StatusIcon status={field.status} />
                            <span className="truncate max-w-[120px]">{field.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <Card className={cn("flex flex-col h-full overflow-hidden dark:bg-card p-0 gap-0 shadow-xl", className)}>
            <CardHeader className="border-b px-4 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center size-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                            <FormInput className="size-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-bold text-foreground">
                                Autofill
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground">
                                {readyCount}/{totalCount} fields ready
                            </p>
                        </div>
                    </div>
                    {/* Undo Action if needed */}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onUndo} title="Undo last fill">
                        <RotateCcw className="size-3.5 text-muted-foreground" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 relative">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-6 pb-20">
                        <FieldGroup title="Personal Info" items={personalFields} />
                        {resumeFields.length > 0 && <Separator />}
                        <FieldGroup title="Resume & Documents" items={resumeFields} />
                        {questionFields.length > 0 && <Separator />}
                        <FieldGroup title="Questions" items={questionFields} />
                    </div>
                </ScrollArea>

                {/* Undo Success Banner - shows after fill completes */}
                {showUndoPrompt && (
                    <div className="absolute top-0 left-0 right-0 p-3 bg-green-50 border-b border-green-200 dark:bg-green-950 dark:border-green-800 animate-tab-content">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                    Application filled!
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-green-700 hover:text-green-800 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-200 dark:hover:bg-green-900"
                                onClick={() => {
                                    onUndo?.()
                                    onUndoDismiss?.()
                                }}
                            >
                                <RotateCcw className="mr-1.5 size-3" />
                                Undo
                            </Button>
                        </div>
                        <p className="text-[10px] text-green-600/70 dark:text-green-400/70 mt-1">
                            Auto-dismissing in 10 seconds...
                        </p>
                    </div>
                )}

                {/* Floating Action Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
                    <Button
                        size="lg"
                        className={cn(
                            "w-full shadow-lg transition-all",
                            isFilling
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                                : "bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 hover:from-emerald-700 hover:via-emerald-600 hover:to-emerald-500 text-white font-semibold py-6 text-base border-t border-white/20 shadow-lg hover:shadow-lg hover:shadow-emerald-500/40 transition-all duration-300"
                        )}
                        onClick={onFill}
                        disabled={isFilling || readyCount === 0}
                    >
                        {isFilling ? (
                            <>
                                <Zap className="mr-2 size-4 animate-pulse" />
                                Filling...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 size-4" />
                                Fill Application
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
