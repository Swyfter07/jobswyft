import type { Meta, StoryObj } from "@storybook/react-vite"
import { AIStudio } from "./ai-studio"

const meta = {
    title: "Custom/AIStudio",
    component: AIStudio,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        isLocked: { control: "boolean" },
        isGenerating: { control: "boolean" },
        creditBalance: { control: "number" },
        onUnlock: { action: "unlock" },
        onGenerate: { action: "generate" },
        onReset: { action: "reset" },
        onTabChange: { action: "tab changed" },
    },
    decorators: [
        (Story) => (
            <div className="w-[400px] p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof AIStudio>

export default meta
type Story = StoryObj<typeof meta>

export const Locked: Story = {
    args: {
        isLocked: true,
        creditBalance: 5,
    },
}

export const Unlocked: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
    },
}

export const MatchTab: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "match",
        matchData: {
            score: 85,
            matchedSkills: ["React", "TypeScript", "Tailwind", "Node.js"],
            missingSkills: ["GraphQL", "AWS"],
        },
    },
}

export const CoverLetterTab: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "cover-letter",
    },
}

export const AnswerTab: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "answer",
    },
}

export const OutreachTab: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "outreach",
    },
}

export const Generating: Story = {
    args: {
        isLocked: false,
        isGenerating: true,
        generatingLabel: "Generating cover letter...",
        creditBalance: 5,
        defaultTab: "cover-letter",
    },
}

export const LowMatch: Story = {
    args: {
        isLocked: false,
        creditBalance: 2,
        defaultTab: "match",
        matchData: {
            score: 35,
            matchedSkills: ["JavaScript"],
            missingSkills: ["React", "TypeScript", "GraphQL", "AWS", "Docker"],
        },
    },
}
