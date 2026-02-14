import type { Meta, StoryObj } from "@storybook/react-vite"
import { Coach } from "./coach"

const meta = {
    title: "Custom/Coach",
    component: Coach,
    parameters: {
        layout: "centered",
        viewport: { defaultViewport: "extensionDefault" },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="w-[360px] h-[500px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Coach>

export default meta
type Story = StoryObj<typeof meta>

const mockMessages = [
    {
        id: "1",
        role: "user" as const,
        content: "What are the key skills for this role?",
        timestamp: new Date(),
    },
    {
        id: "2",
        role: "assistant" as const,
        content: "Based on the job description, the key skills are: React, TypeScript, and experience with REST APIs. The role also values leadership and communication skills.",
        timestamp: new Date(),
    },
]

export const Default: Story = {
    args: {
        isLocked: false,
    },
}

export const WithMessages: Story = {
    args: {
        isLocked: false,
        initialMessages: mockMessages,
    },
}

export const Locked: Story = {
    args: {
        isLocked: true,
    },
}

export const Loading: Story = {
    args: {
        isLocked: false,
        initialMessages: [
            {
                id: "1",
                role: "user" as const,
                content: "Analyze this job for me",
                timestamp: new Date(),
            },
        ],
    },
}

export const DarkMode: Story = {
    decorators: [
        (Story) => (
            <div className="dark w-[360px] h-[500px] bg-background rounded-xl p-4">
                <Story />
            </div>
        ),
    ],
    args: {
        isLocked: false,
    },
}

export const ExtensionViewport: Story = {
    parameters: {
        viewport: { defaultViewport: "extensionDefault" },
    },
    decorators: [
        (Story) => (
            <div className="w-[360px] h-[600px]">
                <Story />
            </div>
        ),
    ],
    args: {
        isLocked: false,
    },
}
