import type { Meta, StoryObj } from "@storybook/react-vite"
import { Coach } from "./coach"

const meta = {
    title: "Features/Coach",
    component: Coach,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        isLocked: { control: "boolean" },
    },
} satisfies Meta<typeof Coach>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
    args: {
        className: "w-[350px] h-[500px]",
    },
}

export const Conversation: Story = {
    args: {
        className: "w-[350px] h-[500px]",
        initialMessages: [
            {
                id: "1",
                role: "user",
                content: "Can you help me understand the key requirements for this Product Designer role?",
                timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
            },
            {
                id: "2",
                role: "assistant",
                content: "Based on the job description, the key requirements are 5+ years of experience with Figma, a strong portfolio demonstrating design systems, and experience working in an agile environment. They also mention React knowledge as a nice-to-have.",
                timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 mins ago
            },
            {
                id: "3",
                role: "user",
                content: "How should I highlight my design system experience?",
                timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 min ago
            },
        ],
    },
}

export const Locked: Story = {
    args: {
        className: "w-[350px] h-[500px]",
        isLocked: true,
    },
}
