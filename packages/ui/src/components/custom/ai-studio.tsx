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

export interface AIStudioProps {
    isLocked?: boolean
    isGenerating?: boolean
    generatingLabel?: string
    className?: string
    creditBalance?: number
    defaultTab?: string
    onUnlock?: () => void
    activeTab?: string,
    onTabChange?: (tab: string) => void
}

export function AIStudio({
    isLocked = true,
    isGenerating = false,
    generatingLabel = "Generating...",
    className,
    creditBalance = 5,
    defaultTab = "match",
    onUnlock,
    ...props
}: AIStudioProps) {
    const [tone, setTone] = React.useState("professional")
    const [length, setLength] = React.useState("medium")

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

    // Controlled or uncontrolled
    const currentTab = props.activeTab ?? internalTab
    const handleTabChange = (val: string) => {
        setInternalTab(val)
        props.onTabChange?.(val)
    }

    return (
        <Card
            className={cn(
                "w-full overflow-hidden transition-all duration-300 dark:bg-card p-0 gap-0 shadow-xl",
                className
            )}
        >
            <CardHeader className="border-b px-4 py-3 space-y-0 flex flex-row items-center justify-between bg-violet-50/50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900">
                <div className="flex items-center gap-2">
                    <Wand2 className="size-4 text-primary" />
                    <CardTitle className="text-base font-bold text-foreground">
                        AI Studio
                    </CardTitle>

                </div>
                {!isLocked && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        title="Reset All"
                    >
                        <RotateCcw className="size-3.5" />
                    </Button>
                )}
            </CardHeader>

            <CardContent className="p-0">
                <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                    <div className="px-4 py-3">
                        <TabsList className="flex w-full items-center gap-1 rounded-full bg-muted/50 p-1 text-muted-foreground h-auto border border-border/50 backdrop-blur-sm shadow-sm">
                            <TabsTrigger
                                value="match"
                                className="group flex-1 flex gap-1.5 items-center justify-center rounded-full px-2 py-2.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-950/50 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/20 data-[state=active]:ring-2 data-[state=active]:ring-violet-500/20"
                            >
                                <Sparkles className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-xs font-medium">Match</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="cover-letter"
                                className="group flex-1 flex gap-1.5 items-center justify-center rounded-full px-2 py-2.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-950/50 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 data-[state=active]:ring-2 data-[state=active]:ring-blue-500/20"
                            >
                                <FileText className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-xs font-medium">Cover</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="answer"
                                className="group flex-1 flex gap-1.5 items-center justify-center rounded-full px-2 py-2.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-950/50 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20 data-[state=active]:ring-2 data-[state=active]:ring-emerald-500/20"
                            >
                                <MessageSquare className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-xs font-medium">Answer</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="outreach"
                                className="group flex-1 flex gap-1.5 items-center justify-center rounded-full px-2 py-2.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-orange-100 dark:data-[state=active]:bg-orange-950/50 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-300 data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/20 data-[state=active]:ring-2 data-[state=active]:ring-orange-500/20"
                            >
                                <Send className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-xs font-medium">Outreach</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="relative h-[300px]">
                        {/* Locked Overlay inside content area */}
                        {isLocked && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background p-6 text-center">
                                <div className="rounded-full bg-muted p-3 mb-3">
                                    <Lock className="size-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground mb-1">
                                    AI Studio Locked
                                </h3>
                                <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                                    Scan a job post to unlock tailored AI tools.
                                </p>
                                <Button
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-sm"
                                    onClick={onUnlock}
                                >
                                    <Sparkles className="mr-2 size-3.5" />
                                    Scan Job to Unlock
                                </Button>
                            </div>
                        )}

                        <ScrollArea className={cn("h-[400px]", isLocked && "opacity-20 pointer-events-none")}>
                            <div className="p-4 space-y-4">
                                <TabsContent value="match" className="mt-0 space-y-4 animate-tab-content">
                                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-foreground">Match Score</p>
                                            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">85%</p>
                                        </div>
                                        <div className="relative flex size-16 items-center justify-center rounded-full border-4 border-violet-200 bg-background text-xs font-bold text-violet-600 dark:border-violet-800 dark:text-violet-400">
                                            High
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Strengths</h4>
                                        <ul className="space-y-1">
                                            <li className="flex items-center gap-2 text-sm">
                                                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900">✓ React</Badge>
                                                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900">✓ TypeScript</Badge>
                                                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900">✓ Tailwind</Badge>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Gaps</h4>
                                        <ul className="space-y-1">
                                            <li className="flex items-center gap-2 text-sm">
                                                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900">! GraphQL</Badge>
                                                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900">! AWS</Badge>
                                            </li>
                                        </ul>
                                    </div>
                                </TabsContent>

                                <TabsContent value="cover-letter" className="mt-0 space-y-4 animate-tab-content">
                                    <SelectionChips
                                        label="Tone"
                                        items={tones}
                                        currentValue={tone}
                                        onChange={setTone}
                                        activeClassName="border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    />
                                    <SelectionChips
                                        label="Length"
                                        items={lengths}
                                        currentValue={length}
                                        onChange={setLength}
                                        activeClassName="border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    />

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Custom Instructions</label>
                                        <Textarea
                                            className="min-h-[60px]"
                                            placeholder="e.g. Highlight my leadership experience..."
                                        />
                                    </div>

                                    {isGenerating ? (
                                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                            <div className="flex items-center gap-2 text-primary">
                                                <Loader2 className="size-5 animate-spin" />
                                                <span className="text-sm font-medium">{generatingLabel}</span>
                                            </div>
                                            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">This may take a few seconds...</p>
                                        </div>
                                    ) : (
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                            <Wand2 className="mr-2 size-3.5" />
                                            Generate Draft (1 Credit)
                                        </Button>
                                    )}
                                </TabsContent>

                                <TabsContent value="answer" className="mt-0 space-y-4 animate-tab-content">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Application Question</label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-3 size-4 text-muted-foreground" />
                                            <Textarea
                                                className="min-h-[80px] pl-9"
                                                placeholder="Paste the question here..."
                                            />
                                        </div>
                                    </div>

                                    <SelectionChips
                                        label="Tone"
                                        items={tones}
                                        currentValue={tone}
                                        onChange={setTone}
                                        activeClassName="border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    />
                                    <SelectionChips
                                        label="Length"
                                        items={lengths}
                                        currentValue={length}
                                        onChange={setLength}
                                        activeClassName="border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    />

                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <Split className="mr-2 size-3.5" />
                                        Generate Answer (1 Credit)
                                    </Button>
                                </TabsContent>

                                <TabsContent value="outreach" className="mt-0 space-y-4 animate-tab-content">
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Recipient Role</label>
                                            <Input
                                                className="h-9"
                                                placeholder="e.g. Hiring Manager"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Platform</label>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="flex-1 active:border-orange-500 active:bg-orange-50 active:text-orange-700 border-orange-500 bg-orange-50 text-orange-700">
                                                    LinkedIn
                                                </Button>
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    Email
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <SelectionChips
                                        label="Tone"
                                        items={tones}
                                        currentValue={tone}
                                        onChange={setTone}
                                        activeClassName="border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                    />
                                    <SelectionChips
                                        label="Length"
                                        items={lengths}
                                        currentValue={length}
                                        onChange={setLength}
                                        activeClassName="border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                    />

                                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                        <Send className="mr-2 size-3.5" />
                                        Draft Message (1 Credit)
                                    </Button>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    )
}
