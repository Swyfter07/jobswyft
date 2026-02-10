import React from "react"
import {
    FormInput,
    CheckCircle2,
    AlertCircle,
    Circle,
    Zap,
    RotateCcw,
    RefreshCw,
    Sparkles,
    Loader2,
    MousePointer2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export interface AutofillField {
    id: string
    label: string
    value?: string
    selector?: string
    status: "ready" | "missing" | "filled"
    category: "personal" | "resume" | "questions"
}

export interface AutofillProps {
    fields?: AutofillField[]
    isFilling?: boolean
    isScanning?: boolean
    isSegmenting?: boolean
    isInspecting?: boolean
    statusMessage?: { title: string; text?: string; type: 'success' | 'info' | 'error' }
    onFill?: () => void
    onUndo?: () => void
    onUndoDismiss?: () => void
    onScan?: () => void
    onManualMap?: () => void
    onFieldClick?: (field: AutofillField) => void // Click handler for manual mapping
    className?: string
}

const DEFAULT_FIELDS: AutofillField[] = [
    { id: "1", label: "Full Name", value: "Alex Chen", status: "ready", category: "personal" },
    { id: "2", label: "Email", value: "alex@example.com", status: "ready", category: "personal" },
    { id: "3", label: "Phone", value: "+1 (555) 123-4567", status: "ready", category: "personal" },
    { id: "4", label: "Resume", value: "Senior_Product_Designer.pdf", status: "ready", category: "resume" },
    // { id: "5", label: "Cover Letter", status: "missing", category: "resume" },
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

function AnalyzingState({ isScanning, isSegmenting }: { isScanning: boolean, isSegmenting: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px] animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center border-2 border-emerald-500/20">
                    {isScanning ? (
                        <RefreshCw className="size-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                    ) : (
                        <Sparkles className="size-8 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                    )}
                </div>
            </div>
            <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-foreground">
                    {isScanning ? "Scanning Application..." : "AI Refining Fields..."}
                </h3>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                    {isScanning
                        ? "Finding all those form fields for you."
                        : "Smart-categorizing fields and cleaning up duplicates."}
                </p>
            </div>
            <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500/40 animate-bounce" />
                <span className="size-1.5 rounded-full bg-emerald-500/60 animate-bounce [animation-delay:0.2s]" />
                <span className="size-1.5 rounded-full bg-emerald-500/80 animate-bounce [animation-delay:0.4s]" />
            </div>
        </div>
    )
}

export function Autofill({
    fields = DEFAULT_FIELDS,
    isFilling = false,
    isScanning = false,
    isSegmenting = false,
    isInspecting = false,
    statusMessage,
    onFill,
    onUndo,
    onUndoDismiss,
    onScan,
    onManualMap,
    onFieldClick,
    className
}: AutofillProps) {
    const personalFields = fields.filter(f => f.category === "personal")
    const resumeFields = fields.filter(f => f.category === "resume")
    const questionFields = fields.filter(f => f.category === "questions")

    // Calculate progress
    const readyCount = fields.filter(f => f.status === "ready" || f.status === "filled").length
    const totalCount = fields.length

    // During scanning or segmenting, totalCount might be 0 initially
    const progress = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0

    const FieldGroup = ({ title, items }: { title: string, items: AutofillField[] }) => {
        if (items.length === 0) return null
        return (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground px-1">{title}</h4>
                <div className="flex flex-wrap gap-2">
                    {items.map((field, index) => {
                        const isQuestion = field.category === "questions"
                        const isClickable = isQuestion && field.status === "missing" && onFieldClick

                        return (
                            <div
                                key={field.id}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border",
                                    "transition-all duration-300 ease-in-out animate-in fade-in zoom-in-95",
                                    isClickable ? "cursor-pointer hover:scale-105 hover:shadow-md" : "cursor-default",
                                    field.status === "missing"
                                        ? "bg-destructive/10 border-destructive/20 text-destructive dark:bg-destructive/20 dark:border-destructive/30 dark:text-destructive-foreground"
                                        : field.status === "filled"
                                            ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300 animate-pulse-once"
                                            : "bg-card border-border text-foreground hover:border-muted-foreground/50"
                                )}
                                title={isClickable ? "Click to map field" : field.value}
                                onClick={() => isClickable && onFieldClick?.(field)}
                            >
                                <StatusIcon status={field.status} />
                                <span>{field.label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <Card className={cn("flex flex-col overflow-hidden dark:bg-card p-0 gap-0 shadow-xl", className)}>
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
                                {isScanning || isSegmenting
                                    ? "Analyzing application..."
                                    : `${readyCount}/${totalCount} fields ready`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Manual Map Button */}
                        <Button
                            variant={isInspecting ? "default" : "ghost"}
                            size="icon"
                            className={cn(
                                "h-7 w-7 group",
                                isInspecting ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-muted-foreground"
                            )}
                            onClick={onManualMap}
                            disabled={isScanning || isSegmenting}
                            title="Select field from page"
                        >
                            <MousePointer2 className="size-3.5" />
                        </Button>
                        {/* Scan Page Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 group"
                            onClick={onScan}
                            disabled={isScanning || isSegmenting}
                            title="Scan page for fields"
                        >
                            {(isScanning || isSegmenting) ? (
                                <Loader2 className="size-3.5 text-muted-foreground animate-spin" />
                            ) : (
                                <RefreshCw className="size-3.5 text-muted-foreground transition-transform group-hover:rotate-180 duration-300" />
                            )}
                        </Button>
                        {/* Undo Action */}
                        <Button variant="ghost" size="icon" className="h-7 w-7 group" onClick={onUndo} title="Undo last fill">
                            <RotateCcw className="size-3.5 text-muted-foreground transition-transform group-hover:-rotate-45 duration-200" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 relative flex-1 min-h-0 overflow-y-auto">
                {/* Status/Undo Banner - shows for notifications */}
                {statusMessage && (
                    <div className={cn(
                        "p-3 border-b animate-in slide-in-from-top duration-300",
                        statusMessage.type === 'success' ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900" :
                            statusMessage.type === 'error' ? "bg-destructive/10 border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30" :
                                "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900"
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {statusMessage.type === 'success' ? (
                                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                                ) : statusMessage.type === 'error' ? (
                                    <AlertCircle className="size-4 text-destructive" />
                                ) : (
                                    <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
                                )}
                                <span className={cn(
                                    "text-sm font-semibold",
                                    statusMessage.type === 'success' ? "text-emerald-700 dark:text-emerald-300" :
                                        statusMessage.type === 'error' ? "text-destructive" :
                                            "text-blue-700 dark:text-blue-300"
                                )}>
                                    {statusMessage.title}
                                </span>
                            </div>
                            {statusMessage.type === 'success' && onUndo && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-200/50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-900"
                                    onClick={() => {
                                        onUndo?.()
                                        onUndoDismiss?.()
                                    }}
                                >
                                    <RotateCcw className="mr-1.5 size-3" />
                                    Undo
                                </Button>
                            )}
                        </div>
                        {statusMessage.text && (
                            <p className={cn(
                                "text-[10px] mt-0.5 ml-6",
                                statusMessage.type === 'success' ? "text-emerald-600/70 dark:text-emerald-400/70" :
                                    statusMessage.type === 'error' ? "text-destructive/70" :
                                        "text-blue-600/70 dark:text-blue-400/70"
                            )}>
                                {statusMessage.text}
                            </p>
                        )}
                    </div>
                )}

                {isScanning || isSegmenting ? (
                    <AnalyzingState isScanning={isScanning} isSegmenting={isSegmenting} />
                ) : totalCount === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px] text-center">
                        <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center">
                            <FormInput className="size-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium">No fields detected</h3>
                            <p className="text-xs text-muted-foreground px-4">
                                Navigate to an application page and click scan to begin.
                            </p>
                        </div>
                        <Button onClick={onScan} variant="outline" size="sm">
                            <RefreshCw className="mr-2 size-3" />
                            Scan Page
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 space-y-6 pb-40">
                        <FieldGroup title="Personal Info" items={personalFields} />
                        {resumeFields.length > 0 && <Separator />}
                        <FieldGroup title="Resume & Documents" items={resumeFields} />
                        {questionFields.length > 0 && <Separator />}
                        <FieldGroup title="Questions" items={questionFields} />
                    </div>
                )}
            </CardContent>

            {/* Fixed Action Footer */}
            <div className="p-4 border-t bg-background relative z-20">
                <Button
                    size="lg"
                    className={cn(
                        "w-full shadow-lg h-14 transition-all duration-200",
                        isFilling
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 cursor-not-allowed"
                            : (isScanning || isSegmenting || readyCount === 0)
                                ? "bg-emerald-600/80 text-white/90 cursor-wait"
                                : "bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] hover:shadow-emerald-500/30 text-white font-bold text-base border-t border-white/10 shadow-emerald-500/20 active:scale-[0.98]"
                    )}
                    onClick={(e) => {
                        if (isScanning || isSegmenting || readyCount === 0) return;
                        onFill?.();
                    }}
                    disabled={isFilling}
                    title={isScanning || isSegmenting ? "Analyzing form..." : readyCount === 0 ? "No fields detected" : "Fill all detected fields"}
                >
                    {isFilling || isScanning || isSegmenting ? (
                        <>
                            <Zap className="mr-2 size-4 animate-pulse text-white" />
                            {isFilling ? "Filling..." : "Analyzing..."}
                        </>
                    ) : (
                        <>
                            <Zap className="mr-2 size-4" />
                            Fill Application
                        </>
                    )}
                </Button>
            </div>
        </Card>
    )
}
