import React from "react"
import { Search, Sparkles, FormInput, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    className,
    ...props
}: ExtensionSidebarProps) {
    const [internalTab, setInternalTab] = React.useState(defaultTab)
    const currentTab = props.activeTab ?? internalTab
    const handleTabChange = (val: string) => {
        setInternalTab(val)
        props.onTabChange?.(val)
    }

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
                <div className="p-2 border-b bg-background z-10">
                    {header}
                </div>
            )}

            {/* Context Section (e.g. Resume) */}
            {!props.children && contextContent && (
                <div className="border-b bg-muted/30 dark:bg-muted/50 max-h-[40vh] overflow-y-auto custom-scrollbar">
                    <div className="p-3">
                        {contextContent}
                    </div>
                </div>
            )}

            {props.children ? (
                <div className="flex-1 overflow-hidden">
                    {props.children}
                </div>
            ) : (
                <Tabs value={currentTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-3 pt-3 pb-2 bg-background border-b z-10">
                        <TabsList className="w-full grid grid-cols-4 h-9">
                            <TabsTrigger value="scan" className="text-xs gap-1.5 px-1">
                                <Search className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Scan</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="ai-studio"
                                className={cn("text-xs gap-1.5 border-primary border-0 px-1", isLocked && "text-muted-foreground")}
                                disabled={isLocked}
                            >
                                <TabIcon locked={isLocked}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                </TabIcon>
                                <span className="hidden sm:inline">Studio</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="autofill"
                                className={cn("text-xs gap-1.5 px-1", isLocked && "text-muted-foreground")}
                                disabled={isLocked}
                            >
                                <TabIcon locked={isLocked}>
                                    <FormInput className="w-3.5 h-3.5" />
                                </TabIcon>
                                <span className="hidden sm:inline">Autofill</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="coach"
                                className={cn("text-xs gap-1.5 px-1", isLocked && "text-muted-foreground")}
                                disabled={isLocked}
                            >
                                <TabIcon locked={isLocked}>
                                    <Bot className="w-3.5 h-3.5" />
                                </TabIcon>
                                <span className="hidden sm:inline">Coach</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-muted/20 dark:bg-muted/40" aria-live="polite" aria-atomic="false">
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
        </aside>
    )
}
