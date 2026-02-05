import type { Meta, StoryObj } from "@storybook/react"
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
        onSettingsClick: { action: "settings clicked" },
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

export const DarkMode: Story = {
    args: {
        isDarkMode: true,
    },
    parameters: {
        backgrounds: { default: 'dark' }
    }
}

export const CustomBranding: Story = {
    args: {
        appName: "CareerCoach AI",
        logo: <Sparkles className="size-6 text-purple-500" />,
        isDarkMode: false,
    },
}
