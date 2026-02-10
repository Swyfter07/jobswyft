import React from "react"
import {
    Lock,
    Wand2,
    FileText,
    MessageSquare,
    Send,
    RotateCcw,
    Sparkles,
    Split,
    Loader2,
    AlertCircle,
    Copy,
    Check,
    Printer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export interface MatchAnalysis {
    score: number
    explanation: string
    missingSkills: string[]
    tips: string[]
}

export interface AIStudioProps {
    isLocked?: boolean
    isGenerating?: boolean
    generatingLabel?: string
    className?: string
    creditBalance?: number
    defaultTab?: string
    onUnlock?: () => void
    activeTab?: string
    onTabChange?: (tab: string) => void

    // Error state
    error?: string | null

    // Data Props
    matchAnalysis?: MatchAnalysis | null
    generatedContent?: {
        coverLetter?: string
        answer?: string
        outreach?: string
    }

    // Action Callbacks
    onAnalyzeMatch?: () => void
    onGenerateCoverLetter?: (params: { tone: string, length: string, instructions: string }) => void
    onGenerateAnswer?: (params: { question: string, tone: string, length: string }) => void
    onGenerateOutreach?: (params: { role: string, platform: string, tone: string, length: string }) => void
}

export function AIStudio({
    isLocked = true,
    isGenerating = false,
    generatingLabel = "Generating...",
    className,
    creditBalance = 5,
    defaultTab = "match",
    onUnlock,
    matchAnalysis,
    generatedContent,
    onAnalyzeMatch,
    onGenerateCoverLetter,
    onGenerateAnswer,
    onGenerateOutreach,
    error,
    ...props
}: AIStudioProps) {
    // State
    const [tone, setTone] = React.useState("professional")
    const [length, setLength] = React.useState("medium")
    const [instructions, setInstructions] = React.useState("")
    const [question, setQuestion] = React.useState("")
    const [role, setRole] = React.useState("")
    const [platform, setPlatform] = React.useState("linkedin_connection") // 'linkedin_connection', 'linkedin_inmail', 'email'

    // ... (keep constants tones, lengths, SelectionChips)

    const tones = [
        { value: "professional", label: "Professional" },
        { value: "casual", label: "Casual" },
        { value: "confident", label: "Confident" },
        { value: "friendly", label: "Friendly" },
    ]

    const lengths = [
        { value: "short", label: "Short" },
        { value: "medium", label: "Medium" },
        { value: "long", label: "Long" },
    ]

    const SelectionChips = ({
        label,
        items,
        currentValue,
        onChange,
        activeClassName
    }: {
        label: string,
        items: { value: string, label: string }[],
        currentValue: string,
        onChange: (val: string) => void,
        activeClassName?: string
    }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                    <Button
                        key={item.value}
                        variant="outline"
                        size="sm"
                        onClick={() => onChange(item.value)}
                        className={cn(
                            "h-7 px-2.5 text-xs rounded-full transition-all",
                            currentValue === item.value
                                ? (activeClassName || "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20")
                                : "text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        {item.label}
                    </Button>
                ))}
            </div>
        </div>
    )

    const [internalTab, setInternalTab] = React.useState(defaultTab)
    const [copiedField, setCopiedField] = React.useState<string | null>(null)

    const handleCopy = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    const handlePrintCoverLetter = (content: string) => {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Cover Letter</title>
                    <style>
                        body {
                            font-family: 'Times New Roman', Georgia, serif;
                            font-size: 12pt;
                            line-height: 1.6;
                            max-width: 8.5in;
                            margin: 1in auto;
                            padding: 0 0.5in;
                            color: #000;
                        }
                        p { margin: 0 0 1em 0; }
                        @media print {
                            body { margin: 0; padding: 0.5in; }
                        }
                    </style>
                </head>
                <body>
                    ${content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
                </body>
                </html>
            `)
            printWindow.document.close()
            printWindow.focus()
            printWindow.print()
        }
    }
    const currentTab = props.activeTab ?? internalTab
    const handleTabChange = (val: string) => {
        setInternalTab(val)
        props.onTabChange?.(val)
    }

    return (
        <Card className={cn("w-full overflow-hidden transition-all duration-300 dark:bg-card p-0 gap-0 shadow-xl flex flex-col", className)}>
            <CardHeader className="border-b px-4 py-3 space-y-0 flex flex-row items-center justify-between bg-violet-50/50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900">
                <div className="flex items-center gap-2">
                    <Wand2 className="size-4 text-primary" />
                    <CardTitle className="text-base font-bold text-foreground">AI Studio</CardTitle>
                </div>
                {!isLocked && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        title="Reset All"
                        onClick={() => {
                            setTone("professional")
                            setLength("medium")
                            setInstructions("")
                            setQuestion("")
                        }}
                    >
                        <RotateCcw className="size-3.5" />
                    </Button>
                )}
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col min-h-0">
                    <div className="px-4 py-3">
                        <TabsList className="flex w-full items-center gap-1 rounded-full bg-muted/50 p-1 text-muted-foreground h-auto border border-border/50 backdrop-blur-sm shadow-sm">
                            <TabsTrigger value="match" className="group flex-1 flex gap-1.5 items-center justify-center rounded-full px-2 py-2.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-950/50 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/20 data-[state=active]:ring-2 data-[state=active]:ring-violet-500/20">
                                <Sparkles className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-xs font-medium">Match</span>
                            </TabsTrigger>
                            <TabsTrigger value="cover-letter" className="group flex-1 flex gap-1.5 items-center justify-center rounded-full px-2 py-2.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-950/50 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 data-[state=active]:ring-2 data-[state=active]:ring-blue-500/20">
                                <FileText className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-xs font-medium">Cover</span>
                            </TabsTrigger>
                            <TabsTrigger value="answer" className="group flex-1 flex gap-1.5 items-center justify-center rounded-full px-2 py-2.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-950/50 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20 data-[state=active]:ring-2 data-[state=active]:ring-emerald-500/20">
                                <MessageSquare className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-xs font-medium">Answer</span>
                            </TabsTrigger>
                            <TabsTrigger value="outreach" className="group flex-1 flex gap-1.5 items-center justify-center rounded-full px-2 py-2.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-orange-100 dark:data-[state=active]:bg-orange-950/50 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-300 data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/20 data-[state=active]:ring-2 data-[state=active]:ring-orange-500/20">
                                <Send className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-xs font-medium">Outreach</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="relative flex-1 flex flex-col min-h-0">
                        {isLocked && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background p-6 text-center">
                                <div className="rounded-full bg-muted p-3 mb-3">
                                    <Lock className="size-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground mb-1">AI Studio Locked</h3>
                                <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">Scan a job post to unlock tailored AI tools.</p>
                                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-sm" onClick={onUnlock}>
                                    <Sparkles className="mr-2 size-3.5" />
                                    Scan Job to Unlock
                                </Button>
                            </div>
                        )}

                        <ScrollArea className={cn("flex-1 min-h-0", isLocked && "opacity-20 pointer-events-none")}>
                            <div className="p-4 space-y-4">
                                <TabsContent value="match" className="mt-0 space-y-4 animate-tab-content">
                                    {error ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                                                <AlertCircle className="size-6 text-destructive" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-semibold text-foreground">Analysis Failed</h3>
                                                <p className="text-sm text-muted-foreground max-w-[250px]">{error}</p>
                                            </div>
                                            <Button onClick={onAnalyzeMatch} variant="outline">
                                                <RotateCcw className="size-4 mr-2" />
                                                Try Again
                                            </Button>
                                        </div>
                                    ) : matchAnalysis ? (
                                        <>
                                            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-foreground">Match Score</p>
                                                    <p className={cn("text-2xl font-bold",
                                                        matchAnalysis.score >= 80 ? "text-green-600 dark:text-green-400" :
                                                            matchAnalysis.score >= 50 ? "text-yellow-600 dark:text-yellow-400" :
                                                                "text-red-600 dark:text-red-400"
                                                    )}>{matchAnalysis.score}%</p>
                                                </div>
                                                <div className={cn("relative flex size-16 items-center justify-center rounded-full border-4 text-xs font-bold",
                                                    matchAnalysis.score >= 80 ? "border-green-200 bg-background text-green-600 dark:border-green-800 dark:text-green-400" :
                                                        matchAnalysis.score >= 50 ? "border-yellow-200 bg-background text-yellow-600 dark:border-yellow-800 dark:text-yellow-400" :
                                                            "border-red-200 bg-background text-red-600 dark:border-red-800 dark:text-red-400"
                                                )}>
                                                    {matchAnalysis.score >= 80 ? "High" : matchAnalysis.score >= 50 ? "Med" : "Low"}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Analysis</h4>
                                                <p className="text-sm text-foreground">{matchAnalysis.explanation}</p>
                                            </div>

                                            {matchAnalysis.missingSkills.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">Critical Gaps</h4>
                                                    <ul className="space-y-1">
                                                        {matchAnalysis.missingSkills.map((skill, i) => (
                                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900">! {skill}</Badge>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {matchAnalysis.tips.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">Improvement Tips</h4>
                                                    <ul className="space-y-1 pl-4 list-disc text-sm text-muted-foreground">
                                                        {matchAnalysis.tips.map((tip, i) => (
                                                            <li key={i}>{tip}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                            <p className="text-sm text-muted-foreground">Scan a job to see how you match.</p>
                                            <Button onClick={onAnalyzeMatch} disabled={isGenerating}>
                                                {isGenerating ? <Loader2 className="animate-spin size-4 mr-2" /> : <Sparkles className="size-4 mr-2" />}
                                                Analyze Match
                                            </Button>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="cover-letter" className="mt-0 space-y-4 animate-tab-content flex-1 flex flex-col min-h-0">
                                    {generatedContent?.coverLetter ? (
                                        <div className="space-y-3 flex flex-col">
                                            <div className="relative" style={{ minHeight: '50vh' }}>
                                                <Textarea
                                                    value={generatedContent.coverLetter}
                                                    readOnly
                                                    className="h-full w-full text-sm leading-relaxed resize-y pr-20"
                                                    style={{ minHeight: '50vh' }}
                                                />
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleCopy(generatedContent.coverLetter!, 'coverLetter')}
                                                        title="Copy to clipboard"
                                                    >
                                                        {copiedField === 'coverLetter' ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() => handlePrintCoverLetter(generatedContent.coverLetter!)}
                                                        title="Print as PDF"
                                                    >
                                                        <Printer className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <Button variant="outline" className="w-full shrink-0" onClick={() => onGenerateCoverLetter?.({ tone, length, instructions })}>
                                                <RotateCcw className="mr-2 size-3.5" /> Regenerate
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <SelectionChips label="Tone" items={tones} currentValue={tone} onChange={setTone} activeClassName="border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100" />
                                            <SelectionChips label="Length" items={lengths} currentValue={length} onChange={setLength} activeClassName="border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100" />
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">Custom Instructions</label>
                                                <Textarea className="min-h-[60px] text-sm" placeholder="e.g. Highlight my leadership experience..." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                                            </div>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isGenerating} onClick={() => onGenerateCoverLetter?.({ tone, length, instructions })}>
                                                {isGenerating ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Wand2 className="mr-2 size-3.5" />}
                                                {isGenerating ? generatingLabel : "Generate Draft (1 Credit)"}
                                            </Button>
                                        </>
                                    )}
                                </TabsContent>

                                <TabsContent value="answer" className="mt-0 space-y-4 animate-tab-content">
                                    {generatedContent?.answer ? (
                                        <div className="space-y-3">
                                            <div className="relative" style={{ minHeight: '50vh' }}>
                                                <Textarea
                                                    value={generatedContent.answer}
                                                    readOnly
                                                    className="h-full w-full text-sm leading-relaxed resize-y pr-10"
                                                    style={{ minHeight: '50vh' }}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleCopy(generatedContent.answer!, 'answer')}
                                                    title="Copy to clipboard"
                                                >
                                                    {copiedField === 'answer' ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                                                </Button>
                                            </div>
                                            <Button variant="outline" className="w-full" onClick={() => onGenerateAnswer?.({ question, tone, length })}>
                                                <RotateCcw className="mr-2 size-3.5" /> Regenerate
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">Application Question</label>
                                                <div className="relative">
                                                    <MessageSquare className="absolute left-3 top-3 size-4 text-muted-foreground" />
                                                    <Textarea className="min-h-[80px] pl-9 text-sm" placeholder="Paste the question here..." value={question} onChange={(e) => setQuestion(e.target.value)} />
                                                </div>
                                            </div>
                                            <SelectionChips label="Tone" items={tones} currentValue={tone} onChange={setTone} activeClassName="border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" />
                                            <SelectionChips label="Length" items={lengths} currentValue={length} onChange={setLength} activeClassName="border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" />
                                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isGenerating || !question.trim()} onClick={() => onGenerateAnswer?.({ question, tone, length })}>
                                                {isGenerating ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Split className="mr-2 size-3.5" />}
                                                {isGenerating ? generatingLabel : "Generate Answer (1 Credit)"}
                                            </Button>
                                        </>
                                    )}
                                </TabsContent>

                                <TabsContent value="outreach" className="mt-0 space-y-4 animate-tab-content">
                                    {generatedContent?.outreach ? (
                                        <div className="space-y-3">
                                            <div className="relative" style={{ minHeight: '50vh' }}>
                                                <Textarea
                                                    value={generatedContent.outreach}
                                                    readOnly
                                                    className="h-full w-full text-sm leading-relaxed resize-y pr-10"
                                                    style={{ minHeight: '50vh' }}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleCopy(generatedContent.outreach!, 'outreach')}
                                                    title="Copy to clipboard"
                                                >
                                                    {copiedField === 'outreach' ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                                                </Button>
                                            </div>
                                            <Button variant="outline" className="w-full" onClick={() => onGenerateOutreach?.({ role, platform, tone, length })}>
                                                <RotateCcw className="mr-2 size-3.5" /> Regenerate
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-muted-foreground">Recipient Role</label>
                                                    <Input className="h-9 text-sm" placeholder="e.g. Hiring Manager" value={role} onChange={(e) => setRole(e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-muted-foreground">Platform</label>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" className={cn("flex-1", platform === 'linkedin_connection' && "border-orange-500 bg-orange-50 text-orange-700")} onClick={() => setPlatform('linkedin_connection')}>LinkedIn Connect</Button>
                                                        <Button variant="outline" size="sm" className={cn("flex-1", platform === 'linkedin_inmail' && "border-orange-500 bg-orange-50 text-orange-700")} onClick={() => setPlatform('linkedin_inmail')}>InMail</Button>
                                                        <Button variant="outline" size="sm" className={cn("flex-1", platform === 'email' && "border-orange-500 bg-orange-50 text-orange-700")} onClick={() => setPlatform('email')}>Email</Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <SelectionChips label="Tone" items={tones} currentValue={tone} onChange={setTone} activeClassName="border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100" />
                                            <SelectionChips label="Length" items={lengths} currentValue={length} onChange={setLength} activeClassName="border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100" />
                                            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={isGenerating} onClick={() => onGenerateOutreach?.({ role, platform, tone, length })}>
                                                {isGenerating ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Send className="mr-2 size-3.5" />}
                                                {isGenerating ? generatingLabel : "Draft Message (1 Credit)"}
                                            </Button>
                                        </>
                                    )}
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    )
}
