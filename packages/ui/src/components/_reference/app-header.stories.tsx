import type { Meta, StoryObj } from "@storybook/react-vite"
import { AppHeader } from "./app-header"
import { Sparkles } from "lucide-react"

const meta = {
    title: "Custom/AppHeader",
    component: AppHeader,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
    argTypes: {
        onProfileClick: { action: "profile clicked" },
        onSignOut: { action: "sign out" },
        onThemeToggle: { action: "theme toggled" },
    },
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        isDarkMode: false,
    },
}

export const CustomBranding: Story = {
    args: {
        appName: "CareerCoach AI",
        logo: <Sparkles className="size-5 text-ai-accent" />,
        isDarkMode: false,
    },
}
