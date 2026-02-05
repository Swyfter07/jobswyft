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
    className?: string
    creditBalance?: number
    defaultTab?: string
    onUnlock?: () => void
    activeTab?: string,
    onTabChange?: (tab: string) => void
}

export function AIStudio({
    isLocked = true,
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
        onChange
    }: {
        label: string,
        items: { value: string, label: string }[],
        currentValue: string,
        onChange: (val: string) => void
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
                                ? "border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:border-orange-600 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900 dark:hover:text-orange-200"
                                : "text-muted-foreground hover:text-foreground hover:border-orange-200 dark:hover:border-orange-700"
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
                "w-full overflow-hidden border-2 border-orange-200 transition-all duration-300 dark:border-orange-900 dark:bg-card",
                className
            )}
        >
            <CardHeader className="border-b px-4 py-3 space-y-0 flex flex-row items-center justify-between bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/30 dark:to-transparent">
                <div className="flex items-center gap-2">
                    <Wand2 className="size-4 text-orange-500" />
                    <CardTitle className="text-base font-bold text-foreground">
                        AI Studio
                    </CardTitle>
                    {!isLocked && (
                        <Badge
                            variant="secondary"
                            className="ml-2 h-5 px-1.5 text-[10px] font-normal text-muted-foreground bg-white/50 border-orange-100 dark:bg-muted/50 dark:border-orange-900"
                        >
                            Powered by Gemini
                        </Badge>
                    )}
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
                        <TabsList className="flex w-full items-center gap-1 rounded-lg bg-secondary/50 p-1 text-muted-foreground h-auto">
                            <TabsTrigger
                                value="match"
                                className="flex-1 flex gap-1.5 items-center justify-center rounded-md px-2 py-2.5 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-2 data-[state=active]:border-orange-200 dark:data-[state=active]:border-orange-800"
                            >
                                <Sparkles className="size-3.5" />
                                <span className="text-xs font-medium">Match</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="cover-letter"
                                className="flex-1 flex gap-1.5 items-center justify-center rounded-md px-2 py-2.5 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-2 data-[state=active]:border-orange-200 dark:data-[state=active]:border-orange-800"
                            >
                                <FileText className="size-3.5" />
                                <span className="text-xs font-medium">Cover</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="answer"
                                className="flex-1 flex gap-1.5 items-center justify-center rounded-md px-2 py-2.5 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-2 data-[state=active]:border-orange-200 dark:data-[state=active]:border-orange-800"
                            >
                                <MessageSquare className="size-3.5" />
                                <span className="text-xs font-medium">Answer</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="outreach"
                                className="flex-1 flex gap-1.5 items-center justify-center rounded-md px-2 py-2.5 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-2 data-[state=active]:border-orange-200 dark:data-[state=active]:border-orange-800"
                            >
                                <Send className="size-3.5" />
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
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-sm"
                                    onClick={onUnlock}
                                >
                                    <Sparkles className="mr-2 size-3.5" />
                                    Scan Job to Unlock
                                </Button>
                            </div>
                        )}

                        <ScrollArea className={cn("h-[400px]", isLocked && "opacity-20 pointer-events-none")}>
                            <div className="p-4 space-y-4">
                                <TabsContent value="match" className="mt-0 space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50/50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-foreground">Match Score</p>
                                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">85%</p>
                                        </div>
                                        <div className="relative flex size-16 items-center justify-center rounded-full border-4 border-orange-200 bg-background text-xs font-bold text-orange-600 dark:border-orange-800 dark:text-orange-400">
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

                                <TabsContent value="cover-letter" className="mt-0 space-y-4">
                                    <SelectionChips
                                        label="Tone"
                                        items={tones}
                                        currentValue={tone}
                                        onChange={setTone}
                                    />
                                    <SelectionChips
                                        label="Length"
                                        items={lengths}
                                        currentValue={length}
                                        onChange={setLength}
                                    />

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Custom Instructions</label>
                                        <Textarea
                                            className="min-h-[60px]"
                                            placeholder="e.g. Highlight my leadership experience..."
                                        />
                                    </div>

                                    <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600">
                                        <Wand2 className="mr-2 size-3.5" />
                                        Generate Draft (1 Credit)
                                    </Button>
                                </TabsContent>

                                <TabsContent value="answer" className="mt-0 space-y-4">
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
                                    />
                                    <SelectionChips
                                        label="Length"
                                        items={lengths}
                                        currentValue={length}
                                        onChange={setLength}
                                    />

                                    <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600">
                                        <Split className="mr-2 size-3.5" />
                                        Generate Answer (1 Credit)
                                    </Button>
                                </TabsContent>

                                <TabsContent value="outreach" className="mt-0 space-y-4">
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
                                                <Button variant="outline" size="sm" className="flex-1 active:border-orange-500 active:bg-orange-50 active:text-orange-700 border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700 dark:active:bg-orange-900">
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
                                    />
                                    <SelectionChips
                                        label="Length"
                                        items={lengths}
                                        currentValue={length}
                                        onChange={setLength}
                                    />

                                    <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600">
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
