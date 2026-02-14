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
    footer?: React.ReactNode
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
    footer,
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
    const hasChangedTab = React.useRef(false)
    const currentTab = activeTab ?? internalTab

    const handleTabChange = (val: string) => {
        hasChangedTab.current = true
        setInternalTab(val)
        setIsContextExpanded(false)
        onTabChange?.(val)
    }

    const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
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
            {children ? (
                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            ) : (
                <>
                    {/* Header — shrink-0, never scrolls */}
                    <header className="shrink-0 p-2 bg-background z-10">
                        {header}
                    </header>

                    {/* Context Section (e.g. Resume) — shrink-0, collapses independently */}
                    {contextContent && (
                        <div className="shrink-0 bg-muted/30 dark:bg-muted/50 overflow-y-auto overflow-x-hidden scroll-fade-y scrollbar-hidden">
                            <div className="px-2 py-1">
                                {enhancedContext}
                            </div>
                        </div>
                    )}

                    <Tabs value={currentTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden min-h-[200px]">
                        {/* Tab Bar — shrink-0, never scrolls */}
                        <nav className="shrink-0 px-3 pt-3 pb-2 bg-background border-b z-10">
                            <TabsList className="w-full grid grid-cols-4 h-9">
                                <TabsTrigger value="scan" aria-label="Scan" className="text-xs gap-1.5 px-1">
                                    <Search className="size-4" />
                                    <span>Scan</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="ai-studio"
                                    aria-label="AI Studio"
                                    className={cn("text-xs gap-1.5 px-1", isLocked && "text-muted-foreground")}
                                    disabled={isLocked}
                                >
                                    <TabIcon locked={isLocked}>
                                        <Sparkles className="size-4" />
                                    </TabIcon>
                                    <span>Studio</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="autofill"
                                    aria-label="Autofill"
                                    className={cn("text-xs gap-1.5 px-1", isLocked && "text-muted-foreground")}
                                    disabled={isLocked}
                                >
                                    <TabIcon locked={isLocked}>
                                        <FormInput className="size-4" />
                                    </TabIcon>
                                    <span>Autofill</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="coach"
                                    aria-label="Coach"
                                    className={cn("text-xs gap-1.5 px-1", isLocked && "text-muted-foreground")}
                                    disabled={isLocked}
                                >
                                    <TabIcon locked={isLocked}>
                                        <Bot className="size-4" />
                                    </TabIcon>
                                    <span>Coach</span>
                                </TabsTrigger>
                            </TabsList>
                        </nav>

                        {/* Scrollable content area — flex-1, only region that scrolls */}
                        {/* forceMount + hidden pattern preserves DOM state across tab switches.
                            Radix TabsContent handles tabpanel ARIA roles automatically.
                            Manual QA required: Test with NVDA/VoiceOver to verify tab announcements. */}
                        <main
                            className="flex-1 overflow-y-auto overflow-x-hidden scroll-fade-y scrollbar-hidden bg-muted/20 dark:bg-muted/40"
                            onScroll={handleMainScroll}
                        >
                            <TabsContent value="scan" forceMount className={cn("h-full mt-0 p-3 space-y-3", hasChangedTab.current && "animate-tab-content", currentTab !== "scan" && "hidden")} aria-hidden={currentTab !== "scan"}>
                                {scanContent}
                            </TabsContent>
                            <TabsContent value="ai-studio" forceMount className={cn("h-full mt-0 p-3 space-y-3", hasChangedTab.current && "animate-tab-content", currentTab !== "ai-studio" && "hidden")} aria-hidden={currentTab !== "ai-studio"}>
                                {studioContent}
                            </TabsContent>
                            <TabsContent value="autofill" forceMount className={cn("h-full mt-0 p-3 space-y-3", hasChangedTab.current && "animate-tab-content", currentTab !== "autofill" && "hidden")} aria-hidden={currentTab !== "autofill"}>
                                {autofillContent}
                            </TabsContent>
                            <TabsContent value="coach" forceMount className={cn("h-full mt-0 p-3 space-y-3", hasChangedTab.current && "animate-tab-content", currentTab !== "coach" && "hidden")} aria-hidden={currentTab !== "coach"}>
                                {coachContent}
                            </TabsContent>
                        </main>
                    </Tabs>

                    {/* Footer (e.g. CreditBar) — shrink-0, never scrolls */}
                    {footer && (
                        <footer className="shrink-0">
                            {footer}
                        </footer>
                    )}
                </>
            )}
        </aside>
    )
}
