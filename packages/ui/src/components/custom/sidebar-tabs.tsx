import React from "react"
import { Search, Sparkles, FormInput, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs as TabsPrimitive } from "radix-ui"

export interface SidebarTabsProps {
    isLocked?: boolean
    className?: string
    variant?: "classic" | "unified" | "horizontal"
}

export function SidebarTabs({ isLocked = false, className, variant = "classic" }: SidebarTabsProps) {
    const tabs = [
        {
            value: "scan" as const,
            label: "Scan",
            icon: Search,
            activeColor: "data-[state=active]:bg-blue-500 data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/50 data-[state=active]:border-blue-500 dark:data-[state=active]:bg-blue-400 dark:data-[state=active]:shadow-blue-400/60 dark:data-[state=active]:border-blue-400",
            inactiveColor: "text-tab-foreground border-tab-border hover:bg-tab-bg-hover hover:text-foreground hover:border-foreground/20",
        },
        {
            value: "ai-studio" as const,
            label: "Studio",
            icon: Sparkles,
            activeColor: "data-[state=active]:bg-violet-600 data-[state=active]:shadow-xl data-[state=active]:shadow-violet-600/50 data-[state=active]:border-violet-600 dark:data-[state=active]:bg-violet-500 dark:data-[state=active]:shadow-violet-500/60 dark:data-[state=active]:border-violet-500",
            inactiveColor: "text-tab-foreground border-tab-border hover:bg-tab-bg-hover hover:text-foreground hover:border-foreground/20",
        },
        {
            value: "autofill" as const,
            label: "Autofill",
            icon: FormInput,
            activeColor: "data-[state=active]:bg-emerald-600 data-[state=active]:shadow-xl data-[state=active]:shadow-emerald-600/50 data-[state=active]:border-emerald-600 dark:data-[state=active]:bg-emerald-500 dark:data-[state=active]:shadow-emerald-500/60 dark:data-[state=active]:border-emerald-500",
            inactiveColor: "text-tab-foreground border-tab-border hover:bg-tab-bg-hover hover:text-foreground hover:border-foreground/20",
        },
        {
            value: "coach" as const,
            label: "Coach",
            icon: Bot,
            activeColor: "data-[state=active]:bg-orange-500 data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/50 data-[state=active]:border-orange-500 dark:data-[state=active]:bg-orange-400 dark:data-[state=active]:shadow-orange-400/60 dark:data-[state=active]:border-orange-400",
            inactiveColor: "text-tab-foreground border-tab-border hover:bg-tab-bg-hover hover:text-foreground hover:border-foreground/20",
        }
    ]

    if (variant === "unified") {
        return (
            <TabsPrimitive.List className={cn(
                "w-full flex justify-between gap-2.5 h-auto p-1.5 bg-muted/40 dark:bg-muted/10 backdrop-blur-sm rounded-2xl border border-border/50 shadow-inner",
                className
            )}>
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isDisabled = isLocked && tab.value !== "scan"
                    return (
                        <TabsPrimitive.Trigger
                            key={tab.value}
                            value={tab.value}
                            disabled={isDisabled}
                            className={cn(
                                "flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-xl transition-all duration-300 h-auto min-h-0 relative group outline-none",
                                "data-[state=active]:shadow-xl data-[state=active]:text-white data-[state=active]:scale-[1.08] active:scale-90",
                                tab.activeColor,
                                "text-muted-foreground/50 hover:text-foreground bg-transparent",
                                isDisabled && "opacity-40 grayscale pointer-events-none"
                            )}
                        >
                            <Icon className="size-4 group-hover:scale-125 active:scale-95 transition-transform duration-200" />
                            <span className="text-[10px] font-bold leading-none">{tab.label}</span>
                        </TabsPrimitive.Trigger>
                    )
                })}
            </TabsPrimitive.List>
        )
    }

    if (variant === "horizontal") {
        return (
            <TabsPrimitive.List className={cn("w-full flex flex-col gap-3.5 h-auto p-0 bg-transparent", className)}>
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isDisabled = isLocked && tab.value !== "scan"
                    return (
                        <TabsPrimitive.Trigger
                            key={tab.value}
                            value={tab.value}
                            disabled={isDisabled}
                            className={cn(
                                "w-full flex flex-row items-center gap-3 py-2 px-3 rounded-xl transition-all duration-300 h-auto min-h-0 border text-left group outline-none",
                                "data-[state=active]:shadow-xl data-[state=active]:text-white data-[state=active]:translate-x-1.5 active:scale-[0.95]",
                                tab.activeColor,
                                tab.inactiveColor,
                                isDisabled && "opacity-40 grayscale pointer-events-none"
                            )}
                        >
                            <Icon className="size-[18px] group-hover:scale-115 active:scale-90 transition-transform duration-200" />
                            <span className="text-sm font-semibold leading-none flex-1">{tab.label}</span>
                        </TabsPrimitive.Trigger>
                    )
                })}
            </TabsPrimitive.List>
        )
    }

    // Classic (Default Refined)
    return (
        <TabsPrimitive.List className={cn("w-[92%] mx-auto flex justify-between gap-3 h-auto p-0 bg-transparent", className)}>
            {tabs.map((tab) => {
                const Icon = tab.icon
                const isDisabled = isLocked && tab.value !== "scan"
                return (
                    <TabsPrimitive.Trigger
                        key={tab.value}
                        value={tab.value}
                        disabled={isDisabled}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg transition-all duration-300 h-auto min-h-0 border group outline-none",
                            "data-[state=active]:shadow-2xl data-[state=active]:text-white data-[state=active]:scale-[1.10] active:scale-90",
                            tab.activeColor,
                            tab.inactiveColor,
                            isDisabled && "opacity-40 grayscale pointer-events-none"
                        )}
                    >
                        <Icon className="size-[18px] group-hover:scale-125 active:scale-90 transition-transform duration-200" />
                        <span className="text-xs font-bold leading-none">{tab.label}</span>
                    </TabsPrimitive.Trigger>
                )
            })}
        </TabsPrimitive.List>
    )
}
