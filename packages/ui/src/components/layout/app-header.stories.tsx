import type { Meta, StoryObj } from "@storybook/react-vite"
import { AppHeader } from "./app-header"
import { Sparkles } from "lucide-react"

const meta = {
    title: "Layout/AppHeader",
    component: AppHeader,
    parameters: {
        layout: "fullscreen",
        viewport: { defaultViewport: "extensionDefault" },
    },
    tags: ["autodocs"],
    argTypes: {
        onProfileClick: { action: "profile clicked" },
        onSignOut: { action: "sign out" },
        onThemeToggle: { action: "theme toggled" },
        onOpenDashboard: { action: "dashboard opened" },
        onReset: { action: "reset clicked" },
        onAutoScanToggle: { action: "auto-scan toggled" },
        onAutoAnalysisToggle: { action: "auto-analysis toggled" },
    },
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        isDarkMode: false,
    },
}

export const WithDashboardLink: Story = {
    args: {
        isDarkMode: false,
        onOpenDashboard: () => {},
    },
}

export const WithResetButton: Story = {
    args: {
        isDarkMode: false,
        resetButton: true,
        onOpenDashboard: () => {},
    },
}

export const DarkMode: Story = {
    args: {
        isDarkMode: true,
        resetButton: true,
        onOpenDashboard: () => {},
    },
}

export const CustomBranding: Story = {
    args: {
        appName: "CareerCoach AI",
        logo: <Sparkles className="size-5 text-ai-accent" />,
        isDarkMode: false,
    },
}

/** Auto-scan ON, Auto-analysis OFF */
export const AutoScanEnabled: Story = {
    name: "Auto-Scan: ON",
    args: {
        isDarkMode: false,
        autoScanEnabled: true,
        onAutoScanToggle: () => {},
        autoAnalysisEnabled: false,
        onAutoAnalysisToggle: () => {},
        resetButton: true,
        onOpenDashboard: () => {},
    },
}

/** Auto-scan OFF, Auto-analysis ON */
export const AutoAnalysisEnabled: Story = {
    name: "Auto-Analysis: ON",
    args: {
        isDarkMode: false,
        autoScanEnabled: false,
        onAutoScanToggle: () => {},
        autoAnalysisEnabled: true,
        onAutoAnalysisToggle: () => {},
        resetButton: true,
        onOpenDashboard: () => {},
    },
}

/** Both Auto-scan and Auto-analysis ON */
export const BothAutoFeaturesEnabled: Story = {
    name: "Both Auto Features: ON",
    args: {
        isDarkMode: false,
        autoScanEnabled: true,
        onAutoScanToggle: () => {},
        autoAnalysisEnabled: true,
        onAutoAnalysisToggle: () => {},
        resetButton: true,
        onOpenDashboard: () => {},
    },
}

/** Both Auto-scan and Auto-analysis ON, dark mode */
export const BothAutoFeaturesDark: Story = {
    name: "Both Auto Features: ON (Dark)",
    args: {
        isDarkMode: true,
        autoScanEnabled: true,
        onAutoScanToggle: () => {},
        autoAnalysisEnabled: true,
        onAutoAnalysisToggle: () => {},
        resetButton: true,
        onOpenDashboard: () => {},
    },
}

/** Full header with all actions visible */
export const FullHeader: Story = {
    name: "Full Header (All Actions)",
    args: {
        isDarkMode: false,
        autoScanEnabled: true,
        onAutoScanToggle: () => {},
        autoAnalysisEnabled: true,
        onAutoAnalysisToggle: () => {},
        resetButton: true,
        onOpenDashboard: () => {},
        onProfileClick: () => {},
    },
}
