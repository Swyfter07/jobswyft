import type { Meta, StoryObj } from "@storybook/react"
import { SidebarTabs } from "./sidebar-tabs"
import { Tabs } from "@/components/ui/tabs"

const meta = {
    title: "Custom/SidebarTabs",
    component: SidebarTabs,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    decorators: [
        (StoryComponent) => (
            <div className="w-[400px] p-4 bg-background border rounded-lg shadow-sm">
                <Tabs defaultValue="scan">
                    <StoryComponent />
                </Tabs>
            </div>
        ),
    ],
} satisfies Meta<typeof SidebarTabs>

// Fix lint issues
export default meta
type Story = StoryObj<typeof meta>

export const Classic: Story = {
    args: {
        isLocked: false,
        variant: "classic",
    },
}

export const UnifiedGlassPill: Story = {
    args: {
        isLocked: false,
        variant: "unified",
    },
}

export const SleekHorizontal: Story = {
    args: {
        isLocked: false,
        variant: "horizontal",
    },
}

export const Locked: Story = {
    args: {
        isLocked: true,
        variant: "classic",
    },
}
