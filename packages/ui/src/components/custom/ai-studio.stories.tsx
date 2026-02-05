import type { Meta, StoryObj } from "@storybook/react"
import { AIStudio } from "./ai-studio"

const meta = {
    title: "Custom/AIStudio",
    component: AIStudio,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        isLocked: {
            control: "boolean",
            description: "Whether the AI Studio is locked (pre-scan state)",
        },
        creditBalance: {
            control: "number",
            description: "Number of remaining AI credits",
        }
    },
} satisfies Meta<typeof AIStudio>

export default meta
type Story = StoryObj<typeof meta>

export const Locked: Story = {
    args: {
        isLocked: true,
        creditBalance: 5,
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const Unlocked: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const UnlockedMatch: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "match",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const UnlockedCoverLetter: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "cover-letter",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const UnlockedAnswer: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "answer",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const UnlockedOutreach: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "outreach",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}
