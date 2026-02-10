import React from "react"
import { Search, Sparkles, FormInput, Bot, ChevronUp, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { CreditBar, CreditBarProps } from "./credit-bar"
import { SidebarTabs } from "./sidebar-tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export interface ExtensionSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Mode: 'sidepanel' for Chrome sidepanel, 'overlay' for injected overlay */
    mode?: 'sidepanel' | 'overlay'
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
    apiKey?: string
    onApiKeyChange?: (key: string) => void
}

function TabIcon({ locked, children }: { locked?: boolean; children: React.ReactNode }) {
    return (
        <div className={cn("flex items-center justify-center", locked && "opacity-50")}>
            {children}
        </div>
    )
}

export function ExtensionSidebar({
    mode = 'overlay',
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
    apiKey,
    onApiKeyChange,
    activeTab,
    onTabChange,
    ...props
}: ExtensionSidebarProps) {
    const [internalTab, setInternalTab] = React.useState(defaultTab)
    const [isContextExpanded, setIsContextExpanded] = React.useState(true)
    const [sidebarWidth, setSidebarWidth] = React.useState(400)
    const [isResizingWidth, setIsResizingWidth] = React.useState(false)

    const sidebarRef = React.useRef<HTMLDivElement>(null)

    const currentTab = activeTab ?? internalTab
    const handleTabChange = (val: string) => {
        setInternalTab(val)
        setIsContextExpanded(false)
        onTabChange?.(val)
    }

    // Horizontal Resizing (Width)
    const startWidthResize = React.useCallback((e: React.MouseEvent) => {
        setIsResizingWidth(true)
        e.preventDefault()
    }, [])


    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingWidth) {
                const newWidth = window.innerWidth - e.clientX
                if (newWidth >= 300 && newWidth <= 800) {
                    setSidebarWidth(newWidth)
                }
            }
        }

        const handleMouseUp = () => {
            setIsResizingWidth(false)
        }

        if (isResizingWidth) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
            document.body.style.cursor = "ew-resize"
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
            document.body.style.cursor = "default"
        }
    }, [isResizingWidth])

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
            ref={sidebarRef}
            style={mode === 'overlay' ? { width: `${sidebarWidth}px` } : undefined}
            className={cn(
                "bg-background flex flex-col z-50 transition-shadow",
                mode === 'overlay' && "fixed right-0 top-0 h-screen border-l shadow-2xl",
                mode === 'sidepanel' && "w-full h-full",
                className
            )}
            {...props}
        >
            {/* Horizontal Resize Handle - only in overlay mode */}
            {mode === 'overlay' && (
                <div
                    onMouseDown={startWidthResize}
                    className="absolute left-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-blue-500/30 transition-colors z-50"
                />
            )}

            {/* Header Section */}
            {!props.children && (
                <div className="p-2 bg-background z-10 flex items-center justify-between relative">
                    <div className="flex-1">{header}</div>
                </div>
            )}

            {/* Context Section (e.g. Resume) - Collapsible */}
            {!props.children && contextContent && (
                <div
                    className={cn(
                        "relative z-20 bg-background flex flex-col overflow-hidden",
                        !isContextExpanded && "h-auto"
                    )}
                    style={isContextExpanded ? { maxHeight: "400px" } : {}}
                >
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
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
                        <TabsContent value="autofill" className="mt-0 p-3 pb-0 animate-tab-content">
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
