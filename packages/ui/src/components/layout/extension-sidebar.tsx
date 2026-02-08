import React from "react"
import { Search, Sparkles, FormInput, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface ExtensionSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    header: React.ReactNode
    contextContent?: React.ReactNode
    scanContent?: React.ReactNode
    studioContent?: React.ReactNode
    autofillContent?: React.ReactNode
    coachContent?: React.ReactNode
    isLocked?: boolean
    defaultTab?: string
    activeTab?: string
    onTabChange?: (tab: string) => void
}

function TabIcon({ locked, children }: { locked?: boolean; children: React.ReactNode }) {
    return (
        <div className={cn("flex items-center justify-center", locked && "opacity-50")}>
            {children}
        </div>
    )
}

export function ExtensionSidebar({
    header,
    contextContent,
    scanContent,
    studioContent,
    autofillContent,
    coachContent,
    isLocked = false,
    defaultTab = "scan",
    activeTab,
    onTabChange,
    className,
    children,
    ...domProps
}: ExtensionSidebarProps) {
    const [internalTab, setInternalTab] = React.useState(defaultTab)
    const [isContextExpanded, setIsContextExpanded] = React.useState(true)
    const currentTab = activeTab ?? internalTab

    const handleTabChange = (val: string) => {
        setInternalTab(val)
        setIsContextExpanded(false)
        onTabChange?.(val)
    }

    const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (isContextExpanded && e.currentTarget.scrollTop > 80) {
            setIsContextExpanded(false)
        }
    }

    // Inject controlled collapse props into contextContent
    const enhancedContext = contextContent && React.isValidElement(contextContent)
        ? React.cloneElement(contextContent as React.ReactElement<Record<string, unknown>>, {
            isOpen: isContextExpanded,
            onOpenChange: setIsContextExpanded,
        })
        : contextContent

    return (
        <aside
            className={cn(
                "fixed right-0 top-0 h-screen w-full bg-background flex flex-col z-50 border-l shadow-2xl",
                className
            )}
            {...domProps}
        >
            {/* Header Section */}
            {!children && (
                <div className="p-2 bg-background z-10">
                    {header}
                </div>
            )}

            {/* Context Section (e.g. Resume) — grows naturally, shrinks when collapsed */}
            {!children && contextContent && (
                <div className="bg-muted/30 dark:bg-muted/50 overflow-y-auto overflow-x-hidden shrink-0 scroll-fade-y scrollbar-hidden">
                    <div className="px-2 py-1">
                        {enhancedContext}
                    </div>
                </div>
            )}

            {children ? (
                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            ) : (
                <Tabs value={currentTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden min-h-[200px]">
                    <div className="px-3 pt-3 pb-2 bg-background border-b z-10">
                        <TabsList className="w-full grid grid-cols-4 h-9">
                            <TabsTrigger value="scan" className="text-xs gap-1.5 px-1">
                                <Search className="size-4" />
                                <span className="hidden sm:inline">Scan</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="ai-studio"
                                className={cn("text-xs gap-1.5 px-1", isLocked && "text-muted-foreground")}
                                disabled={isLocked}
                            >
                                <TabIcon locked={isLocked}>
                                    <Sparkles className="size-4" />
                                </TabIcon>
                                <span className="hidden sm:inline">Studio</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="autofill"
                                className={cn("text-xs gap-1.5 px-1", isLocked && "text-muted-foreground")}
                                disabled={isLocked}
                            >
                                <TabIcon locked={isLocked}>
                                    <FormInput className="size-4" />
                                </TabIcon>
                                <span className="hidden sm:inline">Autofill</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="coach"
                                className={cn("text-xs gap-1.5 px-1", isLocked && "text-muted-foreground")}
                                disabled={isLocked}
                            >
                                <TabIcon locked={isLocked}>
                                    <Bot className="size-4" />
                                </TabIcon>
                                <span className="hidden sm:inline">Coach</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* aria-live="polite" on container ensures screen reader announces tab changes.
                        Custom forceMount + hidden pattern preserves state but may affect ARIA.
                        Manual QA required: Test with NVDA/VoiceOver to verify announcements. */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-fade-y scrollbar-hidden bg-muted/20 dark:bg-muted/40" aria-live="polite" aria-atomic="true" onScroll={handleMainScroll}>
                        <TabsContent value="scan" forceMount className={cn("h-full mt-0 p-3 space-y-3 animate-tab-content", currentTab !== "scan" && "hidden")} aria-hidden={currentTab !== "scan"}>
                            {scanContent}
                        </TabsContent>
                        <TabsContent value="ai-studio" forceMount className={cn("h-full mt-0 p-3 space-y-3 animate-tab-content", currentTab !== "ai-studio" && "hidden")} aria-hidden={currentTab !== "ai-studio"}>
                            {studioContent}
                        </TabsContent>
                        <TabsContent value="autofill" forceMount className={cn("h-full mt-0 p-3 space-y-3 animate-tab-content", currentTab !== "autofill" && "hidden")} aria-hidden={currentTab !== "autofill"}>
                            {autofillContent}
                        </TabsContent>
                        <TabsContent value="coach" forceMount className={cn("h-full mt-0 p-3 space-y-3 animate-tab-content", currentTab !== "coach" && "hidden")} aria-hidden={currentTab !== "coach"}>
                            {coachContent}
                        </TabsContent>
                    </div>
                </Tabs>
            )}
        </aside>
    )
}
