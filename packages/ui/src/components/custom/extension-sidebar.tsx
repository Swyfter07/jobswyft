import React from "react"
import { Search, Sparkles, FormInput, Bot, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { CreditBar, CreditBarProps } from "./credit-bar"
import { SidebarTabs } from "./sidebar-tabs"

export interface ExtensionSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    header: React.ReactNode
    contextContent?: React.ReactNode // Persistent top section (e.g. Resume)
    scanContent?: React.ReactNode
    studioContent?: React.ReactNode
    autofillContent?: React.ReactNode
    coachContent?: React.ReactNode
    isLocked?: boolean
    defaultTab?: string
    activeTab?: string
    onTabChange?: (tab: string) => void
    /** Credit bar configuration - shows at bottom when provided */
    creditBar?: {
        credits: number
        maxCredits?: number
        onBuyMore?: () => void
    }
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
    creditBar,
    className,
    ...props
}: ExtensionSidebarProps) {
    const [internalTab, setInternalTab] = React.useState(defaultTab)
    const [isContextExpanded, setIsContextExpanded] = React.useState(true)
    const currentTab = props.activeTab ?? internalTab
    const handleTabChange = (val: string) => {
        setInternalTab(val)
        setIsContextExpanded(false) // Automatically collapse context when switching tabs
        props.onTabChange?.(val)
    }

    // Auto-collapse logic: Collapse context section when main content is scrolled
    const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget
        if (isContextExpanded && target.scrollTop > 20) {
            setIsContextExpanded(false)
        }
    }

    // Enhance contextContent with controlled state if it's a compatible component
    const enhancedContext = React.isValidElement(contextContent)
        ? React.cloneElement(contextContent as React.ReactElement<any>, {
            isOpen: isContextExpanded,
            onOpenChange: (open: boolean) => setIsContextExpanded(open)
        })
        : contextContent

    return (
        <aside
            className={cn(
                "fixed right-0 top-0 h-screen w-[400px] bg-background flex flex-col z-50 border-l shadow-2xl",
                className
            )}
            {...props}
        >
            {/* Header Section */}
            {!props.children && (
                <div className="p-2 bg-background z-10">
                    {header}
                </div>
            )}

            {/* Context Section (e.g. Resume) - Independent Scroll Area (Option 1) */}
            {!props.children && contextContent && (
                <div className="relative z-20 bg-muted/30 dark:bg-muted/50 border-b border-border/50">
                    <div className="max-h-[40vh] overflow-y-auto overflow-x-hidden p-3 transition-all duration-300">
                        {enhancedContext}
                    </div>
                </div>
            )}

            {props.children ? (
                <div className="flex-1 overflow-hidden">
                    {props.children}
                </div>
            ) : (
                <Tabs value={currentTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
                    <div className="px-3 pt-3 pb-2 bg-background z-10">
                        <SidebarTabs isLocked={isLocked} />
                    </div>

                    <div
                        className="flex-1 overflow-y-auto bg-muted/20 dark:bg-muted/40"
                        aria-live="polite"
                        aria-atomic="false"
                        onScroll={handleMainScroll}
                    >
                        <TabsContent value="scan" className="h-full mt-0 p-3 space-y-3 animate-tab-content">
                            {scanContent}
                        </TabsContent>
                        <TabsContent value="ai-studio" className="h-full mt-0 p-3 space-y-3 animate-tab-content">
                            {studioContent}
                        </TabsContent>
                        <TabsContent value="autofill" className="h-full mt-0 p-3 space-y-3 animate-tab-content">
                            {autofillContent}
                        </TabsContent>
                        <TabsContent value="coach" className="h-full mt-0 p-3 space-y-3 animate-tab-content">
                            {coachContent}
                        </TabsContent>
                    </div>
                </Tabs>
            )}

            {/* Credit Bar - Fixed at bottom */}
            {creditBar && (
                <CreditBar
                    credits={creditBar.credits}
                    maxCredits={creditBar.maxCredits}
                    onBuyMore={creditBar.onBuyMore}
                />
            )}
        </aside>
    )
}
