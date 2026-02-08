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
import { Separator } from "@/components/ui/separator"
import { IconBadge } from "@/components/blocks/icon-badge"

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
            return <CheckCircle2 className="size-4 text-success" />
        case "missing":
            return <AlertCircle className="size-4 text-warning" />
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

    const readyCount = fields.filter(f => f.status === "ready" || f.status === "filled").length
    const totalCount = fields.length

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
                                    ? "bg-warning/10 border-warning/20 text-warning"
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
        <Card className={cn("flex flex-col h-full border-2 border-card-accent-border shadow-sm overflow-hidden", className)}>
            <CardHeader className="border-b px-4 py-3 bg-gradient-to-r from-card-accent-bg to-transparent flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IconBadge icon={<FormInput />} variant="primary" size="md" />
                        <div>
                            <CardTitle className="text-sm font-bold text-foreground">
                                Autofill
                            </CardTitle>
                            <p className="text-micro text-muted-foreground">
                                {readyCount}/{totalCount} fields ready
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="size-7" onClick={onUndo} title="Undo last fill">
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

                {showUndoPrompt && (
                    <div className="absolute top-0 left-0 right-0 p-3 bg-success/10 border-b border-success/20 animate-tab-content">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-success" />
                                <span className="text-sm font-medium text-success">
                                    Application filled!
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-success hover:text-success hover:bg-success/10"
                                onClick={() => {
                                    onUndo?.()
                                    onUndoDismiss?.()
                                }}
                            >
                                <RotateCcw className="mr-1.5 size-3" />
                                Undo
                            </Button>
                        </div>
                        <p className="text-micro text-success/70 mt-1">
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
                            isFilling && "bg-primary/15 text-primary hover:bg-primary/20"
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
